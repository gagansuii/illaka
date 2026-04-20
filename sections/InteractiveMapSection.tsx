'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarClock, MapPin, Users, X, ArrowRight, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EventPreviewDrawer } from '@/components/EventPreviewDrawer';
import { formatEventDay, formatEventRange, getEventTheme } from '@/lib/event-style';
import type { EventSummary } from '@/lib/types';

const MapView = dynamic(
  () => import('@/components/MapView').then((m) => m.MapView),
  { ssr: false }
);

/* ── Radius options ── */
const RADIUS_OPTIONS = [
  { label: '2 km',  value: 2000  },
  { label: '5 km',  value: 5000  },
  { label: '10 km', value: 10000 },
  { label: '20 km', value: 20000 },
] as const;

const DEFAULT_RADIUS = 5000;

/* ── Fallback events ── */
const FALLBACK_EVENTS: EventSummary[] = [
  {
    id: 'landing-run-club',
    title: 'Morning Run Club',
    description: 'A friendly sunrise loop that starts with easy conversation and ends with chai.',
    bannerUrl: '', badgeIcon: '',
    latitude: 28.6205, longitude: 77.221,
    startTime: '2026-03-16T01:00:00.000Z',
    endTime:   '2026-03-16T02:30:00.000Z',
    visibility: 'PUBLIC', capacity: 28,
    organizerId: 'landing', isPaid: false, engagementScore: 94,
  },
  {
    id: 'landing-paint',
    title: 'Terrace Painting Workshop',
    description: 'A soft golden-hour workshop with a local artist and room for first-timers.',
    bannerUrl: '', badgeIcon: '',
    latitude: 28.6142, longitude: 77.2059,
    startTime: '2026-03-16T11:30:00.000Z',
    endTime:   '2026-03-16T13:30:00.000Z',
    visibility: 'PUBLIC', capacity: 18,
    organizerId: 'landing', isPaid: true, engagementScore: 91,
  },
  {
    id: 'landing-skillshare',
    title: 'Neighborhood Coding Circle',
    description: 'A practical, low-pressure session for learning together with people nearby.',
    bannerUrl: '', badgeIcon: '',
    latitude: 28.609, longitude: 77.228,
    startTime: '2026-03-17T05:30:00.000Z',
    endTime:   '2026-03-17T07:30:00.000Z',
    visibility: 'PUBLIC', capacity: 24,
    organizerId: 'landing', isPaid: false, engagementScore: 88,
  },
];

