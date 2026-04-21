'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowUpRight, CalendarClock, LocateFixed, MapPin, Maximize2, Minimize2, Radar, Search, Sparkles, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { ResilientImage } from '@/components/ResilientImage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { SwipeDeck } from '@/components/SwipeDeck';
import { EventPreviewDrawer } from '@/components/EventPreviewDrawer';
import type { EventSummary } from '@/lib/types';
import { EVENT_CATEGORY_OPTIONS, SEARCH_PROMPTS, formatEventDay, formatEventRange, getEventTheme } from '@/lib/event-style';

const MapView = dynamic(
  () => import('@/components/MapView').then((m) => m.MapView),
  { ssr: false }
);

const LOCATION_SYNC_DISTANCE_THRESHOLD_METERS = 75;
const LOCATION_SYNC_THROTTLE_MS = 8_000;
const EVENT_FETCH_DEBOUNCE_MS = 250;
const PREFETCH_DELAY_MS = 1_200;

const DISCOVER_SEEDED_EVENTS: EventSummary[] = [
  {
    id: 'seed-discover-run',
    title: 'Sunrise Run + Chai',
    description: 'An easy-paced neighborhood run that ends with chai and conversation.',
    bannerUrl: '',
    badgeIcon: '',
    latitude: 28.6182,
    longitude: 77.2115,
    startTime: '2026-04-20T01:30:00.000Z',
    endTime: '2026-04-20T03:00:00.000Z',
    visibility: 'PUBLIC',
    capacity: 30,
    organizerId: 'seed',
    isPaid: false,
    engagementScore: 92
  },
  {
    id: 'seed-discover-art',
    title: 'Terrace Painting Jam',
    description: 'A mellow evening workshop with live demos and open easels.',
    bannerUrl: '',
    badgeIcon: '',
    latitude: 28.6124,
    longitude: 77.2048,
    startTime: '2026-04-20T11:30:00.000Z',
    endTime: '2026-04-20T13:30:00.000Z',
    visibility: 'PUBLIC',
    capacity: 18,
    organizerId: 'seed',
    isPaid: true,
    engagementScore: 89
  },
  {
    id: 'seed-discover-code',
    title: 'Local Coding Circle',
    description: 'A low-pressure build session for beginners and regulars alike.',
    bannerUrl: '',
    badgeIcon: '',
    latitude: 28.6099,
    longitude: 77.2261,
    startTime: '2026-04-21T12:00:00.000Z',
    endTime: '2026-04-21T14:00:00.000Z',
    visibility: 'PUBLIC',
    capacity: 26,
    organizerId: 'seed',
    isPaid: false,
    engagementScore: 87
  },
  {
    id: 'seed-discover-market',
    title: 'Weekend Makers Market',
    description: 'Find local creators, food pop-ups, and community-led mini sessions.',
    bannerUrl: '',
    badgeIcon: '',
    latitude: 28.6157,
    longitude: 77.2191,
    startTime: '2026-04-19T10:00:00.000Z',
    endTime: '2026-04-19T14:30:00.000Z',
    visibility: 'PUBLIC',
    capacity: 80,
    organizerId: 'seed',
    isPaid: false,
    engagementScore: 95
  },
  {
    id: 'seed-discover-yoga',
    title: 'Park Yoga + Breathwork',
    description: 'A guided outdoor morning session focused on mobility and reset.',
    bannerUrl: '',
    badgeIcon: '',
    latitude: 28.6213,
    longitude: 77.2074,
    startTime: '2026-04-22T01:00:00.000Z',
    endTime: '2026-04-22T02:15:00.000Z',
    visibility: 'PUBLIC',
    capacity: 35,
    organizerId: 'seed',
    isPaid: false,
    engagementScore: 86
  }
];

