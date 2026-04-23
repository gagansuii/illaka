'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Globe, ImagePlus, Link2, LocateFixed, Lock, MapPin } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { EVENT_CATEGORY_OPTIONS, type EventCategoryKey, formatEventDay, formatEventRange } from '@/lib/event-style';
import { ResilientImage } from '@/components/ResilientImage';

const MapView = dynamic(
  () => import('@/components/MapView').then((module) => module.MapView),
  { ssr: false }
);

const INPUT: React.CSSProperties = {
  width: '100%', padding: '11px 12px', boxSizing: 'border-box',
  border: '1.5px solid var(--ink)', background: 'var(--paper-2)',
  fontFamily: 'var(--font-mono), monospace', fontSize: 12,
  color: 'var(--ink)', outline: 'none', borderRadius: 0,
};

const TEXTAREA: React.CSSProperties = {
  ...INPUT, resize: 'vertical', minHeight: 96,
};

function Sep({ label }: { label: string }) {
  return (
    <div className="illaka-sep" style={{ margin: '20px 0 14px' }}>
      <span>{label}</span>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--ink-soft)', marginBottom: 6 }}>
      {children}
    </label>
  );
}

function PaperCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="flyer-card-sm" style={{ padding: 16, ...style }}>
      {children}
    </div>
  );
}

