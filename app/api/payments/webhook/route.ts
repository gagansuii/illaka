import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { getEnv } from '@/lib/config';

const ALLOWED_STATUSES = new Set(['created', 'authorized', 'captured', 'refunded', 'failed']);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('x-razorpay-signature');

  // Reject immediately if signature header is absent — prevents null-bypass attacks.
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let secret: string;
  try {
    secret = getEnv('RAZORPAY_WEBHOOK_SECRET');
  } catch {
    return NextResponse.json({ error: 'Webhook secret is not configured' }, { status: 503 });
  }

  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  // Use timing-safe comparison to prevent timing attacks on the HMAC.
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch (err) {
    return NextResponse.json({ error: 'Malformed JSON' }, { status: 400 });
  }
  const webhookEvent = payload.event;
  const entity = payload.payload?.payment?.entity;
  const orderId = entity?.order_id;
  const status = entity?.status;
  const webhookAmount: unknown = entity?.amount;

  // Only act on known payment events with a valid order reference and status
  if (
    typeof webhookEvent === 'string' &&
    webhookEvent.startsWith('payment.') &&
    orderId &&
    ALLOWED_STATUSES.has(status)
  ) {
    // Verify the amount Razorpay reports matches what we stored when the order
    // was created. Without this check an attacker who can send arbitrary webhook
    // bodies (or replay a manipulated payload) could mark any payment as captured
    // regardless of the actual amount charged.
    let stored;
    try {
      stored = await prisma.payment.findFirst({ where: { providerRef: orderId } });
    } catch (err) {
      console.error('Webhook payment lookup failed:', err);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    if (!stored) {
      // Unknown order — acknowledge but take no action
      return NextResponse.json({ received: true });
    }
    if (typeof webhookAmount === 'number' && webhookAmount !== stored.amount) {
      console.error('Webhook amount mismatch', {
        orderId,
        expected: stored.amount,
        received: webhookAmount
      });
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
    }

    try {
      await prisma.payment.updateMany({
        where: { providerRef: orderId },
        data: { status }
      });
    } catch (err) {
      console.error('Webhook payment update failed:', err);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