function distanceMeters([lat1, lng1]: [number, number], [lat2, lng2]: [number, number]) {
  const R = 6371e3;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function MapScreen() {
  const { status } = useSession();
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [radius, setRadius] = useState(5000);
  const [events, setEvents] = useState<EventSummary[]>(DISCOVER_SEEDED_EVENTS);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const [previewedEventId, setPreviewedEventId] = useState<string | null>(null);
  const [drawerEvent, setDrawerEvent] = useState<EventSummary | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hasLoadedRealEvents, setHasLoadedRealEvents] = useState(false);

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

  const featuredEvents = events.slice(0, 6);
  const previewedEvent = featuredEvents.find((event) => event.id === previewedEventId) ?? featuredEvents[0] ?? null;
  const radiusLabel = `${(radius / 1000).toFixed(1)} km`;

  const updateLocation = useCallback(async (nextCenter: [number, number]) => {
    if (status !== 'authenticated' || locationSyncSuppressedRef.current) {
      return;
    }

    const now = Date.now();
    if (now - lastLocationSyncAtRef.current < LOCATION_SYNC_THROTTLE_MS) {
      return;
    }

    const previous = lastLocationSyncRef.current;
    if (previous) {
      const movedMeters = distanceMeters(previous.center, nextCenter);
      const radiusChanged = previous.radius !== radius;
      if (!radiusChanged && movedMeters < LOCATION_SYNC_DISTANCE_THRESHOLD_METERS) {
        return;
      }
    }

    lastLocationSyncAtRef.current = now;

    try {
      const res = await fetch('/api/users/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: nextCenter[0], longitude: nextCenter[1], radius })
      });

      if (res.status === 401) {
        locationSyncSuppressedRef.current = true;
        return;
      }

      if (res.ok) {
        lastLocationSyncRef.current = { center: nextCenter, radius };
      }
    } catch {
      // Location sync is best-effort.
    }
  }, [radius, status]);

  useEffect(() => {
    const resolveFallback = async () => {
      try {
        const res = await fetch('/api/geo/ip');
        if (res.ok) {
          const data = await res.json();
          setCenter([data.latitude, data.longitude]);
          return;
        }
      } catch {
        // IP geo is optional.
      }
      setCenter([28.6139, 77.209]);
    };

    if (!('geolocation' in navigator)) {
      void resolveFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
      () => void resolveFallback()
    );
  }, []);

  useEffect(() => {
    if (!centerParams) {
      return;
    }

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
            if (requestId === eventRequestIdRef.current) {
              setHasLoadedRealEvents(true);
              hasLoadedRealEventsRef.current = true;
            }
            return;
          }
          const data = await res.json();
          if (controller.signal.aborted || requestId !== eventRequestIdRef.current) {
            return;
          }

          const nextEvents = Array.isArray(data.events) ? data.events : [];
          setEvents(nextEvents);
          setHasLoadedRealEvents(true);
          hasLoadedRealEventsRef.current = true;
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            return;
          }
          if (requestId === eventRequestIdRef.current) {
            setHasLoadedRealEvents(true);
            hasLoadedRealEventsRef.current = true;
          }
        } finally {
          if (requestId === eventRequestIdRef.current) {
            setLoading(false);
          }
        }
      })();
    }, EVENT_FETCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
      controller?.abort();
    };
  }, [centerParams]);

  useEffect(() => {
    return () => {
      eventFetchAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!center) return;
    void updateLocation(center);
  }, [center, updateLocation]);

  useEffect(() => {
    if (status === 'authenticated') {
      locationSyncSuppressedRef.current = false;
      return;
    }
    if (status === 'unauthenticated') {
      locationSyncSuppressedRef.current = false;
      lastLocationSyncRef.current = null;
      lastLocationSyncAtRef.current = 0;
    }
  }, [status]);

  useEffect(() => {
    if (!center || prefetchStartedRef.current) {
      return;
    }

    prefetchStartedRef.current = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      const prefetchRadii = Array.from(
        new Set([
          radius,
          Math.max(1_000, radius - 1_000),
          Math.min(20_000, radius + 1_500)
        ])
      );
      void Promise.all(
        prefetchRadii.map((prefetchRadius) =>
          fetch(`/api/events?lat=${center[0]}&lng=${center[1]}&radius=${prefetchRadius}`, {
            signal: controller.signal,
            cache: 'no-store'
          }).catch(() => null)
        )
      );
    }, PREFETCH_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [center, radius]);

  useEffect(() => {
    if (query) return;
    const id = window.setInterval(() => {
      setPromptIndex((current) => (current + 1) % SEARCH_PROMPTS.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, [query]);

  useEffect(() => {
    if (!featuredEvents.length) {
      setPreviewedEventId(null);
      return;
    }

    if (!previewedEventId || !featuredEvents.some((event) => event.id === previewedEventId)) {
      setPreviewedEventId(featuredEvents[0].id);
    }
  }, [featuredEvents, previewedEventId]);

  async function handleSearch() {
    if (!query || !center) return;
    eventFetchAbortRef.current?.abort();
    setLoading(true);
    try {
      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, latitude: center[0], longitude: center[1], radius })
      });
      if (!res.ok) {
        if (hasLoadedRealEventsRef.current) {
          setEvents([]);
        }
        return;
      }
      const data = await res.json();
      setEvents(data.events ?? []);
      setHasLoadedRealEvents(true);
      hasLoadedRealEventsRef.current = true;
    } finally {
      setLoading(false);
    }
  }

  function previewEvent(event: EventSummary) {
    setPreviewedEventId(event.id);
  }

  function openDrawer(event: EventSummary) {
    setPreviewedEventId(event.id);
    setDrawerEvent(event);
    setDrawerOpen(true);
  }

  const pulseCopy = !center
    ? 'Finding your ilaaka and pinning the map around you.'
    : loading && !hasLoadedRealEvents
      ? 'Loading a first set of nearby events so the map feels alive right away.'
      : loading
      ? 'Refreshing nearby markers and local activity.'
      : featuredEvents.length
        ? `${featuredEvents.length} live events in range, with the strongest moments pulled forward first.`
        : 'Nothing public is live yet. Widen the radius or host the first thing worth showing up for.';

  return (
    <>
      {mapExpanded ? (
        <div className="fixed inset-0 z-[60] bg-[var(--bg-deep)]">
          <div className="relative h-full w-full overflow-hidden">
            <MapView
              events={featuredEvents}
              center={center}
              radius={radius}
              previewedEventId={previewedEventId}
              onPreviewEvent={previewEvent}
              onOpenEvent={openDrawer}
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(12,18,24,0.18)_0%,rgba(12,18,24,0.02)_40%,rgba(12,18,24,0.4)_100%)]" />

            <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
              <Card className="surface-card-strong max-w-2xl rounded-[1.8rem] p-4">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && void handleSearch()}
                      placeholder={query ? '' : SEARCH_PROMPTS[promptIndex]}
                      className="h-14 pl-11 text-base"
                    />
                  </div>
                  <Button size="lg" onClick={() => void handleSearch()} className="w-full md:w-auto">
                    <Search className="h-4 w-4" />
                    Search
                  </Button>
                </div>
              </Card>
              <Button type="button" variant="outline" size="sm" className="h-12 w-12 rounded-full p-0" onClick={() => setMapExpanded(false)}>
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>

            {previewedEvent ? (
              <button
                type="button"
                onClick={() => openDrawer(previewedEvent)}
                className="absolute bottom-4 left-4 right-4 rounded-[1.8rem] border border-white/16 bg-[rgba(15,23,42,0.58)] p-4 text-left text-white shadow-[0_18px_44px_rgba(15,23,42,0.2)] backdrop-blur-xl sm:max-w-md"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/64">Marker preview</p>
                <p className="mt-2 text-xl font-semibold">{previewedEvent.title}</p>
                <p className="mt-1 text-sm text-white/72">
                  {formatEventDay(previewedEvent.startTime)} / {formatEventRange(previewedEvent.startTime, previewedEvent.endTime)}
                </p>
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
          <section className="section-shell relative overflow-hidden p-5 sm:p-6 lg:p-8">
            <div className="absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.42),transparent_72%)]" />
            <div className="relative space-y-6">
              <div className="space-y-4">
                <p className="eyebrow">
                  <Radar className="h-3.5 w-3.5" />
                  Hyperlocal field guide
                </p>
                <h1 className="max-w-3xl font-[family:var(--font-fraunces)] text-4xl leading-[0.94] sm:text-5xl lg:text-[3.85rem]">
                  Discover the kind of things that make a neighborhood feel alive.
                </h1>
                <p className="max-w-2xl text-[15px] leading-7 text-muted sm:text-base">
                  The map stays central, the markers stay lively, and every strong signal can open into a quick drawer without breaking your flow.
                </p>
              </div>

              <div className="relative z-10 space-y-3">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && void handleSearch()}
                      placeholder={query ? '' : SEARCH_PROMPTS[promptIndex]}
                      className="h-14 pl-11 text-base"
                    />
                  </div>
                  <Button size="lg" onClick={() => void handleSearch()} className="h-14 w-full sm:w-auto">
                    <Search className="h-4 w-4" />
                    Search nearby
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {EVENT_CATEGORY_OPTIONS.map((category) => (
                    <button
                      key={category.key}
                      type="button"
                      className="info-pill min-h-[40px] px-4 py-2 text-sm"
                      onClick={() => setQuery(category.hint)}
                      style={{ background: category.accentSoft, color: category.accentStrong }}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="info-pill">
                    <LocateFixed className="h-4 w-4 text-[var(--secondary)]" />
                    {center ? 'Location locked' : 'Finding your map'}
                  </span>
                  <span className="info-pill">
                    <MapPin className="h-4 w-4 text-[var(--accent)]" />
                    {featuredEvents.length} live events
                  </span>
                  <span className="info-pill">
                    <CalendarClock className="h-4 w-4 text-[var(--secondary)]" />
                    Radius {radiusLabel}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="overflow-hidden rounded-[2.2rem] border border-[var(--line)] bg-[rgba(12,18,24,0.08)] shadow-[0_24px_80px_rgba(15,23,42,0.14)]">
                  <div className="relative h-[420px] sm:h-[500px]">
                    <MapView
                      events={featuredEvents}
                      center={center}
                      radius={radius}
                      previewedEventId={previewedEventId}
                      onPreviewEvent={previewEvent}
                      onOpenEvent={openDrawer}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(12,18,24,0.1)_0%,rgba(12,18,24,0.02)_40%,rgba(12,18,24,0.34)_100%)]" />

                    <div className="pointer-events-none absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
                      <Card className="surface-card-strong pointer-events-auto max-w-md rounded-[1.6rem] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--secondary)]">
                          Neighborhood pulse
                        </p>
                        <p className="mt-2 text-sm leading-6 text-muted">{pulseCopy}</p>
                      </Card>
                      <Button type="button" variant="outline" size="sm" className="pointer-events-auto h-11 w-11 rounded-full p-0" onClick={() => setMapExpanded(true)}>
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {previewedEvent ? (
                      <button
                        type="button"
                        onClick={() => openDrawer(previewedEvent)}
                        className="absolute bottom-4 left-4 right-4 rounded-[1.8rem] border border-white/16 bg-[rgba(15,23,42,0.58)] p-4 text-left text-white shadow-[0_18px_44px_rgba(15,23,42,0.2)] backdrop-blur-xl sm:max-w-md"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/64">Marker preview</p>
                        <p className="mt-2 text-xl font-semibold">{previewedEvent.title}</p>
                        <p className="mt-1 text-sm text-white/72">
                          {formatEventDay(previewedEvent.startTime)} / {formatEventRange(previewedEvent.startTime, previewedEvent.endTime)}
                        </p>
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4">
                  <Card className="surface-card-strong overflow-hidden p-0">
                    {previewedEvent ? (
                      <>
                        <button type="button" className="w-full text-left" onClick={() => openDrawer(previewedEvent)}>
                          <div className="relative h-48 overflow-hidden">
                            {previewedEvent.bannerUrl ? (
                              <ResilientImage
                                src={previewedEvent.bannerUrl}
                                alt={previewedEvent.title}
                                className="h-full w-full object-cover"
                                fallback={
                                  <div
                                    className="h-full w-full"
                                    style={{ background: `linear-gradient(135deg, ${getEventTheme(previewedEvent).accentStrong} 0%, ${getEventTheme(previewedEvent).accent} 100%)` }}
                                  />
                                }
                              />
                            ) : (
                              <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${getEventTheme(previewedEvent).accentStrong} 0%, ${getEventTheme(previewedEvent).accent} 100%)` }} />
                            )}
                            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04)_14%,rgba(15,23,42,0.72)_100%)]" />
                            <div className="absolute left-4 right-4 bottom-4 text-white">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/68">{getEventTheme(previewedEvent).label}</p>
                              <h2 className="mt-2 text-2xl font-semibold leading-tight">{previewedEvent.title}</h2>
                            </div>
                          </div>
                        </button>
                        <div className="space-y-4 p-5">
                          <p className="text-sm leading-6 text-muted">{getEventTheme(previewedEvent).previewLine}</p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Button type="button" size="lg" onClick={() => openDrawer(previewedEvent)}>Open drawer</Button>
                            <Button asChild variant="outline" size="lg">
                              <Link href={`/events/${previewedEvent.id}`}>Full page</Link>
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-5 text-sm leading-6 text-muted">Hover a marker or tap a card to preview it here.</div>
                    )}
                  </Card>

                  <Card className="surface-card-strong overflow-hidden p-0">
                    <div className="bg-[linear-gradient(140deg,rgba(106,136,123,0.92)_0%,rgba(184,111,79,0.9)_100%)] p-5 text-white">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">Discovery control</p>
                      <h2 className="mt-3 font-[family:var(--font-fraunces)] text-3xl leading-none">Let the map breathe.</h2>
                      <p className="mt-3 text-sm leading-6 text-white/78">Keep the radius tight for serendipity or widen it when you want a fuller neighborhood picture.</p>
                    </div>
                    <div className="space-y-5 p-5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-muted">Search radius</span>
                        <span className="font-semibold text-[var(--accent)]">{radiusLabel}</span>
                      </div>
                      <div>
                        <Slider value={[radius]} min={1000} max={20000} step={500} onValueChange={(value) => setRadius(value[0] ?? radius)} />
                        <div className="mt-2 flex justify-between text-xs text-muted">
                          <span>1 km</span>
                          <span>20 km</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-1">
                {featuredEvents.map((event) => {
                  const theme = getEventTheme(event);
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onMouseEnter={() => previewEvent(event)}
                      onFocus={() => previewEvent(event)}
                      onClick={() => openDrawer(event)}
                      className="min-w-[220px] rounded-[1.75rem] border border-[var(--line)] bg-[rgba(255,255,255,0.42)] p-4 text-left transition duration-200 hover:-translate-y-1 hover:bg-[var(--surface-strong)] dark:bg-[rgba(15,23,42,0.24)]"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: theme.accentStrong }}>
                        {theme.label}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold leading-tight">{event.title}</h3>
                      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted">
                        {formatEventDay(event.startTime)} / {formatEventRange(event.startTime, event.endTime)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <Card className="space-y-4">
              <div className="space-y-3">
                <p className="eyebrow">
                  <Sparkles className="h-3.5 w-3.5" />
                  Mobile swipe
                </p>
                <h2 className="text-2xl font-semibold">Keep discovery playful.</h2>
                <p className="text-sm leading-6 text-muted">
                  Swipe through the strongest picks when you want a faster pass without losing the warmth of the map.
                </p>
              </div>
              <SwipeDeck events={featuredEvents} loading={loading} />
            </Card>

            <Card className="surface-card-strong overflow-hidden p-0">
              <div className="p-5 sm:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Host something</p>
                <h2 className="mt-3 font-[family:var(--font-fraunces)] text-3xl leading-none">
                  Turn a good local idea into a real invitation.
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted">
                  The creation flow now behaves more like a small creative studio, with live previews and better visual feedback.
                </p>
                <div className="mt-5">
                  <Button asChild size="lg">
                    <Link href="/events/new">
                      <Sparkles className="h-4 w-4" />
                      Create an event
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </aside>
        </div>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">
                <MapPin className="h-3.5 w-3.5" />
                Around you now
              </p>
              <h2 className="mt-3 font-[family:var(--font-fraunces)] text-4xl leading-none">
                A calmer list view when you want to compare.
              </h2>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/events/new">Create your own</Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid gap-4 transition-opacity duration-300 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-[260px] animate-pulse rounded-[2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />
              ))}
            </div>
          ) : null}

          {!loading && featuredEvents.length ? (
            <div className="grid gap-4 transition-opacity duration-300 md:grid-cols-2">
              {featuredEvents.map((event) => {
                const theme = getEventTheme(event);
                return (
                  <article key={event.id} className="overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] shadow-[0_24px_70px_rgba(17,24,39,0.12)] transition-all duration-200 hover:-translate-y-1 hover:bg-[var(--surface-strong)]" onMouseEnter={() => previewEvent(event)}>
                    <button type="button" className="block w-full text-left" onClick={() => openDrawer(event)}>
                      <div className="relative h-52 overflow-hidden">
                        {event.bannerUrl ? (
                          <ResilientImage
                            src={event.bannerUrl}
                            alt={event.title}
                            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                            fallback={
                              <div
                                className="flex h-full w-full items-center justify-center text-5xl text-white"
                                style={{ background: `linear-gradient(135deg, ${theme.accentStrong} 0%, ${theme.accent} 100%)` }}
                              >
                                {event.title.charAt(0)}
                              </div>
                            }
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-5xl text-white" style={{ background: `linear-gradient(135deg, ${theme.accentStrong} 0%, ${theme.accent} 100%)` }}>
                            {event.title.charAt(0)}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04)_18%,rgba(15,23,42,0.68)_100%)]" />
                        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
                          <span className="rounded-full bg-white/86 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-800">{theme.label}</span>
                          <span className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]" style={{ background: theme.accentSoft, color: theme.accentStrong }}>
                            {formatEventDay(event.startTime)}
                          </span>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                          <h3 className="text-2xl font-semibold leading-tight">{event.title}</h3>
                          <p className="mt-1 text-sm text-white/72">{theme.previewLine}</p>
                        </div>
                      </div>
                    </button>

                    <div className="space-y-4 p-5">
                      <p className="line-clamp-3 text-sm leading-6 text-muted">{event.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="info-pill px-3 py-1.5 text-xs">
                          <CalendarClock className="h-3.5 w-3.5" style={{ color: theme.accent }} />
                          {formatEventRange(event.startTime, event.endTime)}
                        </span>
                        <span className="info-pill px-3 py-1.5 text-xs">
                          <Users className="h-3.5 w-3.5" style={{ color: theme.accent }} />
                          Cap {event.capacity}
                        </span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => openDrawer(event)}>
                          Quick view
                        </Button>
                        <Button asChild size="sm">
                          <Link href={`/events/${event.id}`}>Open full page</Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>

        <Button asChild className="fixed bottom-5 right-5 z-[45] lg:hidden">
          <Link href="/events/new">
            <Sparkles className="h-4 w-4" />
            Host
          </Link>
        </Button>
      </div>

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

