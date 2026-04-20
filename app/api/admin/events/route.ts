import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const events = await prisma.event.findMany({
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
    orderBy: { createdAt: 'desc' }
  });

  const serialized = events.map((e) => ({
    ...e,
    startTime: e.startTime.toISOString(),
    endTime: e.endTime.toISOString(),
    rsvpCount: e._count.rsvps,
    _count: undefined
  }));

  return NextResponse.json({ events: serialized });
}
