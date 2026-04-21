'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { CalendarClock, ImagePlus, LocateFixed, Lock, MapPin, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useRouteTransition } from '@/components/RouteTransitionProvider';
import { cn } from '@/lib/utils';
import { EVENT_CATEGORY_OPTIONS, type EventCategoryKey, formatEventDay, formatEventRange } from '@/lib/event-style';

const MapView = dynamic(
  () => import('@/components/MapView').then((module) => module.MapView),
  { ssr: false }
);

const DEFAULT_PREVIEW_START = '2026-03-16T11:30:00.000Z';
const DEFAULT_PREVIEW_END = '2026-03-16T13:00:00.000Z';

function UploadDropzone({
  id,
  title,
  description,
  ready,
  loading,
  onFileSelect
}: {
  id: string;
  title: string;
  description: string;
  ready: boolean;
  loading: boolean;
  onFileSelect: (file: File) => Promise<void>;
}) {
  const [dragging, setDragging] = useState(false);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    await onFileSelect(file);
  }

  return (
    <div className={cn('studio-dropzone', (ready || dragging) && 'is-ready')}>
      <input
        id={id}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => void handleFiles(event.target.files)}
      />
      <label
        htmlFor={id}
        className="block cursor-pointer"
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFiles(event.dataTransfer.files);
        }}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,255,255,0.68)] text-[var(--accent)] shadow-[0_10px_28px_rgba(17,24,39,0.1)]">
          <ImagePlus className="h-5 w-5" />
        </div>
        <p className="mt-4 text-sm font-semibold">{loading ? 'Uploading...' : title}</p>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: ready ? 'var(--accent-strong)' : 'var(--muted)' }}>
          {ready ? 'Ready to publish' : 'Drag or click'}
        </p>
      </label>
    </div>
  );
}

