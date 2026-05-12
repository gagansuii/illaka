import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const PAGE_SIZE = 50;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10));

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        visibility: true,
        isPaid: true,
        engagementScore: true,
        organizerId: true,
        organizer: { select: { email: true, name: true } },
        _count: { select: { rsvps: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: page * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.event.count(),
  ]);

  const serialized = events.map((e) => ({
    ...e,
    startTime: e.startTime.toISOString(),
    endTime: e.endTime.toISOString(),
    rsvpCount: e._count.rsvps,
    _count: undefined
  }));

  return NextResponse.json({ events: serialized, total, page, pageSize: PAGE_SIZE });
}
