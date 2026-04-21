import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { TicketClient } from './TicketClient';

export default async function TicketPage({ params }: { params: Promise<{ rsvpId: string }> }) {
  const { rsvpId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  let rsvp: any = null;

  try {
    rsvp = await prisma.rSVP.findUnique({
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
            ticketPrice: true,
            paymentQrUrl: true,
            organizer: { select: { name: true } }
          }
        }
      }
    });
  } catch {
    // Fallback: query without columns that may not exist in older DBs
    try {
      const rsvpBase = await prisma.rSVP.findUnique({
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
              organizer: { select: { name: true } }
            }
          }
        }
      });
      if (rsvpBase) {
        rsvp = { ...rsvpBase, ticketId: rsvpBase.id };
        (rsvp.event as any).paymentQrUrl = null;
      }
    } catch (fallbackErr) {
      console.error('Ticket query failed:', fallbackErr);
    }
  }

  if (!rsvp) {
    return <div className="p-8 text-center text-muted">Ticket not found.</div>;
  }

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  if (rsvp.userId !== userId && role !== 'ADMIN') {
    return <div className="p-8 text-center text-muted">Access denied.</div>;
  }

  // Fetch payment record if any
  let payment: { amount: number; currency: string; status: string } | null = null;
  try {
    const p = await prisma.payment.findFirst({
      where: { userId: rsvp.userId, eventId: rsvp.eventId, status: 'PAID' },
      select: { amount: true, currency: true, status: true }
    });
    payment = p;
  } catch {
    // Payment table might not have data — non-critical
  }

  const ticketData = {
    ticketId: rsvp.ticketId ?? rsvp.id,
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
      isPaid: rsvp.event.isPaid ?? false,
      ticketPrice: rsvp.event.ticketPrice ?? null,
      paymentQrUrl: rsvp.event.paymentQrUrl ?? null,
      organizer: rsvp.event.organizer
    },
    payment
  };

  return <TicketClient ticket={ticketData} />;
}
