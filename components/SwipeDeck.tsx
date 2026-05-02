'use client';

import { memo, useCallback, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { EventSummary } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { ResilientImage } from '@/components/ResilientImage';
import { CalendarClock, Sparkles, Users } from 'lucide-react';
import { formatEventDay, formatEventRange } from '@/lib/event-style';

const SWIPE_THRESHOLD = 120;

const SwipeCard = memo(function SwipeCard({
  event,
  onDismiss,
  zIndex,
  stackIndex
}: {
  event: EventSummary;
  onDismiss: () => void;
  zIndex: number;
  stackIndex: number;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-150, 150], [-8, 8]);
  const opacity = useTransform(x, [-180, 0, 180], [0.55, 1, 0.55]);
  const scale = useTransform(x, [-180, 0, 180], [0.96, 1, 0.96]);

  return (
    <motion.div
      className="absolute inset-x-0 top-0"
      style={{ x, rotate, opacity, scale, zIndex, translateY: stackIndex * 14 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      whileTap={{ cursor: 'grabbing' }}
      onDragEnd={() => {
        if (Math.abs(x.get()) > SWIPE_THRESHOLD) {
          onDismiss();
        } else {
          x.set(0);
        }
      }}
    >
      <Card className="relative h-[19rem] cursor-grab overflow-hidden rounded-[1.9rem] p-0">
        {event.bannerUrl ? (
          <ResilientImage
            src={event.bannerUrl}
            alt={event.title}
            className="absolute inset-0 h-full w-full object-cover"
            fallback={<div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,118,110,0.92)_0%,rgba(200,102,63,0.9)_100%)]" />}
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,118,110,0.92)_0%,rgba(200,102,63,0.9)_100%)]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08)_0%,rgba(15,23,42,0.82)_100%)]" />

        <div className="relative flex h-full flex-col justify-between p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <span className="rounded-full bg-white/16 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/82">
              Swipe pick
            </span>
            <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-medium text-white/85">
              Score {event.engagementScore}
            </span>
          </div>

          <div>
            <h3 className="text-2xl font-semibold leading-tight">{event.title}</h3>
            <p className="mt-3 line-clamp-3 max-w-sm text-sm leading-6 text-white/74">
              {event.description}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white/14 px-3 py-1.5">
                <CalendarClock className="mr-1 inline h-3.5 w-3.5" />
                <span>{formatEventDay(event.startTime)} / {formatEventRange(event.startTime, event.endTime)}</span>
              </span>
              <span className="rounded-full bg-white/14 px-3 py-1.5">
                <Users className="mr-1 inline h-3.5 w-3.5" />
                Cap {event.capacity}
              </span>
            </div>

            <a
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-white/80"
              href={`/events/${event.id}`}
            >
              Open event
              <Sparkles className="h-4 w-4" />
            </a>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});

export function SwipeDeck({ events, loading }: { events: EventSummary[]; loading: boolean }) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const dismiss = useCallback((id: string) => setDismissedIds(prev => new Set(prev).add(id)), []);

  if (loading) {
    return <Card className="h-[19rem] animate-pulse rounded-[1.9rem] bg-[rgba(255,255,255,0.4)] dark:bg-[rgba(15,23,42,0.32)]" />;
  }

  const visible = events.filter((e) => !dismissedIds.has(e.id));

  if (!visible.length) {
    return (
      <Card className="flex h-[19rem] items-center justify-center rounded-[1.9rem] p-6 text-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
            No picks yet
          </p>
          <p className="mt-3 text-sm leading-6 text-muted">
            Once events appear in your radius, the strongest ones will stack here for a quick swipe review.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative h-[20.5rem]">
      {visible.slice(0, 3).map((event, index) => (
        <SwipeCard
          key={event.id}
          event={event}
          zIndex={10 - index}
          stackIndex={index}
          onDismiss={() => dismiss(event.id)}
        />
      ))}
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-[rgba(15,23,42,0.48)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80">
        Drag to cycle
      </div>
    </div>
  );
}
