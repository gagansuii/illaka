import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { recalcEngagementScore } from '@/lib/engagement';
import { clearEventsCache } from '@/lib/events-cache';
import { randomUUID } from 'crypto';

type RouteContext = { params: Promise<{ id: string }> };

class EventFullError extends Error {}

export async function POST(_: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Explicit select avoids fetching the PostGIS geography buffer and any
  // columns that may not exist in the production DB (paymentQrUrl, etc.)
  let event: any;
  try {
    event = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        capacity: true,
        visibility: true,
        organizerId: true,
      }
    });
  } catch (err) {
    console.error('Event fetch failed:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
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

      // Use raw INSERT so we don't depend on ticketId column existing in the DB.
      // The DB migration adds ticketId with a DEFAULT, so if it exists it auto-fills.
      // If the migration hasn't been applied yet, the INSERT still works without it.
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

  return NextResponse.json({ ok: true, rsvpId: rsvp.id });
}
