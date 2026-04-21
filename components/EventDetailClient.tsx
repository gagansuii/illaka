'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowUpRight, CalendarClock, Compass, Copy, Globe, Link2, Lock, MapPin, Share2, ShieldCheck, Sparkles, Users } from 'lucide-react';
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
  shareToken?: string | null;
  eventType?: 'PHYSICAL' | 'ONLINE' | null;
  onlineLink?: string | null;
  linkShareMode?: 'IMMEDIATE' | 'BEFORE_EVENT' | null;
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

  const [copied, setCopied] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
      // Record the share for engagement score
      fetch(`/api/events/${event.id}/share`, { method: 'POST' }).catch(() => null);
    } catch {
      // User cancelled share sheet — ignore
    }
  }

  async function handleCopyInvite() {
    setInviteLoading(true);
    try {
      let token = event.shareToken;
      if (!token) {
        const res = await fetch(`/api/events/${event.id}/invite`, { method: 'POST' });
        const json = await res.json() as { token?: string };
        token = json.token ?? null;
      }
      if (token) {
        const inviteUrl = `${window.location.origin}/events/${event.id}?token=${token}`;
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // ignore
    } finally {
      setInviteLoading(false);
    }
  }

  async function rsvp() {
    if (loading || joined) return;

    setLoading(true);
    setRsvpError('');
    setJoined(true);
    setRsvpCount((current: number) => current + 1);

    try {
      const res = await fetch(`/api/events/${event.id}/rsvp`, { method: 'POST' });
      if (res.ok) {
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
          {/* Only darken the bottom 40% so the photo is visible at the top */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_40%,rgba(17,24,39,0.7)_70%,rgba(17,24,39,0.92)_100%)]" />
          <div className="relative flex min-h-[420px] flex-col justify-between p-6 text-white sm:p-8 lg:p-10">
            {/* Badges sit top-left — minimal footprint on the photo */}
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white backdrop-blur-sm">
                {theme.label}
              </span>
              <span className="rounded-full bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white backdrop-blur-sm">
                {event.visibility === 'PRIVATE' ? 'Private' : 'Public'}
              </span>
            </div>

            {/* Title + pills anchored to the bottom — no description on top of photo */}
            <div className="space-y-3">
              <h1 className="font-[family:var(--font-fraunces)] text-4xl leading-[0.95] sm:text-5xl lg:text-[4.2rem]">
                {event.title}
              </h1>
              <div className="flex flex-wrap gap-2">
                <span className="info-pill border-white/25 bg-white/20 text-white">
                  <CalendarClock className="h-4 w-4 text-white" />
                  {formatEventDay(event.startTime)} / {formatEventRange(event.startTime, event.endTime)}
                </span>
                <span className="info-pill border-white/25 bg-white/20 text-white">
                  <Users className="h-4 w-4 text-white" />
                  {rsvpCount} joined / cap {capacity}
                </span>
                {(event.eventType ?? 'PHYSICAL') === 'ONLINE' ? (
                  <span className="info-pill border-white/25 bg-white/20 text-white">
                    <Globe className="h-4 w-4 text-white" />
                    Online event
                  </span>
                ) : (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="info-pill border-white/25 bg-white/20 text-white hover:opacity-85"
                  >
                    <MapPin className="h-4 w-4 text-white" />
                    View on map
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleShare}
                  className="info-pill border-white/25 bg-white/20 text-white transition-opacity hover:opacity-80"
                >
                  <Share2 className="h-4 w-4 text-white" />
                  {copied ? 'Link copied!' : 'Share'}
                </button>
              </div>
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
                RSVP flow, payments, and visibility settings stay intact. This page simply gives them a calmer and more persuasive frame.
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
                {loading ? 'Reserving...' : joined ? 'Joined' : 'RSVP now'}
              </Button>
              {rsvpError ? <p className="text-sm text-red-500">{rsvpError}</p> : null}
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
              {(event.eventType ?? 'PHYSICAL') === 'ONLINE' ? (
                event.onlineLink && event.linkShareMode === 'IMMEDIATE' ? (
                  <a
                    href={event.onlineLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-[1.4rem] border border-[var(--line)] bg-[rgba(255,255,255,0.34)] px-4 py-3 text-sm transition-colors hover:bg-[var(--surface-strong)] dark:bg-[rgba(15,23,42,0.22)]"
                  >
                    <span className="text-muted">Join link</span>
                    <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: theme.accentStrong }}>
                      <Globe className="h-3.5 w-3.5" />
                      Open link
                    </span>
                  </a>
                ) : (
                  <div className="flex items-center justify-between rounded-[1.4rem] border border-[var(--line)] bg-[rgba(255,255,255,0.34)] px-4 py-3 text-sm dark:bg-[rgba(15,23,42,0.22)]">
                    <span className="text-muted">Join link</span>
                    <span className="font-medium text-muted">Shared 6 hrs before</span>
                  </div>
                )
              ) : (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-[1.4rem] border border-[var(--line)] bg-[rgba(255,255,255,0.34)] px-4 py-3 text-sm transition-colors hover:bg-[var(--surface-strong)] dark:bg-[rgba(15,23,42,0.22)]"
                >
                  <span className="text-muted">Location</span>
                  <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: theme.accentStrong }}>
                    <MapPin className="h-3.5 w-3.5" />
                    Open in Maps
                  </span>
                </a>
              )}
            </div>
          </Card>

          {isOrganizer ? (
            <Card className="surface-card-strong space-y-4">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: theme.accentStrong }}>
                  Organizer actions
                </p>
                <h2 className="text-2xl font-semibold">Keep the event moving.</h2>
              </div>

              {event.visibility === 'PRIVATE' && (
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  disabled={inviteLoading}
                  className="flex w-full items-center gap-3 rounded-[1.5rem] border border-[var(--line)] bg-[rgba(255,255,255,0.34)] px-4 py-3 text-sm font-medium transition-all hover:bg-[var(--surface-strong)] dark:bg-[rgba(15,23,42,0.22)]"
                >
                  {copied ? <Copy className="h-4 w-4 shrink-0" style={{ color: theme.accentStrong }} /> : <Link2 className="h-4 w-4 shrink-0" style={{ color: theme.accentStrong }} />}
                  <span>{inviteLoading ? 'Generating link…' : copied ? 'Invite link copied!' : 'Copy private invite link'}</span>
                </button>
              )}

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
