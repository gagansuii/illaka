import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sanitizeEventMediaList } from '@/lib/media';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const events = await prisma.event.findMany({
      where: { organizerId: session.user.id },
      orderBy: { startTime: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        bannerUrl: true,
        badgeIcon: true,
        startTime: true,
        endTime: true,
        visibility: true,
        capacity: true,
        isPaid: true,
        engagementScore: true,
        organizerId: true,
        latitude: true,
        longitude: true,
        _count: { select: { rsvps: true } },
      },
    });

    const now = new Date();
    const sanitized = sanitizeEventMediaList(
      events.map(e => ({ ...e, startTime: e.startTime.toISOString(), endTime: e.endTime.toISOString() }))
    );

    return NextResponse.json({
      upcoming: sanitized.filter(e => new Date(e.endTime) >= now),
      past: sanitized.filter(e => new Date(e.endTime) < now),
    });
  } catch (err) {
    console.error('My events fetch failed:', err);
    return NextResponse.json({ error: 'Failed to load events' }, { status: 500 });
  }
}