function UploadZone({ id, label, hint, ready, loading, onFileSelect }: {
  id: string; label: string; hint: string;
  ready: boolean; loading: boolean;
  onFileSelect: (file: File) => Promise<void>;
}) {
  const [dragging, setDragging] = useState(false);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    await onFileSelect(file);
  }

  return (
    <div style={{
      border: `1.5px dashed ${ready ? 'var(--sage)' : 'var(--ink)'}`,
      background: ready ? 'rgba(108,125,87,0.08)' : dragging ? 'rgba(35,28,21,0.04)' : 'var(--paper-2)',
      padding: 16, textAlign: 'center', position: 'relative',
      transition: 'all 150ms ease',
    }}>
      <input
        id={id} type="file" accept="image/*"
        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
        onChange={e => void handleFiles(e.target.files)}
      />
      <label htmlFor={id}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); void handleFiles(e.dataTransfer.files); }}
        style={{ display: 'block', cursor: 'pointer' }}
      >
        <div style={{
          width: 36, height: 36, margin: '0 auto 10px',
          border: `1.5px solid ${ready ? 'var(--sage)' : 'var(--ink)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: ready ? 'var(--sage)' : 'var(--ink-soft)',
        }}>
          {ready ? '✓' : <ImagePlus size={16} />}
        </div>
        <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: ready ? 'var(--sage)' : 'var(--ink)' }}>
          {loading ? 'UPLOADING…' : ready ? 'READY' : label}
        </div>
        <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, color: 'var(--ink-soft)', marginTop: 4, letterSpacing: '0.1em' }}>
          {hint}
        </div>
      </label>
    </div>
  );
}

function ToggleChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 14px', border: '1.5px solid var(--ink)',
        background: active ? 'var(--ink)' : 'var(--paper-2)',
        color: active ? 'var(--cream)' : 'var(--ink)',
        fontFamily: 'var(--font-mono), monospace', fontSize: 10,
        textTransform: 'uppercase', letterSpacing: '0.16em', cursor: 'pointer',
        transition: 'all 120ms ease',
      }}
    >
      {children}
    </button>
  );
}

export default function CreateEventPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTimeVal, setStartTimeVal] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTimeVal, setEndTimeVal] = useState('');
  const [capacity, setCapacity] = useState(20);
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [isPaid, setIsPaid] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [bannerUrl, setBannerUrl] = useState('');
  const [badgeIcon, setBadgeIcon] = useState('');
  const [categoryKey, setCategoryKey] = useState<EventCategoryKey>('community');
  const [eventType, setEventType] = useState<'PHYSICAL' | 'ONLINE'>('PHYSICAL');
  const [onlineLink, setOnlineLink] = useState('');
  const [linkShareMode, setLinkShareMode] = useState<'IMMEDIATE' | 'BEFORE_EVENT'>('IMMEDIATE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingBadge, setUploadingBadge] = useState(false);
  const [paymentQrUrl, setPaymentQrUrl] = useState('');
  const [uploadingPaymentQr, setUploadingPaymentQr] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLatitude(pos.coords.latitude); setLongitude(pos.coords.longitude); },
      () => null,
      { timeout: 8000 }
    );
  }, []);

  const selectedTheme = EVENT_CATEGORY_OPTIONS.find(o => o.key === categoryKey) ?? EVENT_CATEGORY_OPTIONS[0];
  const mapCenter = latitude !== null && longitude !== null ? [latitude, longitude] as [number, number] : null;
  const previewTitle = title || `New ${selectedTheme.label.toLowerCase()} gathering`;
  const previewDescription = description || selectedTheme.previewLine;
  const startTime = startDate && startTimeVal ? `${startDate}T${startTimeVal}:00+05:30` : '';
  const endTime = endDate && endTimeVal ? `${endDate}T${endTimeVal}:00+05:30` : '';
  const previewFallbackStart = useMemo(() => { const d = new Date(); d.setMinutes(0,0,0); d.setHours(d.getHours()+1); return d.toISOString(); }, []);
  const previewFallbackEnd = useMemo(() => { const d = new Date(); d.setMinutes(0,0,0); d.setHours(d.getHours()+2); return d.toISOString(); }, []);
  const previewStart = startTime || previewFallbackStart;
  const previewEnd = endTime || previewFallbackEnd;

  const previewEvent = useMemo(() => {
    if (eventType === 'PHYSICAL' && (latitude === null || longitude === null)) return [];
    const lat = latitude ?? 0;
    const lng = longitude ?? 0;
    return [{ id: 'draft-preview', title: previewTitle, description: previewDescription, bannerUrl, badgeIcon, latitude: lat, longitude: lng, startTime: previewStart, endTime: previewEnd, visibility, capacity, organizerId: 'draft', isPaid, engagementScore: Math.max(12, Math.round(capacity * 0.6)) }];
  }, [badgeIcon, bannerUrl, capacity, eventType, isPaid, latitude, longitude, previewDescription, previewEnd, previewStart, previewTitle, visibility]);

  async function upload(file: File, folder: string) {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', folder);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    let data: any = null;
    try { data = await res.json(); } catch { data = null; }
    if (!res.ok || !data?.url) throw new Error(data?.error ?? 'Upload failed');
    return data.url as string;
  }

  async function handleBannerUpload(file: File) {
    setError(''); setUploadingBanner(true);
    try { setBannerUrl(await upload(file, 'ilaka/banners')); }
    catch (err) { setError(err instanceof Error ? err.message : 'Banner upload failed'); }
    finally { setUploadingBanner(false); }
  }

  async function handleBadgeUpload(file: File) {
    setError(''); setUploadingBadge(true);
    try { setBadgeIcon(await upload(file, 'ilaka/badges')); }
    catch (err) { setError(err instanceof Error ? err.message : 'Badge upload failed'); }
    finally { setUploadingBadge(false); }
  }

  async function handlePaymentQrUpload(file: File) {
    setError(''); setUploadingPaymentQr(true);
    try { setPaymentQrUrl(await upload(file, 'ilaka/payment-qr')); }
    catch (err) { setError(err instanceof Error ? err.message : 'QR upload failed'); }
    finally { setUploadingPaymentQr(false); }
  }

  async function useMyLocation() {
    if (!navigator.geolocation) { setError('Geolocation not supported.'); return; }
    setError('');
    navigator.geolocation.getCurrentPosition(
      pos => { setLatitude(pos.coords.latitude); setLongitude(pos.coords.longitude); },
      err => { setError(`Location error: ${err.message}`); },
      { timeout: 10000 }
    );
  }

  function toISTIso(localDt: string): string {
    if (!localDt) return localDt;
    return new Date(localDt).toISOString();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (eventType === 'PHYSICAL' && (latitude === null || longitude === null)) {
      setError('Please place the event on the map or use your current location.');
      return;
    }
    if (!bannerUrl || !badgeIcon) {
      setError('Please upload both a banner image and a badge icon.');
      return;
    }
    if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
      setError('End time must be after start time.');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, description,
        startTime: toISTIso(startTime),
        endTime: toISTIso(endTime),
        capacity, visibility, isPaid, latitude, longitude,
        bannerUrl, badgeIcon, eventType,
        onlineLink: eventType === 'ONLINE' ? onlineLink : undefined,
        linkShareMode: eventType === 'ONLINE' ? linkShareMode : undefined,
        paymentQrUrl: isPaid && paymentQrUrl ? paymentQrUrl : undefined,
      }),
    });
    setLoading(false);
    if (res.ok) { window.location.href = '/'; return; }
    let data: any = null;
    try { data = await res.json(); } catch { data = null; }
    setError(data?.error ?? 'Failed to create event.');
  }

  return (
    <div style={{
      maxWidth: 680, margin: '0 auto', padding: '0 16px 100px',
      fontFamily: 'var(--font-mono), ui-monospace, monospace',
      color: 'var(--ink)',
    }}>
      {/* Masthead */}
      <div style={{ padding: '18px 0 0', borderBottom: '1.5px solid var(--ink)', marginBottom: 0, paddingBottom: 14 }}>
        <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.24em', color: 'var(--ink-soft)' }}>HOST STUDIO · ILLAKA</div>
        <h1 style={{
          fontFamily: 'var(--font-fraunces), serif', fontWeight: 600,
          fontSize: 'clamp(32px, 8vw, 48px)', lineHeight: 0.95, letterSpacing: '-0.025em', marginTop: 6,
        }}>
          pin something{' '}
          <span style={{ fontFamily: 'var(--font-serif), serif', fontStyle: 'italic', color: 'var(--terra)' }}>worth showing up for.</span>
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* — STEP 1: THE STORY — */}
        <Sep label="① the story" />
        <PaperCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <FieldLabel>EVENT NAME</FieldLabel>
              <input
                style={INPUT} required
                placeholder="Give the gathering a name"
                value={title} onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>WHAT'S THE STORY?</FieldLabel>
              <textarea
                style={TEXTAREA}
                placeholder="Describe the mood, the activity, and why someone should show up"
                value={description} onChange={e => setDescription(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>PICK THE VIBE</FieldLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                {EVENT_CATEGORY_OPTIONS.map(cat => (
                  <button
                    key={cat.key} type="button"
                    onClick={() => setCategoryKey(cat.key)}
                    style={{
                      padding: '6px 12px',
                      border: `1.5px solid ${categoryKey === cat.key ? 'var(--terra)' : 'var(--ink)'}`,
                      background: categoryKey === cat.key ? cat.accentSoft : 'transparent',
                      color: categoryKey === cat.key ? cat.accentStrong : 'var(--ink)',
                      fontFamily: 'var(--font-mono), monospace', fontSize: 9,
                      textTransform: 'uppercase', letterSpacing: '0.16em', cursor: 'pointer',
                      transition: 'all 120ms ease',
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </PaperCard>

        {/* — STEP 2: PLACE & TIME — */}
        <Sep label="② place & time" />
        <PaperCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Event type */}
            <div>
              <FieldLabel>FORMAT</FieldLabel>
              <div style={{ display: 'flex', gap: 0, border: '1.5px solid var(--ink)' }}>
                <ToggleChip active={eventType === 'PHYSICAL'} onClick={() => setEventType('PHYSICAL')}>
                  <MapPin size={10} style={{ display: 'inline', marginRight: 4 }} />IN-PERSON
                </ToggleChip>
                <ToggleChip active={eventType === 'ONLINE'} onClick={() => setEventType('ONLINE')}>
                  <Globe size={10} style={{ display: 'inline', marginRight: 4 }} />ONLINE
                </ToggleChip>
              </div>
            </div>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <FieldLabel>START DATE</FieldLabel>
                <input type="date" style={INPUT} value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <FieldLabel>START TIME</FieldLabel>
                <input type="time" style={INPUT} value={startTimeVal} onChange={e => setStartTimeVal(e.target.value)} />
              </div>
              <div>
                <FieldLabel>END DATE</FieldLabel>
                <input type="date" style={INPUT} value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              <div>
                <FieldLabel>END TIME</FieldLabel>
                <input type="time" style={INPUT} value={endTimeVal} onChange={e => setEndTimeVal(e.target.value)} />
              </div>
            </div>

            {/* Capacity */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <FieldLabel>CAPACITY</FieldLabel>
                <span style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 600, fontSize: 18, color: 'var(--terra)' }}>{capacity}</span>
              </div>
              <Slider value={[capacity]} min={5} max={150} step={1} onValueChange={v => setCapacity(v[0] ?? capacity)} />
            </div>

            {/* Visibility */}
            <div>
              <FieldLabel>VISIBILITY</FieldLabel>
              <div style={{ display: 'flex', gap: 0, border: '1.5px solid var(--ink)' }}>
                <ToggleChip active={visibility === 'PUBLIC'} onClick={() => setVisibility('PUBLIC')}>PUBLIC</ToggleChip>
                <ToggleChip active={visibility === 'PRIVATE'} onClick={() => setVisibility('PRIVATE')}>
                  <Lock size={10} style={{ display: 'inline', marginRight: 4 }} />PRIVATE
                </ToggleChip>
              </div>
              <p style={{ fontSize: 9, color: 'var(--ink-soft)', marginTop: 6, letterSpacing: '0.1em' }}>
                {visibility === 'PUBLIC' ? 'DISCOVERABLE IN THE MAP AND FEED' : 'VISIBLE ONLY TO PEOPLE YOU INVITE'}
              </p>
            </div>

            {/* Paid toggle */}
            <div>
              <FieldLabel>PRICING</FieldLabel>
              <div style={{ display: 'flex', gap: 0, border: '1.5px solid var(--ink)' }}>
                <ToggleChip active={!isPaid} onClick={() => setIsPaid(false)}>FREE</ToggleChip>
                <ToggleChip active={isPaid} onClick={() => setIsPaid(true)}>PAID</ToggleChip>
              </div>
            </div>

            {/* Online link */}
            {eventType === 'ONLINE' && (
              <div style={{ border: '1.5px solid var(--ink)', padding: 12, display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(35,28,21,0.03)' }}>
                <div>
                  <FieldLabel>MEETING LINK</FieldLabel>
                  <div style={{ position: 'relative' }}>
                    <Link2 size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }} />
                    <input
                      type="url" style={{ ...INPUT, paddingLeft: 28 }}
                      placeholder="https://meet.google.com/..."
                      value={onlineLink} onChange={e => setOnlineLink(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>SHARE LINK</FieldLabel>
                  <div style={{ display: 'flex', gap: 0, border: '1.5px solid var(--ink)' }}>
                    <ToggleChip active={linkShareMode === 'IMMEDIATE'} onClick={() => setLinkShareMode('IMMEDIATE')}>IMMEDIATELY</ToggleChip>
                    <ToggleChip active={linkShareMode === 'BEFORE_EVENT'} onClick={() => setLinkShareMode('BEFORE_EVENT')}>1 HR BEFORE</ToggleChip>
                  </div>
                </div>
                <p style={{ fontSize: 9, color: 'var(--ink-soft)', letterSpacing: '0.1em' }}>
                  ATTENDEES GET A REMINDER 1 DAY AND 1 HOUR BEFORE.
                </p>
              </div>
            )}

            {/* Physical reminders note */}
            {eventType === 'PHYSICAL' && (
              <p style={{ fontSize: 9, color: 'var(--ink-soft)', letterSpacing: '0.1em', border: '1.5px dashed var(--ink-faint)', padding: '8px 10px' }}>
                ATTENDEES WILL RECEIVE REMINDERS 6 HOURS AND 1 HOUR BEFORE.
              </p>
            )}
          </div>
        </PaperCard>

        {/* Map picker — physical only */}
        {eventType === 'PHYSICAL' && (
          <>
            <Sep label="② pin it on the map" />
            <PaperCard style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--ink-soft)' }}>CLICK THE MAP TO PLACE THE EVENT</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    {latitude !== null && (
                      <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: 'var(--sage)' }}>
                        ◉ {latitude.toFixed(4)}, {longitude?.toFixed(4)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button" onClick={useMyLocation}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', border: '1.5px solid var(--ink)', background: 'var(--paper-card)', cursor: 'pointer', fontSize: 9, fontFamily: 'var(--font-mono), monospace', textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--ink)' }}
                >
                  <LocateFixed size={12} /> USE MINE
                </button>
              </div>
              <div style={{ height: 300, borderTop: '1.5px solid var(--ink)', position: 'relative' }}>
                {mapCenter ? (
                  <MapView
                    events={previewEvent}
                    center={mapCenter}
                    radius={2200}
                    previewedEventId={previewEvent[0]?.id}
                    onSelectLocation={coords => { setLatitude(coords[0]); setLongitude(coords[1]); }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, background: 'var(--paper-2)' }}>
                    <MapPin size={28} color="var(--ink-faint)" />
                    <p style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                      ENABLE LOCATION OR ENTER BELOW
                    </p>
                  </div>
                )}
              </div>
              <div style={{ padding: '10px 14px', borderTop: '1.5px solid var(--ink)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <FieldLabel>LATITUDE</FieldLabel>
                  <input type="number" step="0.0001" style={INPUT} placeholder="12.9716" value={latitude ?? ''} onChange={e => setLatitude(e.target.value === '' ? null : Number(e.target.value))} />
                </div>
                <div>
                  <FieldLabel>LONGITUDE</FieldLabel>
                  <input type="number" step="0.0001" style={INPUT} placeholder="77.5946" value={longitude ?? ''} onChange={e => setLongitude(e.target.value === '' ? null : Number(e.target.value))} />
                </div>
              </div>
            </PaperCard>
          </>
        )}

        {/* — STEP 3: LOOK — */}
        <Sep label="③ give it a look" />
        <PaperCard>
          {/* Live preview banner */}
          {bannerUrl && (
            <div style={{ height: 160, border: '1.5px solid var(--ink)', marginBottom: 14, overflow: 'hidden', position: 'relative' }}>
              <ResilientImage
                src={bannerUrl} alt={previewTitle}
                className="h-full w-full object-cover"
                fallback={<div style={{ height: '100%', background: 'var(--paper-2)' }} />}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(35,28,21,0.7) 0%, transparent 50%)' }} />
              <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12 }}>
                <div style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 600, fontSize: 20, color: 'var(--cream)', lineHeight: 1.1 }}>{previewTitle}</div>
                <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, color: 'rgba(255,246,228,0.7)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.16em' }}>
                  {formatEventDay(previewStart)} · {formatEventRange(previewStart, previewEnd)}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <FieldLabel>BANNER IMAGE</FieldLabel>
              <UploadZone
                id="banner-upload" label="UPLOAD BANNER"
                hint="wide image for the event card and detail page"
                ready={Boolean(bannerUrl)} loading={uploadingBanner}
                onFileSelect={handleBannerUpload}
              />
            </div>
            <div>
              <FieldLabel>BADGE ICON</FieldLabel>
              <UploadZone
                id="badge-upload" label="UPLOAD BADGE ICON"
                hint="tight visual for map markers and compact surfaces"
                ready={Boolean(badgeIcon)} loading={uploadingBadge}
                onFileSelect={handleBadgeUpload}
              />
            </div>
            {isPaid && (
              <div>
                <FieldLabel>PAYMENT QR CODE</FieldLabel>
                <UploadZone
                  id="payment-qr-upload" label="UPLOAD PAYMENT QR"
                  hint="GPay, PhonePe, or bank QR — shown to attendees"
                  ready={Boolean(paymentQrUrl)} loading={uploadingPaymentQr}
                  onFileSelect={handlePaymentQrUpload}
                />
              </div>
            )}
          </div>
        </PaperCard>

        {/* — STEP 4: PUBLISH — */}
        <Sep label="④ preview & publish" />

        {/* Preview flyer card */}
        <div className="flyer-card tilt-l" style={{ padding: 14, marginBottom: 16, position: 'relative' }}>
          <span className="tape" style={{ top: -10, left: '30%', width: 64, transform: 'rotate(-2deg)' }} />
          <span className="stamp stamp-terra" style={{ position: 'absolute', top: 12, right: 12 }}>
            {visibility === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE'}
          </span>
          <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--ink-soft)', marginBottom: 6 }}>
            {selectedTheme.label.toUpperCase()} · ILLAKA
          </div>
          <div style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 600, fontSize: 24, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
            {previewTitle}
          </div>
          <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, color: 'var(--ink-soft)', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.16em' }}>
            {formatEventDay(previewStart)} · {formatEventRange(previewStart, previewEnd)}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono), monospace', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-soft)' }}>
              CAP {capacity}
            </span>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono), monospace', textTransform: 'uppercase', letterSpacing: '0.14em', color: isPaid ? 'var(--mustard)' : 'var(--sage)' }}>
              {isPaid ? 'PAID' : 'FREE'}
            </span>
            {eventType === 'ONLINE' && (
              <span style={{ fontSize: 9, fontFamily: 'var(--font-mono), monospace', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--sky)' }}>
                ONLINE
              </span>
            )}
          </div>
        </div>

        {/* Checklist */}
        <PaperCard style={{ marginBottom: 16 }}>
          {[
            { label: 'Title & story', done: Boolean(title && description) },
            { label: 'Vibe selected', done: Boolean(categoryKey) },
            { label: 'Date & time set', done: Boolean(startDate && startTimeVal) },
            { label: 'Location pinned', done: eventType === 'ONLINE' || (latitude !== null && longitude !== null) },
            { label: 'Banner uploaded', done: Boolean(bannerUrl) },
            { label: 'Badge uploaded', done: Boolean(badgeIcon) },
            ...(isPaid ? [{ label: 'Payment QR uploaded', done: Boolean(paymentQrUrl) }] : []),
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderBottom: '1px dashed rgba(35,28,21,0.12)' }}>
              <span style={{ width: 18, height: 18, border: `1.5px solid ${item.done ? 'var(--sage)' : 'var(--ink-faint)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: item.done ? 'var(--sage)' : 'var(--ink-faint)', flexShrink: 0 }}>
                {item.done ? '✓' : '·'}
              </span>
              <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: item.done ? 'var(--ink)' : 'var(--ink-faint)' }}>
                {item.label}
              </span>
            </div>
          ))}
        </PaperCard>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(200,85,54,0.1)', border: '1.5px solid var(--terra)', color: 'var(--terra)', fontFamily: 'var(--font-mono), monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || uploadingBanner || uploadingBadge}
          style={{
            width: '100%', padding: '15px 20px',
            background: (loading || uploadingBanner || uploadingBadge) ? 'var(--ink-faint)' : 'var(--terra)',
            border: '1.5px solid var(--terra-deep)',
            boxShadow: (loading || uploadingBanner || uploadingBadge) ? 'none' : '3px 3px 0 var(--terra-deep)',
            color: 'var(--cream)',
            fontFamily: 'var(--font-mono), monospace', fontSize: 12,
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em',
            cursor: (loading || uploadingBanner || uploadingBadge) ? 'default' : 'pointer',
            transition: 'all 150ms ease',
          }}
        >
          {loading ? 'PINNING TO THE WALL…' : 'PUBLISH EVENT → PIN IT UP'}
        </button>
      </form>
    </div>
  );
}
