import { prisma } from '@/lib/prisma';
import { EditorialWall } from '@/components/landing/EditorialWall';
import { sanitizeEventMedia } from '@/lib/media';

// ISR: regenerate page in background every 60s — no cold-start cost on every request
export const revalidate = 60;

export default async function HomePage() {
  let events: any[] = [];
  let loadError = false;
  try {
    const raw = await prisma.event.findMany({
      where: { visibility: 'PUBLIC', endTime: { gte: new Date() } },
      orderBy: [{ engagementScore: 'desc' }, { startTime: 'asc' }],
      take: 12,
      select: {
        id: true, title: true, description: true, bannerUrl: true, badgeIcon: true,
        latitude: true, longitude: true, startTime: true, endTime: true,
        visibility: true, capacity: true, organizerId: true, isPaid: true,
        ticketPrice: true, paymentQrUrl: true, engagementScore: true,
        createdAt: true, updatedAt: true,
        organizer: { select: { name: true } },
        _count: { select: { rsvps: true } },
      },
    });
    events = raw.map((e) => sanitizeEventMedia({ ...e, rsvps: e._count.rsvps }));
  } catch (err) {
    console.error('[HomePage] events load failed:', err);
    loadError = true;
    events = [];
  }

  return <EditorialWall events={events} loadError={loadError} />;
}
