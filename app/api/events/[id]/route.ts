import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { sanitizeEventMedia } from '@/lib/media';
import { clearEventsCache } from '@/lib/events-cache';

const updateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional()
});

// Safe select that works even when paymentQrUrl hasn't been migrated yet
const SAFE_EVENT_SELECT = {
  id: true,
  title: true,
  description: true,
  bannerUrl: true,
  badgeIcon: true,
  latitude: true,
  longitude: true,
  startTime: true,
  endTime: true,
  visibility: true,
  capacity: true,
  organizerId: true,
  isPaid: true,
  engagementScore: true,
  createdAt: true,
  updatedAt: true,
} as const;

type RouteContext = { params: Promise<{ id: string }> };

async function fetchEvent(id: string) {
  // Try with paymentQrUrl first; fall back to base columns if column doesn't exist
  try {
    return await prisma.event.findUnique({
      where: { id },
      select: { ...SAFE_EVENT_SELECT, paymentQrUrl: true }
    });
  } catch {
    const event = await prisma.event.findUnique({ where: { id }, select: SAFE_EVENT_SELECT });
    return event ? { ...event, paymentQrUrl: null } : null;
  }
}

export async function GET(_: Request, { params }: RouteContext) {
  const { id } = await params;
  let event;
  try {
    event = await fetchEvent(id);
  } catch (err) {
    console.error('Event fetch failed:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (event.visibility === 'PRIVATE') {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId || (event.organizerId !== userId && session?.user?.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  }

  return NextResponse.json({ event: sanitizeEventMedia(event) });
}

export async function PUT(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let event;
  try {
    event = await prisma.event.findUnique({ where: { id }, select: { id: true, organizerId: true } });
  } catch (err) {
    console.error('Event fetch failed:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (event.organizerId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  let updated;
  try {
    updated = await prisma.event.update({ where: { id }, data: parsed.data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    throw error;
  }

  clearEventsCache();
  return NextResponse.json({ event: updated });
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let event;
  try {
    event = await prisma.event.findUnique({ where: { id }, select: { id: true, organizerId: true } });
  } catch (err) {
    console.error('Event fetch failed:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (event.organizerId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await prisma.event.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    throw error;
  }
  clearEventsCache();
  return NextResponse.json({ ok: true });
}
