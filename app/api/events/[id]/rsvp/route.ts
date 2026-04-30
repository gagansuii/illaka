import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { recalcEngagementScore } from '@/lib/engagement';
import { clearEventsCache } from '@/lib/events-cache';
import { sendTicketEmail } from '@/lib/mailer';
import { randomUUID } from 'crypto';
import { getDatabaseErrorDetails } from '@/lib/database-errors';

type RouteContext = { params: Promise<{ id: string }> };

class EventFullError extends Error {}

export async function POST(_: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let event: any;
  try {
    try {
      event = await prisma.event.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          capacity: true,
          visibility: true,
          organizerId: true,
          isPaid: true,
          ticketPrice: true,
          startTime: true,
          organizer: { select: { name: true } },
        }
      });
    } catch {
      // ticketPrice or organizer relation may not exist yet — fall back to base columns
      const base = await prisma.event.findUnique({
        where: { id },
        select: { id: true, title: true, capacity: true, visibility: true, organizerId: true, isPaid: true, startTime: true }
      });
      event = base ? { ...base, ticketPrice: null, organizer: null } : null;
    }
  } catch (err) {
    console.error('Event fetch failed:', err);
    const details = getDatabaseErrorDetails(err);
    return NextResponse.json({ error: details.message }, { status: details.status });
  }

  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (event.visibility === 'PRIVATE' && event.organizerId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const userId = session.user.id;
  const rsvpId = randomUUID();

  let rsvp: { id: string };
  try {
    rsvp = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT 1 FROM "Event" WHERE "id" = ${event.id} FOR UPDATE`;
      const count = await tx.rSVP.count({ where: { eventId: event.id } });
      if (count >= event.capacity) throw new EventFullError('Event full');

      const rows = await tx.$queryRaw<Array<{ id: string }>>`
        INSERT INTO "RSVP" ("id", "userId", "eventId", "createdAt")
        VALUES (${rsvpId}, ${userId}, ${event.id}, NOW())
        ON CONFLICT ("userId", "eventId") DO NOTHING
        RETURNING "id"
      `;

      if (!rows || rows.length === 0) {
        throw Object.assign(
          new Prisma.PrismaClientKnownRequestError('Already RSVPed', { code: 'P2002', clientVersion: '' }),
          { code: 'P2002' }
        );
      }
      return rows[0];
    });
  } catch (error: any) {
    if (error instanceof EventFullError) {
      return NextResponse.json({ error: 'Event is full' }, { status: 409 });
    }
    if (error?.code === 'P2002' || error?.message === 'Already RSVPed') {
      return NextResponse.json({ error: 'Already RSVPed' }, { status: 409 });
    }
    console.error('RSVP error:', error);
    return NextResponse.json({ error: 'Failed to RSVP. Please try again.' }, { status: 500 });
  }

  try {
    await recalcEngagementScore(event.id);
  } catch { /* non-critical */ }
  clearEventsCache();

  // Send confirmation email (non-blocking — failure does not break the RSVP)
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    });
    if (user?.email) {
      const ticketRecord = await prisma.rSVP.findUnique({
        where: { id: rsvp.id },
        select: { ticketId: true }
      });
      const eventDate = new Intl.DateTimeFormat('en-IN', {
        weekday: 'short', day: 'numeric', month: 'long',
        year: 'numeric', hour: '2-digit', minute: '2-digit'
      }).format(new Date(event.startTime));

      await sendTicketEmail({
        to: user.email,
        userName: user.name,
        eventTitle: event.title,
        eventDate,
        ticketId: ticketRecord?.ticketId ?? rsvp.id,
        rsvpId: rsvp.id,
        ticketPrice: event.ticketPrice ?? null,
        organizerName: event.organizer?.name ?? 'Organizer',
      });
    }
  } catch (emailErr) {
    console.error('[RSVP] Email send failed (non-critical):', emailErr);
  }

  return NextResponse.json({ ok: true, rsvpId: rsvp.id });
}
