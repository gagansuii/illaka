import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getRazorpayClient, isRazorpayConfigured } from '@/lib/razorpay';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getEnv } from '@/lib/config';

const schema = z.object({
  reason: z.enum(['subscription', 'hosting_fee', 'promotion']),
  currency: z.string().default('INR'),
  eventId: z.string().optional()
});

function getPaymentAmount(reason: 'subscription' | 'hosting_fee' | 'promotion'): number {
  // Use the same NEXT_PUBLIC_ env vars that the front-end uses so the price
  // shown in the UI always matches what is actually charged.  The previous
  // code read non-existent server-only names and fell back to incorrect
  // hardcoded amounts (e.g. subscription was 999 ₹ instead of 499 ₹).
  const amounts: Record<string, number> = {
    subscription: parseInt(process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE ?? '49900', 10),
    hosting_fee: parseInt(process.env.NEXT_PUBLIC_HOSTING_FEE_AMOUNT ?? '25000', 10),
    promotion: parseInt(process.env.NEXT_PUBLIC_PROMOTION_PRICE ?? '15000', 10)
  };
  return amounts[reason] || 49900;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isRazorpayConfigured()) {
    return NextResponse.json({ error: 'Payments are not configured' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const isEventPayment = parsed.data.reason === 'hosting_fee' || parsed.data.reason === 'promotion';
  if (isEventPayment && !parsed.data.eventId) {
    return NextResponse.json({ error: 'Event is required for this payment type' }, { status: 400 });
  }

  if (isEventPayment && parsed.data.eventId) {
    let event;
    try {
      event = await prisma.event.findUnique({ where: { id: parsed.data.eventId } });
    } catch (err) {
      console.error('Payment event lookup failed:', err);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    if (!event || event.organizerId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
  }

  // Keep event-linked payments tied to the event; subscription stays user-level.
  const paymentEventId = isEventPayment ? parsed.data.eventId ?? null : null;

  const amount = getPaymentAmount(parsed.data.reason);
  const razorpay = getRazorpayClient();
  let order;
  try {
    order = await razorpay.orders.create({
      amount,
      currency: parsed.data.currency.toUpperCase(),
      receipt: `illaka_${Date.now()}`
    });
  } catch (err) {
    console.error('Razorpay order creation failed', err);
    return NextResponse.json({ error: 'Payment provider error' }, { status: 502 });
  }

  try {
    await prisma.payment.create({
      data: {
        userId: session.user.id,
        eventId: paymentEventId,
        provider: 'razorpay',
        providerRef: order.id,
        amount,
        currency: parsed.data.currency.toUpperCase(),
        status: 'created',
        reason: parsed.data.reason
      }
    });
  } catch (err) {
    console.error('Failed to persist payment', err);
    // attempt to cancel order? skipping for brevity
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  return NextResponse.json({ orderId: order.id, keyId: getEnv('RAZORPAY_KEY_ID'), amount });
}
