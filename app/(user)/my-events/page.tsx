'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type MyEvent = {
  id: string;
  title: string;
  description: string;
  bannerUrl: string;
  startTime: string;
  endTime: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  isPaid: boolean;
  engagementScore: number;
  rsvpCount: number;
};

export default function MyEventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) { router.replace('/login'); return; }
    fetch('/api/events/mine')
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .finally(() => setLoading(false));
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center text-ink/50">
        Loading your events…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">My Events</h1>
        <Link
          href="/events/new"
          className="bg-ink text-white dark:bg-white dark:text-ink px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + New event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-ink/50 dark:text-white/50 mb-4">You haven&apos;t created any events yet.</p>
          <Link
            href="/events/new"
            className="bg-ink text-white dark:bg-white dark:text-ink px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Create your first event
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: MyEvent }) {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const now = new Date();
  const isUpcoming = start > now;
  const isLive = start <= now && end >= now;
  const isPast = end < now;

  return (
    <div className="glass rounded-2xl p-5 flex gap-4">
      {event.bannerUrl && (
        <img
          src={event.bannerUrl}
          alt={event.title}
          className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <h2 className="font-semibold text-lg leading-tight">{event.title}</h2>
          <div className="flex gap-2 flex-wrap">
            {isLive && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
                LIVE
              </span>
            )}
            {isUpcoming && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                Upcoming
              </span>
            )}
            {isPast && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/50 font-medium">
                Past
              </span>
            )}
            {event.visibility === 'PRIVATE' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
                Private
              </span>
            )}
            {event.isPaid && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 font-medium">
                Paid
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-ink/60 dark:text-white/60 mt-1">
          {start.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' })}
          {' · '}
          {start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
          {' – '}
          {end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
          {' IST'}
        </p>

        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-ink/40 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-semibold">{event.rsvpCount}</span>
            <span className="text-sm text-ink/50 dark:text-white/50">registered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-ink/40 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-sm text-ink/50 dark:text-white/50">Score: {event.engagementScore}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 flex-shrink-0">
        <Link
          href={`/events/${event.id}`}
          className="text-xs px-3 py-1.5 rounded-lg bg-ink/5 dark:bg-white/10 hover:bg-ink/10 dark:hover:bg-white/15 font-medium transition-colors text-center"
        >
          View
        </Link>
      </div>
    </div>
  );
}
