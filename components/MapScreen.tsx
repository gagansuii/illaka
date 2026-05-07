'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useGeolocation } from '@/lib/useGeolocation';
import dynamic from 'next/dynamic';
import { LocateFixed, MapPin, Maximize2, Minimize2, Search } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { ResilientImage } from '@/components/ResilientImage';
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

function distanceMeters([lat1, lng1]: [number, number], [lat2, lng2]: [number, number]) {
  const R = 6371e3;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const FlyerEventCard = React.memo(function FlyerEventCard({ event, onPreview, onOpen, active }: {
  event: EventSummary;
  onPreview: (e: EventSummary) => void;
  onOpen: (e: EventSummary) => void;
  active: boolean;
}) {
  const theme = getEventTheme(event);
  const tintBg = theme.accentSoft;

  return (
    <button
      type="button"
      onMouseEnter={() => onPreview(event)}
      onFocus={() => onPreview(event)}
      onClick={() => onOpen(event)}
      style={{
        background: 'var(--paper-card)',
        border: `1.5px solid ${active ? 'var(--terra)' : 'var(--ink)'}`,
        boxShadow: active ? '2px 2px 0 var(--terra)' : '2px 2px 0 var(--ink)',
        padding: 0, cursor: 'pointer', textAlign: 'left',
        transition: 'all 150ms ease', display: 'block',
        flexShrink: 0, width: 196,
        transform: active ? 'translateY(-3px)' : 'none',
      }}
    >
      {event.bannerUrl ? (
        <div style={{ height: 90, overflow: 'hidden', borderBottom: '1.5px solid var(--ink)', position: 'relative' }}>
          <ResilientImage
            src={event.bannerUrl} alt={event.title}
            className="h-full w-full object-cover"
            fallback={<div style={{ height: '100%', background: tintBg }} />}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(35,28,21,0.5) 0%, transparent 50%)' }} />
        </div>
      ) : (
        <div style={{ height: 90, background: tintBg, borderBottom: '1.5px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 700, fontSize: 36, color: theme.accentStrong, opacity: 0.5 }}>
            {event.title.charAt(0)}
          </span>
        </div>
      )}
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.18em', color: theme.accentStrong, marginBottom: 4 }}>
          {theme.label}
        </div>
        <div style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 600, fontSize: 14, lineHeight: 1.15, color: 'var(--ink)' }}>
          {event.title}
        </div>
        <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-soft)', marginTop: 5 }}>
          {formatEventDay(event.startTime)} · {formatEventRange(event.startTime, event.endTime)}
        </div>
      </div>
    </button>
  );
});

