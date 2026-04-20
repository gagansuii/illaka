import { prisma } from '@/lib/prisma';
import { EventDetailClient } from '@/components/EventDetailClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sanitizeEventMedia } from '@/lib/media';

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Select only serializable fields — exclude the PostGIS `location` geography
  // column which Prisma returns as a raw buffer that Next.js cannot serialize
  // across the Server → Client Component boundary.
  const event = await prisma.event.findUnique({
    where: { id },
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
      paymentQrUrl: true,
      engagementScore: true,
      organizer: { select: { name: true } },
      rsvps: { select: { id: true } },
    },
  });

  if (!event) {
    return <div className="p-6 text-muted">Event not found.</div>;
  }

  if (event.visibility === 'PRIVATE') {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId || (event.organizerId !== userId && session?.user?.role !== 'ADMIN')) {
      return <div className="p-6 text-muted">Event not found.</div>;
    }
  }

  // Convert Date objects to ISO strings — Client Components require plain
  // serializable props; Date instances cause a Next.js serialization error.
  const serializedEvent = sanitizeEventMedia({
    ...event,
    startTime: event.startTime.toISOString(),
    endTime: event.endTime.toISOString(),
  });

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      <EventDetailClient event={serializedEvent} />
    </div>
  );
}