export function InteractiveMapSection() {
  const [center,  setCenter]  = useState<[number, number]>([28.6139, 77.209]);
  const [events,  setEvents]  = useState<EventSummary[]>(FALLBACK_EVENTS);
  const [loading, setLoading] = useState(true);
  const [radius,  setRadius]  = useState<number>(DEFAULT_RADIUS);

  // The event whose marker is highlighted on the map
  const [previewedId, setPreviewedId] = useState<string>(FALLBACK_EVENTS[0].id);
  // The event whose detail panel is open (overlapping the map)
  const [detailEvent, setDetailEvent] = useState<EventSummary | null>(null);
  // Full drawer (kept for mobile deep-dive)
  const [drawerEvent, setDrawerEvent] = useState<EventSummary | null>(null);

  const currentCenter = useRef(center);
  currentCenter.current = center;

  const loadEvents = useCallback(async (coords: [number, number], r: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events?lat=${coords[0]}&lng=${coords[1]}&radius=${r}`);
      if (!res.ok) { setEvents(FALLBACK_EVENTS); return; }
      const data = await res.json();
      const next = (data.events?.length ? data.events : FALLBACK_EVENTS) as EventSummary[];
      setEvents(next);
      setPreviewedId(next[0]?.id ?? FALLBACK_EVENTS[0].id);
      setDetailEvent(null);
    } catch {
      setEvents(FALLBACK_EVENTS);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load with geolocation
  useEffect(() => {
    let cancelled = false;
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          const c: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setCenter(c);
          void loadEvents(c, DEFAULT_RADIUS);
        },
        () => { if (!cancelled) void loadEvents([28.6139, 77.209], DEFAULT_RADIUS); },
        { timeout: 6000 }
      );
    } else {
      void loadEvents([28.6139, 77.209], DEFAULT_RADIUS);
    }
    return () => { cancelled = true; };
  }, [loadEvents]);

  // Re-fetch when radius changes
  const handleRadiusChange = (r: number) => {
    setRadius(r);
    void loadEvents(currentCenter.current, r);
  };

  const previewedEvent = useMemo(
    () => events.find(e => e.id === previewedId) ?? events[0] ?? FALLBACK_EVENTS[0],
    [events, previewedId]
  );

  return (
    <section id="live-map" className="px-4 pb-24 pt-10 sm:px-6 sm:pt-14 lg:px-8">
      <div className="mx-auto max-w-[1440px] space-y-6">

        {/* ── Section header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <p className="font-label text-[10px] uppercase tracking-[0.28em] text-outline">
              Nearby now
            </p>
            <h2 className="font-headline italic text-on-surface leading-tight"
              style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.6rem)' }}>
              Explore what&apos;s happening around you.
            </h2>
          </div>
          <Link
            href="/discover"
            className="heritage-btn heritage-btn--ghost shrink-0 self-start sm:self-auto"
          >
            <span className="flex items-center gap-2">
              Open full explorer
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>

        {/* ── Radius toggle ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-label text-[10px] uppercase tracking-widest text-outline flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            Radius
          </span>
          <div className="heritage-toggle">
            {RADIUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleRadiusChange(opt.value)}
                className={`heritage-toggle__btn${radius === opt.value ? ' active' : ''}`}
              >
                {radius === opt.value && (
                  <motion.span
                    layoutId="radius-pill"
                    className="heritage-toggle__pill"
                    transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{opt.label}</span>
              </button>
            ))}
          </div>
          {loading && (
            <span className="font-label text-[10px] uppercase tracking-widest text-outline animate-pulse">
              Loading…
            </span>
          )}
        </div>

        {/* ── Map + overlapping detail panel ── */}
        <div className="relative overflow-hidden rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-lowest shadow-[0_28px_80px_rgba(0,0,0,0.35)]"
          style={{ height: 'clamp(300px, 40vh, 400px)' }}>

          {/* Full-width map */}
          <MapView
            events={events}
            center={center}
            radius={radius}
            previewedEventId={previewedEvent?.id}
            onPreviewEvent={(e) => setPreviewedId(e.id)}
            onOpenEvent={(e) => { setDetailEvent(e); setPreviewedId(e.id); }}
          />

          {/* Map gradient overlay at bottom */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
            style={{ background: 'linear-gradient(to top, rgba(22,19,17,0.72), transparent)' }} />

          {/* Event count badge */}
          <div className="pointer-events-none absolute left-4 top-4">
            <div className="rounded-[0.25rem] border border-white/10 bg-surface-container-lowest/80 px-3 py-1.5 font-label text-[10px] uppercase tracking-widest text-on-surface/70 backdrop-blur-xl">
              {loading ? 'Searching…' : `${events.length} event${events.length !== 1 ? 's' : ''} within ${radius / 1000} km`}
            </div>
          </div>

          {/* Scrollable event cards row — overlaps bottom of map */}
          <div className="absolute bottom-0 inset-x-0 z-10 px-4 pb-4">
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {events.slice(0, 6).map((event) => {
                const theme = getEventTheme(event);
                const isActive = event.id === previewedId;
                return (
                  <motion.button
                    key={event.id}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    onMouseEnter={() => setPreviewedId(event.id)}
                    onClick={() => {
                      setPreviewedId(event.id);
                      setDetailEvent(event);
                    }}
                    className="shrink-0 w-56 rounded-[0.5rem] border text-left p-3.5 backdrop-blur-xl transition-all duration-200"
                    style={{
                      background: isActive ? 'rgba(255,181,152,0.12)' : 'rgba(22,19,17,0.75)',
                      borderColor: isActive ? 'rgba(255,181,152,0.45)' : 'rgba(161,140,133,0.20)',
                      boxShadow: isActive ? '0 4px 20px rgba(255,181,152,0.20)' : '0 4px 16px rgba(0,0,0,0.35)',
                    }}
                  >
                    <span
                      className="font-label text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-[0.125rem] mb-2 inline-block"
                      style={{ background: theme.accentSoft, color: theme.accentStrong }}
                    >
                      {theme.label}
                    </span>
                    <p className="font-headline italic text-on-surface text-base leading-tight line-clamp-2">
                      {event.title}
                    </p>
                    <p className="font-label text-[10px] uppercase tracking-wider text-outline mt-1.5">
                      {formatEventDay(event.startTime)}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* ── Floating detail panel — slides in from right, overlaps map ── */}
          <AnimatePresence>
            {detailEvent && (
              <motion.div
                key={detailEvent.id}
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                className="absolute inset-y-0 right-0 z-20 w-80 overflow-y-auto border-l border-outline-variant/20 backdrop-blur-2xl"
                style={{ background: 'rgba(16,14,12,0.88)' }}
              >
                {/* Close */}
                <button
                  onClick={() => setDetailEvent(null)}
                  className="absolute top-4 right-4 z-30 rounded-[0.25rem] border border-outline-variant/25 bg-surface-container p-1.5 text-on-surface/60 hover:text-on-surface transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Detail content */}
                <div className="p-6 pt-5">
                  {(() => {
                    const theme = getEventTheme(detailEvent);
                    return (
                      <>
                        <span
                          className="font-label text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-[0.125rem] inline-block mb-4"
                          style={{ background: theme.accentSoft, color: theme.accentStrong }}
                        >
                          {theme.label}
                        </span>

                        <h3 className="font-headline italic text-on-surface leading-tight mb-4"
                          style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
                          {detailEvent.title}
                        </h3>

                        <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-5">
                          {detailEvent.description}
                        </p>

                        <div className="flex flex-col gap-3 border-t border-outline-variant/20 pt-4 mb-5">
                          <div className="flex items-center gap-2.5">
                            <CalendarClock className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
                            <span className="font-label text-xs text-on-surface-variant">
                              {formatEventDay(detailEvent.startTime)}<br />
                              {formatEventRange(detailEvent.startTime, detailEvent.endTime)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <Users className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
                            <span className="font-label text-xs text-on-surface-variant">
                              Capacity {detailEvent.capacity}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <MapPin className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
                            <span className="font-label text-xs text-on-surface-variant">
                              {detailEvent.latitude.toFixed(4)}, {detailEvent.longitude.toFixed(4)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-5">
                          <span
                            className="font-label text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-[0.25rem]"
                            style={{ background: theme.accentSoft, color: theme.accentStrong }}
                          >
                            {detailEvent.isPaid ? 'Paid event' : 'Free entry'}
                          </span>
                          <span className="font-label text-[10px] uppercase tracking-widest text-tertiary">
                            Score {detailEvent.engagementScore}
                          </span>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.025, y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ type: 'spring', stiffness: 440, damping: 20 }}
                          onClick={() => setDrawerEvent(detailEvent)}
                          className="heritage-btn heritage-btn--primary w-full justify-center"
                        >
                          <span className="relative z-10 flex items-center gap-2">
                            View details
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </motion.button>
                      </>
                    );
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Full detail drawer */}
      <EventPreviewDrawer
        event={drawerEvent}
        open={Boolean(drawerEvent)}
        onOpenChange={(open) => { if (!open) setDrawerEvent(null); }}
      />
    </section>
  );
}