export function MapScreen() {
  const { status } = useSession();
  const { center, status: geoStatus } = useGeolocation();
  const [radius, setRadius] = useState(5000);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
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
  const previewedEvent = featuredEvents.find(e => e.id === previewedEventId) ?? featuredEvents[0] ?? null;
  const radiusLabel = `${(radius / 1000).toFixed(1)} km`;

  const updateLocation = useCallback(async (nextCenter: [number, number]) => {
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: nextCenter[0], longitude: nextCenter[1], radius }),
      });
      if (res.status === 401) { locationSyncSuppressedRef.current = true; return; }
      if (res.ok) lastLocationSyncRef.current = { center: nextCenter, radius };
    } catch { /* best-effort */ }
  }, [radius, status]);

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
          setHasLoadedRealEvents(true); hasLoadedRealEventsRef.current = true;
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') return;
          if (requestId === eventRequestIdRef.current) { setHasLoadedRealEvents(true); hasLoadedRealEventsRef.current = true; }
        } finally {
          if (requestId === eventRequestIdRef.current) setLoading(false);
        }
      })();
    }, EVENT_FETCH_DEBOUNCE_MS);
    return () => { window.clearTimeout(timeoutId); controller?.abort(); };
  }, [centerParams]);

  useEffect(() => { return () => { eventFetchAbortRef.current?.abort(); }; }, []);
  useEffect(() => { if (!center) return; void updateLocation(center); }, [center, updateLocation]);

  useEffect(() => {
    if (status === 'authenticated') { locationSyncSuppressedRef.current = false; return; }
    if (status === 'unauthenticated') { locationSyncSuppressedRef.current = false; lastLocationSyncRef.current = null; lastLocationSyncAtRef.current = 0; }
  }, [status]);

  useEffect(() => {
    if (!center || prefetchStartedRef.current) return;
    prefetchStartedRef.current = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      const radii = Array.from(new Set([radius, Math.max(1_000, radius - 1_000), Math.min(20_000, radius + 1_500)]));
      void Promise.all(radii.map(r => fetch(`/api/events?lat=${center[0]}&lng=${center[1]}&radius=${r}`, { signal: controller.signal, cache: 'no-store' }).catch(() => null)));
    }, PREFETCH_DELAY_MS);
    return () => { window.clearTimeout(timeoutId); controller.abort(); };
  }, [center, radius]);

  useEffect(() => {
    if (query) return;
    const id = window.setInterval(() => setPromptIndex(c => (c + 1) % SEARCH_PROMPTS.length), 4000);
    return () => window.clearInterval(id);
  }, [query]);

  useEffect(() => {
    if (!featuredEvents.length) { setPreviewedEventId(null); return; }
    if (!previewedEventId || !featuredEvents.some(e => e.id === previewedEventId)) {
      setPreviewedEventId(featuredEvents[0].id);
    }
  }, [featuredEvents, previewedEventId]);

  async function handleSearch() {
    if (!query || !center) return;
    eventFetchAbortRef.current?.abort();
    setLoading(true);
    try {
      const res = await fetch('/api/ai-search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, latitude: center[0], longitude: center[1], radius }),
      });
      if (!res.ok) { if (hasLoadedRealEventsRef.current) setEvents([]); return; }
      const data = await res.json();
      setEvents(data.events ?? []);
      setHasLoadedRealEvents(true); hasLoadedRealEventsRef.current = true;
    } finally { setLoading(false); }
  }

  const previewEvent = useCallback((event: EventSummary) => { setPreviewedEventId(event.id); }, []);
  const openDrawer = useCallback((event: EventSummary) => { setPreviewedEventId(event.id); setDrawerEvent(event); setDrawerOpen(true); }, []);

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: '12px 14px 12px 38px',
    border: '1.5px solid var(--ink)', background: 'var(--paper-2)',
    fontFamily: 'var(--font-mono), monospace', fontSize: 11,
    color: 'var(--ink)', outline: 'none', borderRadius: 0,
  };

  return (
    <>
      {/* — Expanded fullscreen map — */}
      {mapExpanded && center && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'var(--ink)' }}>
          <div style={{ position: 'relative', height: '100%', width: '100%' }}>
            <MapView
              events={featuredEvents} center={center} radius={radius}
              previewedEventId={previewedEventId}
              onPreviewEvent={previewEvent} onOpenEvent={openDrawer}
            />
            {/* overlay search */}
            <div style={{ position: 'absolute', top: 14, left: 14, right: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, display: 'flex', background: 'var(--paper-card)', border: '1.5px solid var(--ink)', boxShadow: '2px 2px 0 var(--ink)', overflow: 'hidden' }}>
                <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
                  <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', pointerEvents: 'none' }} />
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && void handleSearch()}
                    placeholder={query ? '' : SEARCH_PROMPTS[promptIndex]}
                    style={inputStyle}
                  />
                </div>
                <button
                  type="button" onClick={() => void handleSearch()}
                  style={{ padding: '12px 16px', background: 'var(--terra)', border: 'none', borderLeft: '1.5px solid var(--ink)', color: 'var(--cream)', fontFamily: 'var(--font-mono), monospace', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', cursor: 'pointer' }}
                >
                  SEARCH
                </button>
              </div>
              <button
                type="button" onClick={() => setMapExpanded(false)}
                style={{ padding: 10, background: 'var(--paper-card)', border: '1.5px solid var(--ink)', boxShadow: '2px 2px 0 var(--ink)', cursor: 'pointer', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Minimize2 size={16} />
              </button>
            </div>

            {/* floating event preview */}
            {previewedEvent && (
              <button
                type="button" onClick={() => openDrawer(previewedEvent)}
                style={{ position: 'absolute', bottom: 14, left: 14, right: 14, background: 'var(--paper-card)', border: '1.5px solid var(--ink)', boxShadow: '2px 2px 0 var(--ink)', padding: '12px 14px', textAlign: 'left', cursor: 'pointer', maxWidth: 360 }}
              >
                <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--ink-soft)', marginBottom: 4 }}>MARKER PREVIEW</div>
                <div style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 600, fontSize: 20, lineHeight: 1.1, color: 'var(--ink)' }}>{previewedEvent.title}</div>
                <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-soft)', marginTop: 6 }}>
                  {formatEventDay(previewedEvent.startTime)} · {formatEventRange(previewedEvent.startTime, previewedEvent.endTime)}
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      <div style={{
        maxWidth: 720, margin: '0 auto', padding: '0 16px 100px',
        fontFamily: 'var(--font-mono), ui-monospace, monospace', color: 'var(--ink)',
      }}>
        {/* Masthead */}
        <div style={{ padding: '18px 0 14px', borderBottom: '1.5px solid var(--ink)', marginBottom: 0 }}>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.24em', color: 'var(--ink-soft)' }}>
            DISCOVER · YOUR ILAAKA
          </div>
          <h1 style={{
            fontFamily: 'var(--font-fraunces), serif', fontWeight: 600,
            fontSize: 'clamp(28px, 7vw, 42px)', lineHeight: 0.95, letterSpacing: '-0.025em', marginTop: 6,
          }}>
            what's happening{' '}
            <span style={{ fontFamily: 'var(--font-serif), serif', fontStyle: 'italic', color: 'var(--terra)' }}>round the corner.</span>
          </h1>
        </div>

        {/* Search bar */}
        <div style={{ display: 'flex', border: '1.5px solid var(--ink)', background: 'var(--paper-card)', boxShadow: '2px 2px 0 var(--ink)', margin: '16px 0 0', overflow: 'hidden' }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', pointerEvents: 'none' }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && void handleSearch()}
              placeholder={query ? '' : SEARCH_PROMPTS[promptIndex]}
              style={inputStyle}
            />
          </div>
          <button
            type="button" onClick={() => void handleSearch()}
            style={{ padding: '12px 16px', background: 'var(--terra)', border: 'none', borderLeft: '1.5px solid var(--ink)', color: 'var(--cream)', fontFamily: 'var(--font-mono), monospace', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            SEARCH NEARBY
          </button>
        </div>

        {/* Vibe filter chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {EVENT_CATEGORY_OPTIONS.map(cat => (
            <button
              key={cat.key} type="button"
              onClick={() => setQuery(cat.hint)}
              style={{
                padding: '5px 12px', border: `1.5px solid var(--ink)`,
                background: cat.accentSoft, color: cat.accentStrong,
                fontFamily: 'var(--font-mono), monospace', fontSize: 9,
                textTransform: 'uppercase', letterSpacing: '0.14em', cursor: 'pointer',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Status pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10, marginBottom: 14 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', border: '1px solid var(--ink-faint)', background: 'var(--paper-2)', fontFamily: 'var(--font-mono), monospace', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-soft)' }}>
            <LocateFixed size={10} style={{ color: geoStatus === 'resolved' ? 'var(--sage)' : geoStatus === 'pending' ? 'var(--mustard)' : 'var(--ink-faint)' }} />
            {geoStatus === 'pending' ? 'FINDING YOU…' : geoStatus === 'resolved' ? 'LOCATED' : geoStatus === 'ip-fallback' ? 'APPROX. LOCATION' : 'NO LOCATION'}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', border: '1px solid var(--ink-faint)', background: 'var(--paper-2)', fontFamily: 'var(--font-mono), monospace', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-soft)' }}>
            <MapPin size={10} style={{ color: 'var(--terra)' }} />
            {featuredEvents.length} EVENTS
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', border: '1px solid var(--ink-faint)', background: 'var(--paper-2)', fontFamily: 'var(--font-mono), monospace', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-soft)' }}>
            ◉ {radiusLabel} RADIUS
          </span>
        </div>

        {/* Map */}
        <div style={{ border: '1.5px solid var(--ink)', boxShadow: '2px 2px 0 var(--ink)', position: 'relative', overflow: 'hidden', height: 340 }}>
          {center ? (
            <MapView
              events={featuredEvents} center={center} radius={radius}
              previewedEventId={previewedEventId}
              onPreviewEvent={previewEvent} onOpenEvent={openDrawer}
            />
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'var(--paper-2)' }}>
              <LocateFixed size={28} color={geoStatus === 'pending' ? 'var(--mustard)' : 'var(--ink-faint)'} style={{ animation: geoStatus === 'pending' ? 'pulse 1.5s ease-in-out infinite' : 'none' }} />
              <p style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                {geoStatus === 'pending' ? 'FINDING YOUR ILAAKA…' : 'ENABLE LOCATION ACCESS'}
              </p>
            </div>
          )}

          {/* Expand button */}
          {center && (
            <button
              type="button" onClick={() => setMapExpanded(true)}
              style={{ position: 'absolute', top: 10, right: 10, padding: 8, background: 'var(--paper-card)', border: '1.5px solid var(--ink)', boxShadow: '1px 1px 0 var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
            >
              <Maximize2 size={14} color="var(--ink)" />
            </button>
          )}

          {/* Floating event preview card */}
          {previewedEvent && (
            <button
              type="button" onClick={() => openDrawer(previewedEvent)}
              style={{ position: 'absolute', bottom: 10, left: 10, background: 'var(--paper-card)', border: '1.5px solid var(--ink)', boxShadow: '2px 2px 0 var(--ink)', padding: '8px 12px', textAlign: 'left', cursor: 'pointer', maxWidth: 240, zIndex: 10 }}
            >
              <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--ink-soft)', marginBottom: 3 }}>PINNED</div>
              <div style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 600, fontSize: 15, lineHeight: 1.1, color: 'var(--ink)' }}>{previewedEvent.title}</div>
              <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-soft)', marginTop: 4 }}>
                {formatEventDay(previewedEvent.startTime)} · {formatEventRange(previewedEvent.startTime, previewedEvent.endTime)}
              </div>
            </button>
          )}
        </div>

        {/* Radius control */}
        <div style={{ border: '1.5px solid var(--ink)', borderTop: 'none', background: 'var(--paper-card)', boxShadow: '2px 2px 0 var(--ink)', padding: '10px 14px', marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--ink-soft)' }}>SEARCH RADIUS</span>
            <span style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 600, fontSize: 16, color: 'var(--terra)' }}>{radiusLabel}</span>
          </div>
          <Slider value={[radius]} min={1000} max={20000} step={500} onValueChange={v => setRadius(v[0] ?? radius)} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 8, color: 'var(--ink-faint)', letterSpacing: '0.14em' }}>1 KM</span>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 8, color: 'var(--ink-faint)', letterSpacing: '0.14em' }}>20 KM</span>
          </div>
        </div>

        {/* Horizontal event strip */}
        {featuredEvents.length > 0 && (
          <>
            <div className="ilaaka-sep" style={{ margin: '0 0 12px' }}>
              <span>near you now</span>
            </div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
              {featuredEvents.map(event => (
                <FlyerEventCard
                  key={event.id} event={event}
                  active={event.id === previewedEventId}
                  onPreview={previewEvent} onOpen={openDrawer}
                />
              ))}
            </div>
          </>
        )}

        {/* Loading skeletons */}
        {loading && !hasLoadedRealEvents && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ height: 180, border: '1.5px solid var(--ink-faint)', background: 'var(--paper-2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && hasLoadedRealEvents && featuredEvents.length === 0 && (
          <div style={{ marginTop: 20, border: '1.5px dashed var(--ink-faint)', padding: '28px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 600, fontSize: 22, color: 'var(--ink-soft)', marginBottom: 8 }}>
              Nothing pinned yet.
            </div>
            <p style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 16 }}>
              WIDEN THE RADIUS OR HOST THE FIRST THING WORTH SHOWING UP FOR.
            </p>
            <Link href="/events/new" style={{
              display: 'inline-block', padding: '10px 20px',
              background: 'var(--terra)', border: '1.5px solid var(--terra-deep)',
              boxShadow: '2px 2px 0 var(--terra-deep)', color: 'var(--cream)',
              fontFamily: 'var(--font-mono), monospace', fontSize: 10,
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', textDecoration: 'none',
            }}>
              HOST SOMETHING →
            </Link>
          </div>
        )}

        {/* Swipe deck section */}
        {featuredEvents.length > 0 && (
          <>
            <div className="ilaaka-sep" style={{ margin: '20px 0 12px' }}>
              <span>swipe through</span>
            </div>
            <div style={{ background: 'var(--paper-card)', border: '1.5px solid var(--ink)', boxShadow: '2px 2px 0 var(--ink)', padding: 16 }}>
              <SwipeDeck events={featuredEvents} loading={loading} />
            </div>
          </>
        )}

        {/* Host CTA */}
        <div className="ilaaka-sep" style={{ margin: '20px 0 12px' }}>
          <span>host something</span>
        </div>
        <div style={{ border: '1.5px solid var(--ink)', boxShadow: '2px 2px 0 var(--ink)', background: 'var(--paper-card)', padding: 18, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: 'linear-gradient(135deg, rgba(200,85,54,0.12), transparent)', borderLeft: '1.5px solid rgba(200,85,54,0.2)', borderBottom: '1.5px solid rgba(200,85,54,0.2)' }} />
          <div style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 600, fontSize: 22, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 8 }}>
            Turn a good local idea into
            <br /><span style={{ fontFamily: 'var(--font-serif), serif', fontStyle: 'italic', color: 'var(--terra)' }}>a real invitation.</span>
          </div>
          <p style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.12em', lineHeight: 1.7, marginBottom: 14 }}>
            Pin a gathering to the wall. Neighbours find it, RSVP, and show up.
          </p>
          <Link href="/events/new" style={{
            display: 'inline-block', padding: '11px 20px',
            background: 'var(--terra)', border: '1.5px solid var(--terra-deep)',
            boxShadow: '2px 2px 0 var(--terra-deep)', color: 'var(--cream)',
            fontFamily: 'var(--font-mono), monospace', fontSize: 10,
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', textDecoration: 'none',
          }}>
            CREATE AN EVENT →
          </Link>
        </div>
      </div>

      <EventPreviewDrawer
        event={drawerEvent}
        open={drawerOpen}
        onOpenChange={open => { setDrawerOpen(open); if (!open) setDrawerEvent(null); }}
      />
    </>
  );
}
