'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  CalendarClock,
  Edit2,
  LocateFixed,
  Map,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { ResilientImage } from '@/components/ResilientImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { EventPreviewDrawer } from '@/components/EventPreviewDrawer';
import type { EventSummary } from '@/lib/types';
import {
  EVENT_CATEGORY_OPTIONS,
  SEARCH_PROMPTS,
  formatEventDay,
  formatEventRange,
  getEventTheme,
} from '@/lib/event-style';

type MyEvent = EventSummary & { rsvpCount: number };

const MapView = dynamic(
  () => import('@/components/MapView').then((m) => m.MapView),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-[var(--bg-deep)]" /> }
);

const LOCATION_SYNC_DISTANCE_THRESHOLD_METERS = 75;
const LOCATION_SYNC_THROTTLE_MS = 8_000;
const EVENT_FETCH_DEBOUNCE_MS = 250;
const PREFETCH_DELAY_MS = 1_200;

function distanceMeters([lat1, lng1]: [number, number], [lat2, lng2]: [number, number]) {
  const R = 6371e3;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

type ViewMode = 'feed' | 'map';

export function MapScreen() {
  const { status } = useSession();
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [radius, setRadius] = useState(5000);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [myEvents, setMyEvents] = useState<MyEvent[]>([]);
  const [myEventsLoading, setMyEventsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [promptIndex, setPromptIndex] = useState(0);
  const [drawerEvent, setDrawerEvent] = useState<EventSummary | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hasLoadedRealEvents, setHasLoadedRealEvents] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  const [showFilters, setShowFilters] = useState(false);
  const [previewedEventId, setPreviewedEventId] = useState<string | null>(null);

  const eventFetchAbortRef = useRef<AbortController | null>(null);
  const eventRequestIdRef = useRef(0);
  const hasLoadedRealEventsRef = useRef(false);
  const locationSyncSuppressedRef = useRef(false);
  const lastLocationSyncRef = useRef<{ center: [number, number]; radius: number } | null>(null);
  const lastLocationSyncAtRef = useRef(0);
  const prefetchStartedRef = useRef(false);

  const centerParams = useMemo(() => {
    if (!center) return '';
    return `lat=${center[0]}&lng=${center[1]}&radius=${radius}`;
  }, [center, radius]);

  const featuredEvents = events.slice(0, 12);
  const radiusLabel = `${(radius / 1000).toFixed(1)} km`;

  const updateLocation = useCallback(
    async (nextCenter: [number, number]) => {
      if (status !== 'authenticated' || locationSyncSuppressedRef.current) return;
      const now = Date.now();
      if (now - lastLocationSyncAtRef.current < LOCATION_SYNC_THROTTLE_MS) return;
      const previous = lastLocationSyncRef.current;
      if (previous) {
        const movedMeters = distanceMeters(previous.center, nextCenter);
        const radiusChanged = previous.radius !== radius;
        if (!radiusChanged && movedMeters < LOCATION_SYNC_DISTANCE_THRESHOLD_METERS) return;
      }
      lastLocationSyncAtRef.current = now;
      try {
        const res = await fetch('/api/users/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude: nextCenter[0], longitude: nextCenter[1], radius }),
        });
        if (res.status === 401) { locationSyncSuppressedRef.current = true; return; }
        if (res.ok) lastLocationSyncRef.current = { center: nextCenter, radius };
      } catch { /* best-effort */ }
    },
    [radius, status]
  );

  useEffect(() => {
    const resolveFallback = async () => {
      try {
        const res = await fetch('/api/geo/ip');
        if (res.ok) {
          const data = await res.json();
          setCenter([data.latitude, data.longitude]);
          return;
        }
      } catch { /* optional */ }
      setCenter([28.6139, 77.209]);
    };
    if (!('geolocation' in navigator)) { void resolveFallback(); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
      () => void resolveFallback()
    );
  }, []);

  useEffect(() => {
    if (!centerParams) return;
    eventFetchAbortRef.current?.abort();
    const requestId = ++eventRequestIdRef.current;
    let controller: AbortController | null = null;
    const timeoutId = window.setTimeout(() => {
      controller = new AbortController();
      eventFetchAbortRef.current = controller;
      setLoading(true);
      void (async () => {
        try {
          const res = await fetch(`/api/events?${centerParams}`, { signal: controller.signal, cache: 'no-store' });
          if (!res.ok) {
            if (requestId === eventRequestIdRef.current) { setHasLoadedRealEvents(true); hasLoadedRealEventsRef.current = true; }
            return;
          }
          const data = await res.json();
          if (controller.signal.aborted || requestId !== eventRequestIdRef.current) return;
          setEvents(Array.isArray(data.events) ? data.events : []);
          setHasLoadedRealEvents(true);
          hasLoadedRealEventsRef.current = true;
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') return;
          if (requestId === eventRequestIdRef.current) { setHasLoadedRealEvents(true); hasLoadedRealEventsRef.current = true; }
        } finally {
          if (requestId === eventRequestIdRef.current) setLoading(false);
        }
      })();
    }, EVENT_FETCH_DEBOUNCE_MS);
    return () => { window.clearTimeout(timeoutId); controller?.abort(); };
  }, [centerParams]);

  useEffect(() => () => { eventFetchAbortRef.current?.abort(); }, []);

  useEffect(() => { if (!center) return; void updateLocation(center); }, [center, updateLocation]);

  useEffect(() => {
    if (status === 'authenticated') { locationSyncSuppressedRef.current = false; return; }
    if (status === 'unauthenticated') {
      locationSyncSuppressedRef.current = false;
      lastLocationSyncRef.current = null;
      lastLocationSyncAtRef.current = 0;
      setMyEvents([]);
    }
  }, [status]);

  // Fetch user's own events (all visibility, all locations)
  useEffect(() => {
    if (status !== 'authenticated') return;
    let active = true;
    setMyEventsLoading(true);
    fetch('/api/events/mine', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => { if (active) setMyEvents(Array.isArray(data.events) ? data.events : []); })
      .catch(() => {})
      .finally(() => { if (active) setMyEventsLoading(false); });
    return () => { active = false; };
  }, [status]);

  useEffect(() => {
    if (!center || prefetchStartedRef.current) return;
    prefetchStartedRef.current = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      const prefetchRadii = Array.from(new Set([radius, Math.max(1_000, radius - 1_000), Math.min(20_000, radius + 1_500)]));
      void Promise.all(
        prefetchRadii.map((r) =>
          fetch(`/api/events?lat=${center[0]}&lng=${center[1]}&radius=${r}`, { signal: controller.signal, cache: 'no-store' }).catch(() => null)
        )
      );
    }, PREFETCH_DELAY_MS);
    return () => { window.clearTimeout(timeoutId); controller.abort(); };
  }, [center, radius]);

  useEffect(() => {
    if (query) return;
    const id = window.setInterval(() => setPromptIndex((i) => (i + 1) % SEARCH_PROMPTS.length), 2600);
    return () => window.clearInterval(id);
  }, [query]);

  async function handleSearch() {
    if (!query || !center) return;
    eventFetchAbortRef.current?.abort();
    setLoading(true);
    try {
      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, latitude: center[0], longitude: center[1], radius }),
      });
      if (!res.ok) { if (hasLoadedRealEventsRef.current) setEvents([]); return; }
      const data = await res.json();
      setEvents(data.events ?? []);
      setHasLoadedRealEvents(true);
      hasLoadedRealEventsRef.current = true;
    } finally {
      setLoading(false);
    }
  }

  function openDrawer(event: EventSummary) {
    setPreviewedEventId(event.id);
    setDrawerEvent(event);
    setDrawerOpen(true);
  }

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-4 sm:px-6">

        {/* Search bar */}
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleSearch()}
              placeholder={query ? '' : SEARCH_PROMPTS[promptIndex]}
              className="h-11 pl-10 rounded-xl border-[var(--line)] bg-[var(--surface-strong)] text-sm focus-visible:ring-[var(--accent)]"
            />
          </div>
          <Button onClick={() => void handleSearch()} className="h-11 rounded-xl px-4 bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white">
            Search
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`h-11 w-11 rounded-xl p-0 border-[var(--line)] ${showFilters ? 'bg-[var(--accent-soft)] border-[var(--accent)]' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Category chips */}
        <div className="mb-4 flex flex-wrap gap-2">
          {EVENT_CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setQuery(cat.hint)}
              className="rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:opacity-80"
              style={{
                background: cat.accentSoft,
                borderColor: cat.accentSoft,
                color: cat.accentStrong,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Radius filter (collapsible) */}
        {showFilters && (
          <div className="mb-4 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Search radius</span>
              <span className="text-sm font-semibold text-[var(--accent)]">{radiusLabel}</span>
            </div>
            <Slider
              value={[radius]}
              min={1000}
              max={20000}
              step={500}
              onValueChange={(v) => setRadius(v[0] ?? radius)}
              className="[&_[role=slider]]:border-[var(--accent)] [&_[role=slider]]:bg-[var(--accent)]"
            />
            <div className="mt-2 flex justify-between text-xs text-[var(--muted)]">
              <span>1 km</span>
              <span>20 km</span>
            </div>
          </div>
        )}

        {/* View mode toggle + status row */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <LocateFixed className="h-4 w-4 text-[var(--secondary)]" />
            {center ? (
              <span>
                <span className="font-medium text-[var(--text)]">{featuredEvents.length}</span> events nearby
              </span>
            ) : (
              <span>Finding your location…</span>
            )}
          </div>

          {/* Feed / Map toggle */}
          <div className="view-toggle">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'feed' ? 'active' : ''}`}
              onClick={() => setViewMode('feed')}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Feed
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => setViewMode('map')}
            >
              <Map className="h-3.5 w-3.5" />
              Map
            </button>
          </div>
        </div>

        {/* MAP VIEW */}
        {viewMode === 'map' && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--line)] shadow-sm" style={{ height: '60vh' }}>
            <MapView
              events={featuredEvents}
              center={center}
              radius={radius}
              previewedEventId={previewedEventId}
              onPreviewEvent={(e) => setPreviewedEventId(e.id)}
              onOpenEvent={openDrawer}
            />
          </div>
        )}

        {/* FEED VIEW */}
        {viewMode === 'feed' && (
          <>
            {/* Loading skeleton */}
            {loading && (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-[280px] animate-pulse rounded-2xl border border-[var(--line)] bg-[var(--surface)]" />
                ))}
              </div>
            )}

            {/* Event cards */}
            {!loading && featuredEvents.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {featuredEvents.map((event) => {
                  const theme = getEventTheme(event);
                  return (
                    <article
                      key={event.id}
                      className="group overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      {/* Banner */}
                      <button
                        type="button"
                        className="block w-full text-left"
                        onClick={() => openDrawer(event)}
                      >
                        <div className="relative h-44 overflow-hidden bg-[var(--bg-deep)]">
                          {event.bannerUrl ? (
                            <ResilientImage
                              src={event.bannerUrl}
                              alt={event.title}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              fallback={
                                <div
                                  className="h-full w-full"
                                  style={{ background: `linear-gradient(135deg, ${theme.accentStrong} 0%, ${theme.accent} 100%)` }}
                                />
                              }
                            />
                          ) : (
                            <div
                              className="h-full w-full"
                              style={{ background: `linear-gradient(135deg, ${theme.accentStrong} 0%, ${theme.accent} 100%)` }}
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          {/* Category badge */}
                          <span
                            className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest"
                            style={{ background: theme.accentSoft, color: theme.accentStrong }}
                          >
                            {theme.label}
                          </span>
                          {/* Title overlay */}
                          <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                            <h3 className="text-lg font-semibold leading-tight">{event.title}</h3>
                          </div>
                        </div>
                      </button>

                      {/* Card body */}
                      <div className="p-3.5 space-y-3">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface-strong)] px-2.5 py-1 text-xs text-[var(--muted)]">
                            <CalendarClock className="h-3 w-3" style={{ color: theme.accent }} />
                            {formatEventDay(event.startTime)} · {formatEventRange(event.startTime, event.endTime)}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface-strong)] px-2.5 py-1 text-xs text-[var(--muted)]">
                            <Users className="h-3 w-3" style={{ color: theme.accent }} />
                            {event.capacity} spots
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs rounded-lg border-[var(--line)]"
                            onClick={() => openDrawer(event)}
                          >
                            Quick view
                          </Button>
                          <Button asChild size="sm" className="flex-1 h-8 text-xs rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white border-0">
                            <Link href={`/events/${event.id}`}>RSVP</Link>
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Empty state */}
            {!loading && featuredEvents.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-soft)]">
                  <MapPin className="h-7 w-7 text-[var(--accent)]" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Nothing happening nearby yet</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Try widening the radius or be the first to host something.
                  </p>
                </div>
                <Button asChild size="sm" className="rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white border-0">
                  <Link href="/events/new">
                    <Plus className="h-4 w-4 mr-1" />
                    Host an event
                  </Link>
                </Button>
              </div>
            )}
          </>
        )}

        {/* Map view event list below map */}
        {viewMode === 'map' && !loading && featuredEvents.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--muted)] mb-3">{featuredEvents.length} events in this area</p>
            {featuredEvents.map((event) => {
              const theme = getEventTheme(event);
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => openDrawer(event)}
                  className="flex w-full items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-left transition-colors hover:bg-[var(--surface-strong)]"
                >
                  <div
                    className="h-12 w-12 shrink-0 rounded-xl"
                    style={{ background: `linear-gradient(135deg, ${theme.accentStrong} 0%, ${theme.accent} 100%)` }}
                  >
                    {event.bannerUrl && (
                      <ResilientImage
                        src={event.bannerUrl}
                        alt={event.title}
                        className="h-full w-full rounded-xl object-cover"
                        fallback={null}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {formatEventDay(event.startTime)} · {formatEventRange(event.startTime, event.endTime)}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ background: theme.accentSoft, color: theme.accentStrong }}
                  >
                    {theme.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* My Events — visible to logged-in users, shows all their events regardless of location */}
      {status === 'authenticated' && (myEventsLoading || myEvents.length > 0) && (
        <div className="mx-auto max-w-5xl px-4 pb-6 sm:px-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Your events</p>
              <h2 className="mt-1 text-lg font-semibold">Events you've published</h2>
            </div>
            <Button asChild size="sm" variant="outline" className="rounded-xl border-[var(--line)] text-xs">
              <Link href="/events/new">
                <Plus className="h-3.5 w-3.5 mr-1" />
                New event
              </Link>
            </Button>
          </div>

          {myEventsLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl border border-[var(--line)] bg-[var(--surface)]" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {myEvents.map((event) => {
                const theme = getEventTheme(event);
                return (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {/* Thumbnail */}
                    <div
                      className="h-14 w-14 shrink-0 overflow-hidden rounded-xl"
                      style={{ background: `linear-gradient(135deg, ${theme.accentStrong} 0%, ${theme.accent} 100%)` }}
                    >
                      {event.bannerUrl && (
                        <ResilientImage
                          src={event.bannerUrl}
                          alt={event.title}
                          className="h-full w-full object-cover"
                          fallback={null}
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{event.title}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {formatEventDay(event.startTime)} · {formatEventRange(event.startTime, event.endTime)}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                          style={{ background: theme.accentSoft, color: theme.accentStrong }}
                        >
                          {theme.label}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-[var(--muted)]">
                          <Users className="h-3 w-3" />
                          {event.rsvpCount} RSVPs
                        </span>
                        {event.visibility === 'PRIVATE' && (
                          <span className="rounded-full bg-[rgba(148,163,184,0.15)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted)]">
                            Private
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 flex-col gap-1.5">
                      <Button asChild size="sm" className="h-7 rounded-lg bg-[var(--accent)] px-3 text-xs text-white border-0 hover:bg-[var(--accent-strong)]">
                        <Link href={`/events/${event.id}`}>View</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="h-7 rounded-lg border-[var(--line)] px-3 text-xs">
                        <Link href={`/events/${event.id}/edit`}>
                          <Edit2 className="h-3 w-3 mr-1" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FAB for hosting */}
      <Button
        asChild
        className="fixed bottom-5 right-5 z-40 h-12 rounded-xl shadow-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white border-0"
      >
        <Link href="/events/new">
          <Plus className="h-4 w-4 mr-1.5" />
          Host
        </Link>
      </Button>

      <EventPreviewDrawer
        event={drawerEvent}
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setDrawerEvent(null);
        }}
      />
    </>
  );
}
