import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const events = await prisma.event.findMany({
      where: { organizerId: userId },
      select: {
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
  } catch (err) {
    console.error('Failed to fetch user events:', err);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
