import { prisma } from '@/lib/prisma';
import type { PaymentReason } from './payments.types';

export const paymentsRepository = {
  async findEventForPayment(eventId: string, organizerId: string) {
    return prisma.event.findUnique({ where: { id: eventId } }).then((e) =>
      e && e.organizerId === organizerId ? e : null,
    );
  },

  async createPayment(data: {
    userId: string;
    eventId: string | null;
    provider: string;
    providerRef: string;
    amount: number;
    currency: string;
    reason: PaymentReason;
  }): Promise<void> {
    await prisma.payment.create({ data: { ...data, status: 'created' } });
  },

  async findByProviderRef(providerRef: string) {
    return prisma.payment.findFirst({ where: { providerRef } });
  },

  async updateStatusByProviderRef(providerRef: string, status: string): Promise<void> {
    await prisma.payment.updateMany({ where: { providerRef }, data: { status } });
  },
};