export default function CreateEventPage() {
  const { navigate } = useRouteTransition();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [capacity, setCapacity] = useState(20);
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [isPaid, setIsPaid] = useState(false);
  const [ticketPrice, setTicketPrice] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [bannerUrl, setBannerUrl] = useState('');
  const [badgeIcon, setBadgeIcon] = useState('');
  const [categoryKey, setCategoryKey] = useState<EventCategoryKey>('community');
  const [paymentQrUrl, setPaymentQrUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingBadge, setUploadingBadge] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);

  const selectedTheme = EVENT_CATEGORY_OPTIONS.find((option) => option.key === categoryKey) ?? EVENT_CATEGORY_OPTIONS[0];
  const mapCenter = latitude !== null && longitude !== null ? [latitude, longitude] as [number, number] : [28.6139, 77.209] as [number, number];
  const previewTitle = title || `New ${selectedTheme.label.toLowerCase()} gathering`;
  const previewDescription = description || selectedTheme.previewLine;
  const previewStart = startTime || DEFAULT_PREVIEW_START;
  const previewEnd = endTime || DEFAULT_PREVIEW_END;

  // Reuse the live discovery map here so location picking feels native to the product.
  const previewEvent = useMemo(() => {
    if (latitude === null || longitude === null) return [];

    return [
      {
        id: 'draft-preview',
        title: previewTitle,
        description: previewDescription,
        bannerUrl,
        badgeIcon,
        latitude,
        longitude,
        startTime: previewStart,
        endTime: previewEnd,
        visibility,
        capacity,
        organizerId: 'draft',
        isPaid,
        engagementScore: Math.max(12, Math.round(capacity * 0.6))
      }
    ];
  }, [badgeIcon, bannerUrl, capacity, endTime, isPaid, latitude, longitude, previewDescription, previewEnd, previewStart, previewTitle, visibility]);

  async function upload(file: File, folder: string) {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', folder);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok || !data?.url) {
      throw new Error(data?.error ?? 'Upload failed');
    }
    return data.url as string;
  }

  async function handleBannerUpload(file: File) {
    setError('');
    setUploadingBanner(true);
    try {
      const url = await upload(file, 'ilaka/banners');
      setBannerUrl(url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Banner upload failed');
    } finally {
      setUploadingBanner(false);
    }
  }

  async function handleBadgeUpload(file: File) {
    setError('');
    setUploadingBadge(true);
    try {
      const url = await upload(file, 'ilaka/badges');
      setBadgeIcon(url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Badge upload failed');
    } finally {
      setUploadingBadge(false);
    }
  }

  async function handleQrUpload(file: File) {
    setError('');
    setUploadingQr(true);
    try {
      const url = await upload(file, 'illaka/qr-codes');
      setPaymentQrUrl(url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'QR code upload failed');
    } finally {
      setUploadingQr(false);
    }
  }

  async function useMyLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
      },
      (locationError) => {
        setError(`Unable to fetch location: ${locationError.message}`);
      },
      { timeout: 10000 }
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (latitude === null || longitude === null) {
      setError('Please place the event on the map or use your current location.');
      return;
    }

    if (!bannerUrl || !badgeIcon) {
      setError('Please upload both a banner image and a badge icon.');
      return;
    }

    if (isPaid && !paymentQrUrl) {
      setError('Please upload a payment QR code for paid events.');
      return;
    }

    if (isPaid && ticketPrice && (isNaN(Number(ticketPrice)) || Number(ticketPrice) <= 0)) {
      setError('Please enter a valid ticket price.');
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
        title,
        description,
        startTime,
        endTime,
        capacity,
        visibility,
        isPaid,
        ticketPrice: isPaid && ticketPrice ? Math.round(Number(ticketPrice) * 100) : undefined,
        latitude,
        longitude,
        bannerUrl,
        badgeIcon,
        paymentQrUrl: paymentQrUrl || undefined
      })
    });
    setLoading(false);

    if (res.ok) {
      navigate('/');
      return;
    }

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    setError(data?.error ?? 'Failed to create event.');
  }

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-4 pb-24 pt-6 sm:px-6 lg:px-8">
      <section className="section-shell relative overflow-hidden p-6 sm:p-7 lg:p-8">
        <div className="absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.42),transparent_72%)]" />
        <div className="relative max-w-3xl space-y-4">
          <p className="eyebrow">
            <Sparkles className="h-3.5 w-3.5" />
            Host studio
          </p>
          <h1 className="font-[family:var(--font-fraunces)] text-4xl leading-[0.95] sm:text-5xl lg:text-[3.8rem]">
            Shape a neighborhood invite that feels worth showing up for.
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-muted sm:text-base">
            The creation flow keeps the same publishing logic, but now gives you a live banner, a map-led location step, and visual cues for how the event will feel in Illaka.
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_420px]">
        <section className="space-y-6">
          <Card className="surface-card-strong overflow-hidden p-0">
            <div className="relative min-h-[360px] overflow-hidden">
              {bannerUrl ? (
                <img src={bannerUrl} alt={previewTitle} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(135deg, ${selectedTheme.accentStrong} 0%, ${selectedTheme.accent} 100%)` }}
                />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,24,39,0.08)_0%,rgba(17,24,39,0.24)_38%,rgba(17,24,39,0.8)_100%)]" />
              <div className="relative flex min-h-[360px] flex-col justify-between p-6 text-white sm:p-8">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/82">
                    {selectedTheme.label}
                  </span>
                  <span className="rounded-full bg-white/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/82">
                    {visibility === 'PUBLIC' ? 'Public listing' : 'Private invite'}
                  </span>
                </div>

                <div className="space-y-4">
                  <h2 className="max-w-2xl font-[family:var(--font-fraunces)] text-4xl leading-[0.95] sm:text-5xl">
                    {previewTitle}
                  </h2>
                  <p className="max-w-2xl text-sm leading-7 text-white/76 sm:text-base">{previewDescription}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="info-pill border-white/12 bg-white/12 text-white">
                      <CalendarClock className="h-4 w-4 text-white/78" />
                      {formatEventDay(previewStart)} / {formatEventRange(previewStart, previewEnd)}
                    </span>
                    <span className="info-pill border-white/12 bg-white/12 text-white">
                      <Users className="h-4 w-4 text-white/78" />
                      Capacity {capacity}
                    </span>
                    <span className="info-pill border-white/12 bg-white/12 text-white">
                      <MapPin className="h-4 w-4 text-white/78" />
                      {latitude !== null && longitude !== null ? 'Pinned on the map' : 'Choose a location'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="section-shell space-y-5 p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 sm:px-6 sm:pt-6">
              <div>
                <p className="eyebrow">
                  <MapPin className="h-3.5 w-3.5" />
                  Location picker
                </p>
                <h2 className="mt-3 text-2xl font-semibold">Place it exactly where people should orient themselves.</h2>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={useMyLocation}>
                <LocateFixed className="h-4 w-4" />
                Use my location
              </Button>
            </div>

            <div className="relative h-[340px] overflow-hidden border-y border-[var(--line)]">
              <MapView
                events={previewEvent}
                center={mapCenter}
                radius={2200}
                previewedEventId={previewEvent[0]?.id}
                onSelectLocation={(coords) => {
                  setLatitude(coords[0]);
                  setLongitude(coords[1]);
                }}
              />
              <div className="pointer-events-none absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
                <Card className="surface-card-strong max-w-sm rounded-[1.5rem] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--secondary)]">Spatial memory</p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Click the map to place the event. Keeping the map central here helps hosts think about discovery the same way attendees will.
                  </p>
                </Card>
              </div>
            </div>

            <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2 sm:px-6 sm:pb-6">
              <Input
                type="number"
                step="0.0001"
                placeholder="Latitude"
                value={latitude ?? ''}
                onChange={(event) => setLatitude(event.target.value === '' ? null : Number(event.target.value))}
              />
              <Input
                type="number"
                step="0.0001"
                placeholder="Longitude"
                value={longitude ?? ''}
                onChange={(event) => setLongitude(event.target.value === '' ? null : Number(event.target.value))}
              />
            </div>
          </Card>
        </section>

        <aside>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Card className="surface-card-strong space-y-5">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: selectedTheme.accentStrong }}>
                  Event frame
                </p>
                <h2 className="text-2xl font-semibold">Start with tone, then tighten the details.</h2>
              </div>

              <div className="space-y-3">
                <Input placeholder="Give the event a name" value={title} onChange={(event) => setTitle(event.target.value)} />
                <Textarea
                  placeholder="Describe the mood, the activity, and why someone nearby should care."
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-[var(--text)]">Pick the vibe</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {EVENT_CATEGORY_OPTIONS.map((category) => (
                    <button
                      key={category.key}
                      type="button"
                      onClick={() => setCategoryKey(category.key)}
                      className={cn(
                        'rounded-[1.4rem] border p-4 text-left transition-all duration-200 hover:-translate-y-0.5',
                        categoryKey === category.key
                          ? 'border-transparent shadow-[0_18px_40px_rgba(17,24,39,0.12)]'
                          : 'border-[var(--line)] bg-[rgba(255,255,255,0.36)] dark:bg-[rgba(15,23,42,0.22)]'
                      )}
                      style={categoryKey === category.key ? { background: category.accentSoft } : undefined}
                    >
                      <p className="text-sm font-semibold" style={{ color: category.accentStrong }}>
                        {category.label}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted">{category.hint}</p>
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="surface-card-strong space-y-5">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: selectedTheme.accentStrong }}>
                  Schedule and access
                </p>
                <h2 className="text-2xl font-semibold">Make the basics easy to trust at a glance.</h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input type="datetime-local" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
                <Input type="datetime-local" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-muted">Capacity</span>
                  <span className="font-semibold" style={{ color: selectedTheme.accentStrong }}>
                    {capacity}
                  </span>
                </div>
                <Slider value={[capacity]} min={5} max={150} step={1} onValueChange={(value) => setCapacity(value[0] ?? capacity)} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setVisibility('PUBLIC')}
                  className={cn(
                    'rounded-[1.4rem] border p-4 text-left transition-all duration-200 hover:-translate-y-0.5',
                    visibility === 'PUBLIC'
                      ? 'border-transparent shadow-[0_18px_40px_rgba(17,24,39,0.12)]'
                      : 'border-[var(--line)] bg-[rgba(255,255,255,0.36)] dark:bg-[rgba(15,23,42,0.22)]'
                  )}
                  style={visibility === 'PUBLIC' ? { background: selectedTheme.accentSoft } : undefined}
                >
                  <p className="text-sm font-semibold" style={{ color: selectedTheme.accentStrong }}>
                    Public
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted">Discoverable in the neighborhood map and search.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('PRIVATE')}
                  className={cn(
                    'rounded-[1.4rem] border p-4 text-left transition-all duration-200 hover:-translate-y-0.5',
                    visibility === 'PRIVATE'
                      ? 'border-transparent shadow-[0_18px_40px_rgba(17,24,39,0.12)]'
                      : 'border-[var(--line)] bg-[rgba(255,255,255,0.36)] dark:bg-[rgba(15,23,42,0.22)]'
                  )}
                  style={visibility === 'PRIVATE' ? { background: selectedTheme.accentSoft } : undefined}
                >
                  <p className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: selectedTheme.accentStrong }}>
                    <Lock className="h-4 w-4" />
                    Private
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted">Visible only to the people you intentionally share it with.</p>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsPaid((current) => !current)}
                className={cn(
                  'w-full rounded-[1.4rem] border p-4 text-left transition-all duration-200 hover:-translate-y-0.5',
                  isPaid
                    ? 'border-transparent shadow-[0_18px_40px_rgba(17,24,39,0.12)]'
                    : 'border-[var(--line)] bg-[rgba(255,255,255,0.36)] dark:bg-[rgba(15,23,42,0.22)]'
                )}
                style={isPaid ? { background: selectedTheme.accentSoft } : undefined}
              >
                <p className="text-sm font-semibold" style={{ color: selectedTheme.accentStrong }}>
                  {isPaid ? 'Paid event' : 'Free event'}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Toggle pricing behavior without changing the rest of the creation flow.
                </p>
              </button>

              {isPaid && (
                <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                    Ticket price (₹)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 200"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                    className="bg-white dark:bg-amber-950/20"
                  />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Enter the amount attendees need to pay (in rupees). A payment QR code upload is required below.
                  </p>
                </div>
              )}
            </Card>

            <Card className="surface-card-strong space-y-5">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: selectedTheme.accentStrong }}>
                  Media kit
                </p>
                <h2 className="text-2xl font-semibold">Give the event a face people will remember.</h2>
              </div>

              <div className="grid gap-4">
                <UploadDropzone
                  id="banner-upload"
                  title="Upload hero banner"
                  description="A wide image for the event card, detail page, and the live preview above."
                  ready={Boolean(bannerUrl)}
                  loading={uploadingBanner}
                  onFileSelect={handleBannerUpload}
                />
                <UploadDropzone
                  id="badge-upload"
                  title="Upload badge icon"
                  description="A tighter visual for markers, quick recognition, and compact surfaces."
                  ready={Boolean(badgeIcon)}
                  loading={uploadingBadge}
                  onFileSelect={handleBadgeUpload}
                />
                {isPaid && (
                  <UploadDropzone
                    id="qr-upload"
                    title="Upload payment QR code"
                    description="Your UPI or bank QR code so attendees can pay at the door. Stored securely."
                    ready={Boolean(paymentQrUrl)}
                    loading={uploadingQr}
                    onFileSelect={handleQrUpload}
                  />
                )}
              </div>
            </Card>

            <Card className="surface-card-strong space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full p-2" style={{ background: selectedTheme.accentSoft, color: selectedTheme.accentStrong }}>
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Before you publish</p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Good event creation is mostly clarity: what it is, when it happens, and where people should show up.
                  </p>
                </div>
              </div>

              {error ? <p className="rounded-[1.2rem] bg-[rgba(220,38,38,0.08)] px-4 py-3 text-sm text-red-600">{error}</p> : null}

              <Button type="submit" size="lg" disabled={loading || uploadingBanner || uploadingBadge || uploadingQr} className="w-full">
                {loading ? 'Creating event...' : 'Publish event'}
              </Button>
            </Card>
          </form>
        </aside>
      </div>
    </div>
  );
}
