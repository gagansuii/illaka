import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ rsvpId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { rsvpId } = await params;

  // Try full query first; fall back to base columns if ticketId/paymentQrUrl
  // haven't been migrated to the production database yet.
  let rsvp: any = null;

  try {
    rsvp = await prisma.rSVP.findUnique({
      where: { id: rsvpId },
      include: {
        user: { select: { name: true, email: true } },
        event: {
          select: {
            title: true,
            description: true,
            startTime: true,
            endTime: true,
            latitude: true,
            longitude: true,
            paymentQrUrl: true,
            organizer: { select: { name: true, email: true } }
          }
        }
      }
    });
  } catch {
    try {
      const base = await prisma.rSVP.findUnique({
        where: { id: rsvpId },
        include: {
          user: { select: { name: true, email: true } },
          event: {
            select: {
              title: true,
              description: true,
              startTime: true,
              endTime: true,
              latitude: true,
              longitude: true,
              organizer: { select: { name: true, email: true } }
            }
          }
        }
      });
      if (base) {
        rsvp = { ...base, ticketId: base.id };
        (rsvp.event as any).paymentQrUrl = null;
      }
    } catch (fallbackErr) {
      console.error('Ticket fetch failed:', fallbackErr);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
  }

  if (!rsvp) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  if (rsvp.userId !== userId && role !== 'ADMIN' && role !== 'ORGANIZER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  return NextResponse.json({
    ticketId: rsvp.ticketId ?? rsvp.id,
    rsvpId: rsvp.id,
    eventId: rsvp.eventId,
    createdAt: rsvp.createdAt,
    user: rsvp.user,
    event: {
      ...rsvp.event,
      startTime: rsvp.event.startTime.toISOString(),
      endTime: rsvp.event.endTime.toISOString()
    }
  });
}
