'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { ArrowUpRight, CalendarClock, Compass, Download, Lock, MapPin, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { PaymentButton } from '@/components/PaymentButton';
import { ResilientImage } from '@/components/ResilientImage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatEventClock, formatEventDay, formatEventRange, getEventTheme } from '@/lib/event-style';

type EventDetail = {
  id: string;
  title: string;
  description: string;
  bannerUrl: string;
  badgeIcon: string;
  startTime: string | Date;
  endTime: string | Date;
  visibility: 'PUBLIC' | 'PRIVATE';
  capacity: number;
  organizerId: string;
  latitude: number;
  longitude: number;
  isPaid?: boolean;
  paymentQrUrl?: string | null;
  organizer?: {
    name?: string | null;
  } | null;
  rsvps?: Array<{ id: string }>;
};

export function EventDetailClient({ event }: { event: EventDetail }) {
  const { data } = useSession();
  const [rsvpCount, setRsvpCount] = useState(event.rsvps?.length ?? 0);
  const [loading, setLoading] = useState(false);
  const [rsvpError, setRsvpError] = useState('');
  const [joined, setJoined] = useState(false);
  const [rsvpId, setRsvpId] = useState<string | null>(null);
  const [ticketQrDataUrl, setTicketQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!rsvpId) return;
    QRCode.toDataURL(JSON.stringify({ rsvpId, eventId: event.id }), {
      width: 160, margin: 1, color: { dark: '#0f766e', light: '#ffffff' }
    }).then(setTicketQrDataUrl).catch(() => {});
  }, [rsvpId, event.id]);
  const hostingThreshold = Number(process.env.NEXT_PUBLIC_HOSTING_FEE_THRESHOLD ?? 50);
  const hostingFee = Number(process.env.NEXT_PUBLIC_HOSTING_FEE_AMOUNT ?? 25000);
  const promotionPrice = Number(process.env.NEXT_PUBLIC_PROMOTION_PRICE ?? 15000);

  const theme = useMemo(() => getEventTheme(event), [event]);
  const isOrganizer = data?.user?.id === event.organizerId;
  const capacity = Math.max(event.capacity ?? 0, 1);
  const seatsLeft = Math.max(capacity - rsvpCount, 0);
  const fillPercent = Math.min(100, Math.round((rsvpCount / capacity) * 100));
  const organizerName = event.organizer?.name || 'Local organizer';
  const organizerInitials = organizerName
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  async function rsvp() {
    if (loading || joined) return;

    setLoading(true);
    setRsvpError('');
    setJoined(true);
    setRsvpCount((current: number) => current + 1);

    try {
      const res = await fetch(`/api/events/${event.id}/rsvp`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.rsvpId) setRsvpId(data.rsvpId);
        return;
      }

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      setJoined(false);
      setRsvpCount((current: number) => Math.max(current - 1, 0));
      setRsvpError(data?.error ?? 'Could not RSVP. Please try again.');
    } catch {
      setJoined(false);
      setRsvpCount((current: number) => Math.max(current - 1, 0));
      setRsvpError('Could not RSVP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="section-shell overflow-hidden p-0">
        <div className="relative min-h-[420px] overflow-hidden rounded-[2rem]">
          {event.bannerUrl ? (
            <ResilientImage
              src={event.bannerUrl}
              alt={event.title}
              className="absolute inset-0 h-full w-full object-cover"
              fallback={
                <div
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(135deg, ${theme.accentStrong} 0%, ${theme.accent} 100%)` }}
                />
              }
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(135deg, ${theme.accentStrong} 0%, ${theme.accent} 100%)` }}
            />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,24,39,0.06)_0%,rgba(17,24,39,0.3)_38%,rgba(17,24,39,0.8)_100%)]" />
          <div className="relative flex min-h-[420px] flex-col justify-between p-6 text-white sm:p-8 lg:p-10">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/82">
                {theme.label}
              </span>
              <span className="rounded-full bg-white/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/82">
                {event.visibility === 'PRIVATE' ? 'Private' : 'Public'}
              </span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
              <div className="max-w-3xl space-y-5">
                <p className="eyebrow border border-white/12 bg-white/12 text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                  Neighborhood story
                </p>
                <div className="space-y-4">
                  <h1 className="font-[family:var(--font-fraunces)] text-4xl leading-[0.95] sm:text-5xl lg:text-[4.2rem]">
                    {event.title}
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
                    {event.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="info-pill border-white/12 bg-white/12 text-white">
                    <CalendarClock className="h-4 w-4 text-white/82" />
                    {formatEventDay(event.startTime)} / {formatEventRange(event.startTime, event.endTime)}
                  </span>
                  <span className="info-pill border-white/12 bg-white/12 text-white">
                    <Users className="h-4 w-4 text-white/82" />
                    {rsvpCount} joined / cap {capacity}
                  </span>
                  <span className="info-pill border-white/12 bg-white/12 text-white">
                    <MapPin className="h-4 w-4 text-white/82" />
                    Map-led local meetup
                  </span>
                </div>
              </div>

              <Card className="surface-card-strong rounded-[1.8rem] border-white/14 bg-[rgba(10,16,22,0.38)] p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.28)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/64">Hosted by</p>
                <div className="mt-4 flex items-center gap-4">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full text-sm font-semibold"
                    style={{ background: theme.accentSoft, color: '#fff' }}
                  >
                    {organizerInitials || 'IL'}
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{organizerName}</p>
                    <p className="text-sm text-white/68">Putting something good on the map.</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_360px]">
        <div className="space-y-6">
          <Card className="section-shell space-y-5 p-6">
            <div className="space-y-3">
              <p className="eyebrow">
                <Compass className="h-3.5 w-3.5" />
                What it feels like
              </p>
              <h2 className="font-[family:var(--font-fraunces)] text-3xl leading-none">An event with a clear local rhythm.</h2>
              <p className="text-sm leading-7 text-muted sm:text-base">{theme.previewLine}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {theme.storyBeats.map((beat) => (
                <article
                  key={beat}
                  className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(255,255,255,0.4)] p-4 transition-all duration-200 hover:-translate-y-1 hover:bg-[var(--surface-strong)] dark:bg-[rgba(15,23,42,0.24)]"
                >
                  <p className="text-sm leading-6 text-muted">{beat}</p>
                </article>
              ))}
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_0.8fr]">
            <Card className="surface-card-strong space-y-5">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: theme.accentStrong }}>
                  Event story
                </p>
                <h2 className="text-2xl font-semibold">Why people show up</h2>
              </div>
              <p className="text-sm leading-7 text-muted sm:text-base">{event.description}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-[var(--line)] bg-[rgba(255,255,255,0.34)] p-4 dark:bg-[rgba(15,23,42,0.22)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Starts</p>
                  <p className="mt-2 text-lg font-semibold">{formatEventClock(event.startTime)}</p>
                  <p className="mt-1 text-sm text-muted">{formatEventDay(event.startTime)}</p>
                </div>
                <div className="rounded-[1.5rem] border border-[var(--line)] bg-[rgba(255,255,255,0.34)] p-4 dark:bg-[rgba(15,23,42,0.22)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Ends</p>
                  <p className="mt-2 text-lg font-semibold">{formatEventClock(event.endTime)}</p>
                  <p className="mt-1 text-sm text-muted">{formatEventDay(event.endTime)}</p>
                </div>
              </div>
            </Card>

            <Card className="surface-card-strong space-y-5">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: theme.accentStrong }}>
                  Organizer note
                </p>
                <h2 className="text-2xl font-semibold">Hosted by someone nearby.</h2>
              </div>
              <div className="flex items-center gap-4 rounded-[1.6rem] border border-[var(--line)] bg-[rgba(255,255,255,0.34)] p-4 dark:bg-[rgba(15,23,42,0.22)]">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ background: `linear-gradient(135deg, ${theme.accentStrong} 0%, ${theme.accent} 100%)` }}
                >
                  {organizerInitials || 'IL'}
                </div>
                <div>
                  <p className="text-lg font-semibold">{organizerName}</p>
                  <p className="text-sm text-muted">Building the kind of gathering you can walk into comfortably.</p>
                </div>
              </div>
              <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(255,255,255,0.34)] p-4 text-sm leading-6 text-muted dark:bg-[rgba(15,23,42,0.22)]">
                Registration flow, payments, and visibility settings stay intact. This page simply gives them a calmer and more persuasive frame.
              </div>
            </Card>
          </div>

          <Card className="section-shell space-y-5 p-6">
            <div className="space-y-2">
              <p className="eyebrow">
                <Sparkles className="h-3.5 w-3.5" />
                Media and cues
              </p>
              <h2 className="font-[family:var(--font-fraunces)] text-3xl leading-none">Small visuals that make the event easier to place.</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_0.7fr]">
              <div className="overflow-hidden rounded-[1.8rem] border border-[var(--line)]">
                {event.bannerUrl ? (
                  <ResilientImage
                    src={event.bannerUrl}
                    alt={event.title}
                    className="h-full min-h-[240px] w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                    fallback={
                      <div
                        className="flex min-h-[240px] items-center justify-center text-5xl font-semibold text-white"
                        style={{ background: `linear-gradient(135deg, ${theme.accentStrong} 0%, ${theme.accent} 100%)` }}
                      >
                        {event.title.charAt(0)}
                      </div>
                    }
                  />
                ) : (
                  <div
                    className="flex min-h-[240px] items-center justify-center text-5xl font-semibold text-white"
                    style={{ background: `linear-gradient(135deg, ${theme.accentStrong} 0%, ${theme.accent} 100%)` }}
                  >
                    {event.title.charAt(0)}
                  </div>
                )}
              </div>
              <div className="grid gap-4">
                <div className="flex min-h-[116px] items-center justify-between rounded-[1.8rem] border border-[var(--line)] bg-[rgba(255,255,255,0.36)] p-4 dark:bg-[rgba(15,23,42,0.24)]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Identity</p>
                    <p className="mt-2 text-lg font-semibold">{theme.label}</p>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1.35rem] border border-white/30 bg-white/70">
                    {event.badgeIcon ? (
                      <ResilientImage
                        src={event.badgeIcon}
                        alt=""
                        className="h-full w-full object-cover"
                        fallback={
                          <span className="text-sm font-semibold" style={{ color: theme.accentStrong }}>
                            {theme.shortLabel}
                          </span>
                        }
                      />
                    ) : (
                      <span className="text-sm font-semibold" style={{ color: theme.accentStrong }}>
                        {theme.shortLabel}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className="min-h-[116px] rounded-[1.8rem] border p-4 text-white"
                  style={{ borderColor: theme.accentSoft, background: `linear-gradient(135deg, ${theme.accentStrong} 0%, ${theme.accent} 100%)` }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/72">Neighborhood pull</p>
                  <p className="mt-3 text-sm leading-6 text-white/82">
                    {rsvpCount > 0
                      ? `${rsvpCount} people already plan to show up, which gives this one some social gravity.`
                      : 'Still quiet enough to be an easy first RSVP.'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Card className="surface-card-strong space-y-5">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: theme.accentStrong }}>
                RSVP panel
              </p>
              <h2 className="text-2xl font-semibold">Step in with one tap.</h2>
            </div>

            <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(255,255,255,0.4)] p-4 dark:bg-[rgba(15,23,42,0.22)]">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-muted">Capacity filled</span>
                <span className="font-semibold" style={{ color: theme.accentStrong }}>
                  {fillPercent}%
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(15,23,42,0.08)] dark:bg-[rgba(255,255,255,0.08)]">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${fillPercent}%`, background: `linear-gradient(90deg, ${theme.accent} 0%, ${theme.accentStrong} 100%)` }}
                />
              </div>
              <p className="mt-3 text-sm text-muted">
                {seatsLeft > 0 ? `${seatsLeft} spots still open.` : 'Capacity is currently full, but you can still try the RSVP flow.'}
              </p>
            </div>

            <div className="space-y-3">
              <Button onClick={rsvp} disabled={loading || joined} size="lg" className="w-full">
                {loading ? 'Reserving...' : joined ? 'Joined ✓' : 'RSVP now'}
              </Button>
              {rsvpError ? <p className="text-sm text-red-500">{rsvpError}</p> : null}

              {joined && rsvpId ? (
                <>
                  {/* Ticket QR */}
                  {ticketQrDataUrl && (
                    <div className="rounded-[1.4rem] border border-[var(--line)] bg-[rgba(255,255,255,0.5)] p-4 text-center dark:bg-[rgba(15,23,42,0.22)]">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-2">Your entry QR code</p>
                      <img src={ticketQrDataUrl} alt="Ticket QR" width={128} height={128} className="mx-auto rounded-xl" />
                      <p className="mt-2 text-xs text-muted">Show this at the event entrance</p>
                    </div>
                  )}

                  {/* Payment QR (for paid events) */}
                  {event.isPaid && event.paymentQrUrl && (
                    <div className="rounded-[1.4rem] border-2 border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-4 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-2">
                        Payment required — scan to pay
                      </p>
                      <img src={event.paymentQrUrl} alt="Payment QR" width={140} height={140} className="mx-auto rounded-xl" />
                      <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">Scan the organizer's QR to complete payment</p>
                    </div>
                  )}

                  <Button asChild variant="outline" size="lg" className="w-full border-[var(--secondary)] text-[var(--secondary)]">
                    <Link href={`/tickets/${rsvpId}`}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Full Ticket (PDF)
                    </Link>
                  </Button>
                </>
              ) : null}

              <Button asChild variant="outline" size="lg" className="w-full">
                <Link href="/">
                  Keep exploring
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>

          <Card className="surface-card-strong space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full p-2" style={{ background: theme.accentSoft, color: theme.accentStrong }}>
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">At-a-glance details</p>
                <p className="mt-1 text-sm leading-6 text-muted">Key information stays close to the action so the page remains easy to scan.</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-[1.4rem] border border-[var(--line)] bg-[rgba(255,255,255,0.34)] px-4 py-3 text-sm dark:bg-[rgba(15,23,42,0.22)]">
                <span className="text-muted">When</span>
                <span className="font-medium">{formatEventRange(event.startTime, event.endTime)}</span>
              </div>
              <div className="flex items-center justify-between rounded-[1.4rem] border border-[var(--line)] bg-[rgba(255,255,255,0.34)] px-4 py-3 text-sm dark:bg-[rgba(15,23,42,0.22)]">
                <span className="text-muted">Visibility</span>
                <span className="inline-flex items-center gap-2 font-medium">
                  <Lock className="h-3.5 w-3.5" />
                  {event.visibility}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-[1.4rem] border border-[var(--line)] bg-[rgba(255,255,255,0.34)] px-4 py-3 text-sm dark:bg-[rgba(15,23,42,0.22)]">
                <span className="text-muted">Coordinate</span>
                <span className="font-medium">
                  {event.latitude.toFixed(3)}, {event.longitude.toFixed(3)}
                </span>
              </div>
            </div>
          </Card>

          {isOrganizer ? (
            <Card className="surface-card-strong space-y-4">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: theme.accentStrong }}>
                  Organizer actions
                </p>
                <h2 className="text-2xl font-semibold">Keep the event moving.</h2>
                <p className="text-sm leading-6 text-muted">
                  Payment actions remain the same, but they now sit in a clearer support panel for hosts.
                </p>
              </div>

              {rsvpCount >= hostingThreshold ? (
                <PaymentButton label="Pay hosting fee" reason="hosting_fee" amount={hostingFee} eventId={event.id} />
              ) : (
                <div className="rounded-[1.5rem] border border-[var(--line)] bg-[rgba(255,255,255,0.34)] p-4 text-sm leading-6 text-muted dark:bg-[rgba(15,23,42,0.22)]">
                  Hosting fee unlocks once the event reaches {hostingThreshold} RSVPs.
                </div>
              )}

              <PaymentButton label="Boost event promotion" reason="promotion" amount={promotionPrice} eventId={event.id} />
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
