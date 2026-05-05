export type PaymentReason = 'subscription' | 'hosting_fee' | 'promotion';

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
  status: string;
  reason: string;
};

export type WebhookPayload = {
  event: string;
  orderId: string;
  status: string;
  amount: number | null;
};
