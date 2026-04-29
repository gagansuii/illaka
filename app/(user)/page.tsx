import { prisma } from '@/lib/prisma';
import { EditorialWall } from '@/components/landing/EditorialWall';
import { sanitizeEventMedia } from '@/lib/media';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let events: any[] = [];
  try {
    const raw = await prisma.event.findMany({
      where: { visibility: 'PUBLIC', endTime: { gte: new Date() } },
      orderBy: { startTime: 'asc' },
      take: 12,
      include: { organizer: { select: { name: true } }, rsvps: { select: { id: true } } },
    });
    events = raw.map(sanitizeEventMedia);
  } catch {
    events = [];
  }

  return <EditorialWall events={events} />;
}
