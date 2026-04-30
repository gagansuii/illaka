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

  type EventRow = {
    id: string; title: string; description: string; bannerUrl: string; badgeIcon: string;
    latitude: number; longitude: number; startTime: Date; endTime: Date;
    visibility: 'PUBLIC' | 'PRIVATE'; capacity: number; organizerId: string;
    isPaid: boolean; engagementScore: number; createdAt: Date; updatedAt: Date;
    shareToken: string | null; eventType: 'PHYSICAL' | 'ONLINE' | null;
    onlineLink: string | null; linkShareMode: 'IMMEDIATE' | 'BEFORE_EVENT' | null;
    paymentQrUrl: string | null; ticketPrice: number | null;
    organizer: { id: string; name: string } | null;
    rsvps: { id: string }[];
  };

  let event: EventRow | null = null;

  const BASE_SELECT = {
    id: true, title: true, description: true, bannerUrl: true, badgeIcon: true,
    latitude: true, longitude: true, startTime: true, endTime: true,
    visibility: true, capacity: true, organizerId: true, isPaid: true,
    engagementScore: true, createdAt: true, updatedAt: true,
    organizer: { select: { id: true, name: true } },
    rsvps: { select: { id: true } },
  } as const;

  try {
    try {
      const row = await prisma.event.findUnique({
        where: { id },
        select: { ...BASE_SELECT, shareToken: true, eventType: true, onlineLink: true, linkShareMode: true, paymentQrUrl: true, ticketPrice: true },
      });
      event = row as EventRow | null;
    } catch {
      try {
        const row = await prisma.event.findUnique({ where: { id }, select: { ...BASE_SELECT, paymentQrUrl: true } });
        event = row ? { ...row, shareToken: null, eventType: null, onlineLink: null, linkShareMode: null, ticketPrice: null } as EventRow : null;
      } catch {
        const row = await prisma.event.findUnique({ where: { id }, select: BASE_SELECT });
        event = row ? { ...row, shareToken: null, eventType: null, onlineLink: null, linkShareMode: null, paymentQrUrl: null, ticketPrice: null } as EventRow : null;
      }
    }
  } catch (err) {
    console.error('Event fetch error:', err);
    return (
      <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 20px', fontFamily: 'var(--font-mono), monospace', color: 'var(--ink)', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 36, fontWeight: 600 }}>Something went wrong.</div>
        <p style={{ fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.16em', marginTop: 10 }}>Could not load this event. Please try again.</p>
        <a href="/" style={{ display: 'inline-block', marginTop: 20, padding: '10px 20px', background: 'var(--terra)', border: '1.5px solid var(--terra-deep)', color: 'var(--cream)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', textDecoration: 'none' }}>← BACK TO WALL</a>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 20px', fontFamily: 'var(--font-mono), monospace', color: 'var(--ink)', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 36, fontWeight: 600 }}>Event not found.</div>
        <a href="/" style={{ display: 'inline-block', marginTop: 20, padding: '10px 20px', background: 'var(--terra)', border: '1.5px solid var(--terra-deep)', color: 'var(--cream)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', textDecoration: 'none' }}>← BACK TO WALL</a>
      </div>
    );
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const isOrganizer = userId === event.organizerId;
  const isAdmin = session?.user?.role === 'ADMIN';

  if (event.visibility === 'PRIVATE') {
    const tokenValid = token && event.shareToken && token === event.shareToken;
    if (!tokenValid && !isOrganizer && !isAdmin) {
      return (
        <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 20px', fontFamily: 'var(--font-mono), monospace', color: 'var(--ink)', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 36, fontWeight: 600 }}>Event not found.</div>
          <a href="/" style={{ display: 'inline-block', marginTop: 20, padding: '10px 20px', background: 'var(--terra)', border: '1.5px solid var(--terra-deep)', color: 'var(--cream)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', textDecoration: 'none' }}>← BACK TO WALL</a>
        </div>
      );
    }
  }

  // Past events: only visible to the organizer or admin
  const isPast = new Date(event.endTime) < new Date();
  if (isPast && !isOrganizer && !isAdmin) {
    return (
      <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 20px', fontFamily: 'var(--font-mono), monospace', color: 'var(--ink)', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 36, fontWeight: 600 }}>This event has ended.</div>
        <p style={{ fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.16em', marginTop: 10 }}>It's no longer open to the public.</p>
        <a href="/" style={{ display: 'inline-block', marginTop: 20, padding: '10px 20px', background: 'var(--terra)', border: '1.5px solid var(--terra-deep)', color: 'var(--cream)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', textDecoration: 'none' }}>← BACK TO WALL</a>
      </div>
    );
  }

  const sanitized = sanitizeEventMedia(event);

  return (
    <EventDetailClient
      event={{
        ...sanitized,
        organizer: event.organizer,
        rsvps: event.rsvps,
        shareToken: event.shareToken ?? null,
      }}
    />
  );
}
