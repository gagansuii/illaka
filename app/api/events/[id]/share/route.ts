import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { recalcEngagementScore } from '@/lib/engagement';
import { clearEventsCache } from '@/lib/events-cache';

type RouteContext = { params: Promise<{ id: string }> };

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

  try {
    await prisma.share.create({ data: { eventId: id, userId: session.user.id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ ok: true });
    }
    console.error('Share error:', error);
    return NextResponse.json({ error: 'Failed to record share' }, { status: 500 });
  }

  try {
    await recalcEngagementScore(id);
  } finally {
    clearEventsCache();
  }

  return NextResponse.json({ ok: true });
}
