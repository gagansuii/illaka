import { prisma } from '@/lib/prisma';
import { EventDetailClient } from '@/components/EventDetailClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sanitizeEventMedia } from '@/lib/media';
import { notFound } from 'next/navigation';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function EventDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { token } = await searchParams;

  // Try full query first (includes paymentQrUrl, shareToken, eventType, onlineLink added in migrations).
  // If those columns don't exist yet in the production DB, fall back to the
  // base query so the page stays functional while the migration is pending.
  let event: any = null;

  try {
    event = await prisma.event.findUnique({
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
        ticketPrice: true,
        paymentQrUrl: true,
        shareToken: true,
        eventType: true,
        onlineLink: true,
        linkShareMode: true,
        engagementScore: true,
        organizer: { select: { name: true } },
        rsvps: { select: { id: true } },
      },
    });
  } catch {
    // Fallback: query without columns that may not exist in older DBs
    try {
      event = await prisma.event.findUnique({
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
          ticketPrice: true,
          paymentQrUrl: true,
          engagementScore: true,
          organizer: { select: { name: true } },
          rsvps: { select: { id: true } },
        },
      });
      if (event) {
        event.shareToken = null;
        event.eventType = null;
        event.onlineLink = null;
        event.linkShareMode = null;
      }
    } catch {
      // Final fallback: base columns only
      try {
        event = await prisma.event.findUnique({
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
            engagementScore: true,
            organizer: { select: { name: true } },
            rsvps: { select: { id: true } },
          },
        });
        if (event) {
          event.paymentQrUrl = null;
          event.ticketPrice = null;
          event.shareToken = null;
          event.eventType = null;
          event.onlineLink = null;
          event.linkShareMode = null;
        }
      } catch (fallbackErr) {
        console.error('Event query failed:', fallbackErr);
        throw fallbackErr;
      }
    }
  }

  if (!event) {
    notFound();
  }

  if (event.visibility === 'PRIVATE') {
    const tokenValid = token && event.shareToken && token === event.shareToken;
    if (!tokenValid) {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id;
      if (!userId || (event.organizerId !== userId && session?.user?.role !== 'ADMIN')) {
        notFound();
      }
    }
  }

  const serializedEvent = sanitizeEventMedia({
    ...event,
    startTime: event.startTime.toISOString(),
    endTime: event.endTime.toISOString(),
    ticketPrice: event.ticketPrice ?? null,
    paymentQrUrl: event.paymentQrUrl ?? null,
    shareToken: event.shareToken ?? null,
    eventType: event.eventType ?? null,
    onlineLink: event.onlineLink ?? null,
    linkShareMode: event.linkShareMode ?? null,
  });

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      <EventDetailClient event={serializedEvent} />
    </div>
  );
}
