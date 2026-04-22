import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { EventDetailClient } from '@/components/EventDetailClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sanitizeEventMedia } from '@/lib/media';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    select: { title: true, description: true, bannerUrl: true, startTime: true }
  });

  if (!event) return { title: 'Event not found' };

  const base = process.env.NEXTAUTH_URL ?? 'https://ilaka.app';
  const description = event.description.slice(0, 160);
  const images = event.bannerUrl ? [{ url: event.bannerUrl }] : [];

  return {
    title: event.title,
    description,
    openGraph: {
      type: 'article',
      title: event.title,
      description,
      url: `${base}/events/${id}`,
      images,
      publishedTime: event.startTime.toISOString()
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description,
      images: images.map((i) => i.url)
    }
  };
}

export default async function EventDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { token } = await searchParams;

  const event = await prisma.event.findUnique({
    where: { id },
    include: { organizer: true, rsvps: true }
  });

  if (!event) {
    return <div className="p-6">Event not found</div>;
  }

  if (event.visibility === 'PRIVATE') {
    const tokenValid = token && event.shareToken && token === event.shareToken;
    if (!tokenValid) {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id;
      if (!userId || (event.organizerId !== userId && session?.user?.role !== 'ADMIN')) {
        return <div className="p-6">Event not found</div>;
      }
    }
  }

  const sanitized = sanitizeEventMedia(event) as typeof event;

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      <EventDetailClient event={{ ...sanitized, shareToken: event.shareToken ?? null }} />
    </div>
  );
}
