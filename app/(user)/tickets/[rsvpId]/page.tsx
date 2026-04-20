import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { TicketClient } from './TicketClient';

export default async function TicketPage({ params }: { params: Promise<{ rsvpId: string }> }) {
  const { rsvpId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const rsvp = await prisma.rSVP.findUnique({
    where: { id: rsvpId },
    include: {
      user: { select: { name: true, email: true } },
      event: {
        select: {
          id: true,
          title: true,
          description: true,
          startTime: true,
          endTime: true,
          latitude: true,
          longitude: true,
          isPaid: true,
          paymentQrUrl: true,
          organizer: { select: { name: true } }
        }
      }
    }
  });

  if (!rsvp) {
    return <div className="p-8 text-center text-muted">Ticket not found.</div>;
  }

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  if (rsvp.userId !== userId && role !== 'ADMIN') {
    return <div className="p-8 text-center text-muted">Access denied.</div>;
  }

  // Fetch payment for this user+event if any (e.g. Razorpay payment, reason='event')
  const payment = await prisma.payment.findFirst({
    where: { userId: rsvp.userId, eventId: rsvp.eventId, status: 'PAID' },
    select: { amount: true, currency: true, status: true }
  });

  const ticketData = {
    ticketId: rsvp.ticketId,
    rsvpId: rsvp.id,
    eventId: rsvp.eventId,
    createdAt: rsvp.createdAt.toISOString(),
    user: rsvp.user,
    event: {
      title: rsvp.event.title,
      description: rsvp.event.description,
      startTime: rsvp.event.startTime.toISOString(),
      endTime: rsvp.event.endTime.toISOString(),
      latitude: rsvp.event.latitude,
      longitude: rsvp.event.longitude,
      isPaid: rsvp.event.isPaid,
      paymentQrUrl: rsvp.event.paymentQrUrl,
      organizer: rsvp.event.organizer
    },
    payment: payment
      ? { amount: payment.amount, currency: payment.currency, status: payment.status }
      : null
  };

  return <TicketClient ticket={ticketData} />;
}
