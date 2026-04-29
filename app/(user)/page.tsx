import { prisma } from '@/lib/prisma';
import { EditorialWall } from '@/components/landing/EditorialWall';
import { sanitizeEventMedia } from '@/lib/media';

// ISR: revalidate every 30 s so ended events disappear quickly but the
// home page does NOT hammer the DB on every single request (force-dynamic
// exhausts the connection pool in serverless environments).
export const revalidate = 30;

export default async function HomePage() {
  let events: any[] = [];
  let loadError = false;
  try {
    const raw = await prisma.event.findMany({
      where: { visibility: 'PUBLIC', endTime: { gte: new Date() } },
      orderBy: { startTime: 'asc' },
      take: 12,
      include: { organizer: { select: { name: true } }, rsvps: { select: { id: true } } },
    });
    events = raw.map(sanitizeEventMedia);
  } catch (err) {
    console.error('[HomePage] events load failed:', err);
    loadError = true;
    events = [];
  }

  return <EditorialWall events={events} loadError={loadError} />;
}
