import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import type { PaymentStatus } from '@/src/modules/payments/payments.types';
const SUCCESS_PAYMENT_STATUSES: PaymentStatus[] = ['captured'];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const organizerId = session.user.id;

  try {
    const [totalEvents, totalRegistrations, revenue, upcomingEvents] = await Promise.all([
      prisma.event.count({
        where: { organizerId }
      }),
      // RSVP is the registration table in this project.
      prisma.rSVP.count({
        where: { event: { organizerId } }
      }),
      prisma.payment.aggregate({
        where: {
          event: { organizerId },
          status: { in: SUCCESS_PAYMENT_STATUSES }
        },
        _sum: { amount: true }
      }),
      prisma.event.count({
        where: {
          organizerId,
          startTime: { gt: new Date() }
        }
      })
    ]);

    return NextResponse.json({
      total_events: totalEvents,
      total_registrations: totalRegistrations,
      total_revenue: revenue._sum?.amount ?? 0,
      upcoming_events: upcomingEvents
    });
  } catch (err) {
    console.error('Organizer dashboard failed:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
