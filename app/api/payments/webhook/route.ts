import { NextResponse } from 'next/server';
import { paymentsService } from '@/src/modules/payments/payments.service';
import { handleError } from '@/src/core/response';

export async function POST(req: Request) {
  const signature = req.headers.get('x-razorpay-signature');
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  const body = await req.text();

  try {
    await paymentsService.handleWebhook(body, signature);
    return NextResponse.json({ received: true });
  } catch (err) {
    return handleError(err);
  }
}
