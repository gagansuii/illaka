export type PaymentReason = 'subscription' | 'hosting_fee' | 'promotion';
export type PaymentStatus = 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';

export type InitiatePaymentInput = {
  reason: PaymentReason;
  currency: string;
  eventId?: string;
  userId: string;
};

export type PaymentRecord = {
  id: string;
  userId: string;
  eventId: string | null;
  provider: string;
  providerRef: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  reason: PaymentReason;
};

export type WebhookPayload = {
  event: string;
  orderId: string;
  status: string;
  amount: number | null;
};
