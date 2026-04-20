import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { recalcEngagementScore } from '@/lib/engagement';
import { clearEventsCache } from '@/lib/events-cache';

type RouteContext = { params: Promise<{ id: string }> };

class EventFullError extends Error {}

export async function POST(_: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let event;
  try {
    event = await prisma.event.findUnique({ where: { id } });
  } catch (err) {
    console.error('Event fetch failed:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (event.visibility === 'PRIVATE' && event.organizerId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let rsvp;
  try {
    // All three operations run inside a single transaction so the FOR UPDATE
    // row lock is held until the RSVP insert (or rollback) completes.
    rsvp = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT 1 FROM "Event" WHERE "id" = ${event.id} FOR UPDATE`;
      const count = await tx.rSVP.count({ where: { eventId: event.id } });
      if (count >= event.capacity) {
        throw new EventFullError('Event full');
      }
      return tx.rSVP.create({ data: { eventId: event.id, userId: session.user.id } });
    });
  } catch (error) {
    if (error instanceof EventFullError) {
      return NextResponse.json({ error: 'Event full' }, { status: 409 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Already RSVPed' }, { status: 409 });
    }
    console.error('RSVP error:', error);
    return NextResponse.json({ error: 'Failed to RSVP' }, { status: 500 });
  }
  try {
    await recalcEngagementScore(event.id);
  } finally {
    clearEventsCache();
  }

  return NextResponse.json({ ok: true, rsvpId: rsvp.id });
}
