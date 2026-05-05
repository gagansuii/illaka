import crypto from 'crypto';
import { getEnv, getEnvOptional } from '@/lib/config';
import { getRazorpayClient, isRazorpayConfigured } from '@/lib/razorpay';
import { authService } from '@/src/modules/auth/auth.service';
import { analytics } from '@/lib/posthog';
import { ServiceError } from '@/src/core/errors';
import { logger } from '@/src/core/logger';
import { paymentsRepository } from './payments.repository';
import type { InitiatePaymentInput, PaymentReason } from './payments.types';

const ALLOWED_STATUSES = new Set(['created', 'authorized', 'captured', 'refunded', 'failed']);

// Amounts match the NEXT_PUBLIC_ env vars so UI price and charged price are always in sync
function getAmount(reason: PaymentReason): number {
  const amounts: Record<PaymentReason, number> = {
    subscription: parseInt(process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE ?? '49900', 10),
    hosting_fee: parseInt(process.env.NEXT_PUBLIC_HOSTING_FEE_AMOUNT ?? '25000', 10),
    promotion: parseInt(process.env.NEXT_PUBLIC_PROMOTION_PRICE ?? '15000', 10),
  };
  return amounts[reason] ?? 49900;
}

export const paymentsService = {
  async initiatePayment(input: InitiatePaymentInput): Promise<{
    orderId: string;
    keyId: string;
    amount: number;
    upiVpa: string | null;
  }> {
    if (!isRazorpayConfigured()) throw ServiceError.serviceUnavailable('Payments are not configured');

    // Block unverified users from paying (gated by env var)
    await authService.requireEmailVerified(input.userId);

    const isEventPayment = input.reason === 'hosting_fee' || input.reason === 'promotion';
    if (isEventPayment && !input.eventId) {
      throw ServiceError.badRequest('Event is required for this payment type');
    }

    if (isEventPayment && input.eventId) {
      const event = await paymentsRepository.findEventForPayment(input.eventId, input.userId);
      if (!event) throw ServiceError.forbidden();
    }

    const amount = getAmount(input.reason);
    const razorpay = getRazorpayClient();

    let order: { id: string };
    try {
      order = await razorpay.orders.create({
        amount,
        currency: input.currency.toUpperCase(),
        receipt: `illaka_${Date.now()}`,
      });
    } catch (err) {
      logger.error('Razorpay order creation failed', { error: String(err) });
      throw new ServiceError('Payment provider error', 'PAYMENT_PROVIDER', 502);
    }

    try {
      await paymentsRepository.createPayment({
        userId: input.userId,
        eventId: isEventPayment ? (input.eventId ?? null) : null,
        provider: 'razorpay',
        providerRef: order.id,
        amount,
        currency: input.currency.toUpperCase(),
        reason: input.reason,
      });
    } catch (err) {
      logger.error('Failed to persist payment', { orderId: order.id, error: String(err) });
      throw ServiceError.badRequest('Internal error');
    }

    analytics.paymentInitiated(input.userId, { reason: input.reason, amount, currency: input.currency });

    return {
      orderId: order.id,
      keyId: getEnv('RAZORPAY_KEY_ID'),
      amount,
      upiVpa: getEnvOptional('RAZORPAY_UPI_VPA') ?? null,
    };
  },

  async handleWebhook(body: string, signature: string): Promise<void> {
    let secret: string;
    try {
      secret = getEnv('RAZORPAY_WEBHOOK_SECRET');
    } catch {
      throw ServiceError.serviceUnavailable('Webhook secret is not configured');
    }

    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      throw ServiceError.badRequest('Invalid signature');
    }

    let payload: unknown;
    try { payload = JSON.parse(body); } catch {
      throw ServiceError.badRequest('Malformed JSON');
    }

    const p = payload as Record<string, unknown>;
    const webhookEvent = p.event as string | undefined;
    const entity = (p.payload as Record<string, unknown>)?.payment as Record<string, unknown> | undefined;
    const entity_ = entity?.entity as Record<string, unknown> | undefined;
    const orderId = entity_?.order_id as string | undefined;
    const status = entity_?.status as string | undefined;
    const webhookAmount = entity_?.amount;

    if (
      typeof webhookEvent === 'string' &&
      webhookEvent.startsWith('payment.') &&
      orderId &&
      status &&
      ALLOWED_STATUSES.has(status)
    ) {
      const stored = await paymentsRepository.findByProviderRef(orderId);
      if (!stored) return; // unknown order — acknowledge and ignore

      if (typeof webhookAmount === 'number' && webhookAmount !== stored.amount) {
        logger.error('Webhook amount mismatch', { orderId, expected: stored.amount, received: webhookAmount });
        throw ServiceError.badRequest('Amount mismatch');
      }

      await paymentsRepository.updateStatusByProviderRef(orderId, status);
    }
  },
};
