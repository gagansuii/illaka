'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Copy, Download, Globe, Link2, Lock, MapPin, Share2, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { PaymentButton } from '@/components/PaymentButton';
import { ResilientImage } from '@/components/ResilientImage';
import { Button } from '@/components/ui/button';
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
  paymentQrUrl?: string | null;
  isPaid?: boolean;
  organizer?: { name?: string | null } | null;
  rsvps?: Array<{ id: string }>;
};

const Stamp = ({ children, kind = 'terra' }: { children: React.ReactNode; kind?: string }) => (
  <span className={`stamp stamp-${kind}`}>{children}</span>
);

const Sep = ({ label }: { label: string }) => (
  <div className="ilaaka-sep" style={{ margin: '18px 0 12px' }}>
    <span>{label}</span>
  </div>
);

const AVATAR_COLORS = ['var(--terra)', 'var(--sage)', 'var(--mustard)', 'var(--plum)', 'var(--sky)', 'var(--terra-2)', 'var(--sage-2)'];

function Avatar({ letter, size = 32, bg = 'var(--terra)' }: { letter: string; size?: number; bg?: string }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, border: '1.5px solid var(--ink)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-fraunces), serif', fontWeight: 700,
      fontSize: size * 0.4, color: 'var(--cream)', flexShrink: 0,
    }}>
      {letter}
    </div>
  );
}

export function EventDetailClient({ event }: { event: EventDetail }) {
  const router = useRouter();
  const { data } = useSession();
  const [rsvpCount, setRsvpCount] = useState(event.rsvps?.length ?? 0);
  const [loading, setLoading] = useState(false);
  const [rsvpError, setRsvpError] = useState('');
  const [joined, setJoined] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const hostingThreshold = Number(process.env.NEXT_PUBLIC_HOSTING_FEE_THRESHOLD ?? 50);
  const hostingFee = Number(process.env.NEXT_PUBLIC_HOSTING_FEE_AMOUNT ?? 25000);
  const promotionPrice = Number(process.env.NEXT_PUBLIC_PROMOTION_PRICE ?? 15000);

  const theme = useMemo(() => getEventTheme(event), [event]);
  const isOrganizer = data?.user?.id === event.organizerId;
  const capacity = Math.max(event.capacity ?? 0, 1);
  const seatsLeft = Math.max(capacity - rsvpCount, 0);
  const fillPercent = Math.min(100, Math.round((rsvpCount / capacity) * 100));
  const organizerName = event.organizer?.name || 'Local organizer';
  const organizerInitials = organizerName.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();

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
      fetch(`/api/events/${event.id}/share`, { method: 'POST' }).catch(() => null);
    } catch { /* cancelled */ }
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
    } catch { /* ignore */ } finally {
      setInviteLoading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: 'DELETE' });
      if (!res.ok) {
        setDeleteError('Could not delete event. Please try again.');
        setDeleting(false);
        return;
      }
      router.push('/profile');
    } catch {
      setDeleteError('Could not delete event. Please try again.');
      setDeleting(false);
    }
  }

  async function rsvp() {
    if (loading || joined) return;
    setLoading(true);
    setRsvpError('');
    setJoined(true);
    setRsvpCount((c: number) => c + 1);
    try {
      const res = await fetch(`/api/events/${event.id}/rsvp`, { method: 'POST' });
      if (!res.ok) {
        let data: any = null;
        try { data = await res.json(); } catch { data = null; }
        setJoined(false);
        setRsvpCount((c: number) => Math.max(c - 1, 0));
        const knownMsg = data?.error === 'Event is full' ? 'This event is full.'
          : data?.error === 'Already RSVPed' ? "You're already registered."
          : 'Could not RSVP. Please try again.';
        setRsvpError(knownMsg);
      }
    } catch {
      setJoined(false);
      setRsvpCount((c: number) => Math.max(c - 1, 0));
      setRsvpError('Could not RSVP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const isOnline = (event.eventType ?? 'PHYSICAL') === 'ONLINE';

  return (
    <div
      style={{
        maxWidth: 640,
        margin: '0 auto',
        padding: '0 0 140px',
        fontFamily: 'var(--font-mono), ui-monospace, monospace',
        color: 'var(--ink)',
      }}
    >
      {/* Back bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px 0' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.22em',
            color: 'var(--ink-soft)', textDecoration: 'none',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          BACK TO WALL
        </Link>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={handleShare}
            style={{
              width: 36, height: 36, border: '1.5px solid var(--ink)',
              background: 'var(--paper-card)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
            aria-label="Share"
          >
            <Share2 size={15} />
          </button>
        </div>
      </div>

      <div style={{ padding: '8px 16px 0' }}>
        {/* ── Main flyer card ── */}
        <div
          className="flyer-card"
          style={{ padding: 18, marginTop: 8, position: 'relative' }}
        >
          {/* Tape strips */}
          <span className="tape" style={{ top: -10, left: 20, transform: 'rotate(-5deg)', width: 72 }} />
          <span className="tape tape-sage" style={{ top: -10, right: 20, transform: 'rotate(6deg)', width: 72 }} />

          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 4 }}>
            <span style={{
              fontFamily: 'var(--font-mono), monospace', fontSize: 9,
              textTransform: 'uppercase', letterSpacing: '0.22em', color: 'var(--ink-soft)',
            }}>
              {event.visibility === 'PRIVATE' ? '🔒 PRIVATE EVENT' : 'PUBLIC WALL'}
            </span>
            <Stamp kind="terra">
              {seatsLeft > 0 ? `${seatsLeft} SPOTS LEFT` : 'FULL'}
            </Stamp>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: 'var(--font-fraunces), serif', fontWeight: 600,
            fontSize: 'clamp(36px, 8vw, 52px)', lineHeight: 0.95,
            letterSpacing: '-0.02em', marginTop: 10, color: 'var(--ink)',
          }}>
            {event.title}
          </h1>

          {/* Hero image */}
          <div style={{ marginTop: 14, position: 'relative', overflow: 'hidden', border: '1.5px solid var(--ink)' }}>
            {event.bannerUrl ? (
              <ResilientImage
                src={event.bannerUrl}
                alt={event.title}
                className="w-full object-cover"
                style={{ minHeight: 180, maxHeight: 240, display: 'block' }}
                fallback={
                  <div style={{
                    minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `linear-gradient(135deg, ${theme.accentStrong}, ${theme.accent})`,
                    fontSize: 56, fontFamily: 'var(--font-fraunces), serif', fontWeight: 700,
                    color: 'white',
                  }}>
                    {event.title.charAt(0)}
                  </div>
                }
              />
            ) : (
              <div style={{
                minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `linear-gradient(135deg, rgba(200,85,54,0.22), rgba(108,125,87,0.15))`,
                fontSize: 56, fontFamily: 'var(--font-fraunces), serif', fontWeight: 700,
                color: 'var(--ink-soft)',
              }}>
                {event.title.charAt(0)}
              </div>
            )}
          </div>

          {/* At-a-glance 3-col grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            border: '1.5px solid var(--ink)', marginTop: 14,
          }}>
            {[
              ['WHEN', formatEventDay(event.startTime), formatEventClock(event.startTime), 'rgba(200,85,54,0.08)'],
              ['WHERE', isOnline ? 'Online' : 'View map', isOnline ? '' : '↗ directions', 'rgba(108,125,87,0.08)'],
              ['CAPACITY', `${rsvpCount}/${capacity}`, `${fillPercent}% filled`, 'rgba(212,167,58,0.1)'],
            ].map(([k, a, b, bg], i) => (
              <div key={k} style={{
                padding: 10,
                borderRight: i < 2 ? '1.5px solid var(--ink)' : 'none',
                background: bg,
              }}>
                <div style={{ fontSize: 8, fontFamily: 'var(--font-mono), monospace', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--ink-soft)' }}>{k}</div>
                <div style={{ fontFamily: 'var(--font-serif), serif', fontSize: 16, marginTop: 3, lineHeight: 1.1, fontStyle: 'italic' }}>{a}</div>
                <div style={{ fontSize: 9, marginTop: 2, color: 'var(--ink-soft)' }}>{b}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Story ── */}
        <Sep label="the story" />
        <p style={{
          fontFamily: 'var(--font-serif), serif', fontSize: 17,
          lineHeight: 1.55, color: 'var(--ink-2)', fontStyle: 'italic',
        }}>
          {event.description}
        </p>

        {/* ── Host card ── */}
        <Sep label="your host" />
        <div className="flyer-card-sm" style={{ padding: 14 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Avatar letter={organizerInitials || 'IL'} size={52} bg="var(--mustard)" />
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: 'var(--font-fraunces), serif', fontWeight: 600,
                fontSize: 20, lineHeight: 1,
              }}>
                {organizerName}
              </div>
              <div style={{ marginTop: 5, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Stamp kind="paper">LOCAL HOST</Stamp>
                {event.visibility === 'PUBLIC' && <Stamp kind="sage">PUBLIC</Stamp>}
              </div>
            </div>
          </div>
          <p style={{
            fontFamily: 'var(--font-caveat), cursive', fontWeight: 600,
            fontSize: 17, marginTop: 12, color: 'var(--ink-soft)', lineHeight: 1.3,
          }}>
            "Building the kind of gathering you can walk into comfortably."
          </p>
        </div>

        {/* ── Location ── */}
        <Sep label={isOnline ? 'join link' : 'where'} />
        {isOnline ? (
          event.onlineLink && event.linkShareMode === 'IMMEDIATE' ? (
            <a
              href={event.onlineLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 18px', background: 'var(--terra)',
                border: '1.5px solid var(--terra-deep)', boxShadow: '2px 2px 0 var(--terra-deep)',
                color: 'var(--cream)', fontFamily: 'var(--font-mono), monospace',
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.16em', textDecoration: 'none',
              }}
            >
              <Globe size={15} />
              JOIN MEETING →
            </a>
          ) : (
            <div style={{
              padding: '12px 14px', border: '1.5px solid var(--ink)',
              background: 'var(--paper-2)', fontSize: 11,
              fontFamily: 'var(--font-mono), monospace', color: 'var(--ink-soft)',
            }}>
              MEETING LINK · WILL BE SHARED BEFORE THE EVENT
            </div>
          )
        ) : (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', border: '1.5px solid var(--ink)',
              background: 'var(--paper-card)', textDecoration: 'none',
              color: 'var(--ink)',
            }}
          >
            <div>
              <div style={{ fontFamily: 'var(--font-serif), serif', fontSize: 16, fontStyle: 'italic' }}>
                {formatEventDay(event.startTime)} · {formatEventRange(event.startTime, event.endTime)}
              </div>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono), monospace', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--ink-soft)', marginTop: 4 }}>
                TAP TO OPEN IN MAPS
              </div>
            </div>
            <span style={{ color: 'var(--terra)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={15} />
              <ArrowUpRight size={15} />
            </span>
          </a>
        )}

        {/* ── Attendees ── */}
        <Sep label={`${rsvpCount} going`} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          {Array.from({ length: Math.min(rsvpCount, 10) }).map((_, i) => (
            <Avatar
              key={i}
              letter={String.fromCharCode(65 + (i % 26))}
              size={30}
              bg={AVATAR_COLORS[i % AVATAR_COLORS.length]}
            />
          ))}
          {rsvpCount > 10 && (
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--paper-2)', border: '1.5px solid var(--ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontFamily: 'var(--font-mono), monospace',
            }}>
              +{rsvpCount - 10}
            </div>
          )}
          {rsvpCount === 0 && (
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono), monospace', color: 'var(--ink-soft)' }}>
              BE THE FIRST TO JOIN
            </span>
          )}
        </div>

        {/* ── Organizer actions (if host) ── */}
        {isOrganizer && (
          <>
            <Sep label="organizer actions" />
            <div className="flyer-card-sm" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'var(--ink-soft)' }}>
                MANAGE THIS EVENT
              </div>

              {event.visibility === 'PRIVATE' && (
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  disabled={inviteLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', border: '1.5px solid var(--ink)',
                    background: 'var(--paper-2)', cursor: 'pointer',
                    fontFamily: 'var(--font-mono), monospace', fontSize: 10,
                    textTransform: 'uppercase', letterSpacing: '0.14em',
                  }}
                >
                  {copied ? <Copy size={14} /> : <Link2 size={14} />}
                  {inviteLoading ? 'GENERATING…' : copied ? 'INVITE LINK COPIED!' : 'COPY PRIVATE INVITE LINK'}
                </button>
              )}

              {rsvpCount >= hostingThreshold ? (
                <PaymentButton label="PAY HOSTING FEE" reason="hosting_fee" amount={hostingFee} eventId={event.id} eventTitle={event.title} />
              ) : (
                <div style={{
                  padding: '10px 14px', border: '1.5px solid var(--ink)',
                  background: 'var(--paper-2)', fontSize: 10,
                  fontFamily: 'var(--font-mono), monospace', color: 'var(--ink-soft)',
                }}>
                  HOSTING FEE UNLOCKS AT {hostingThreshold} RSVPs · {rsvpCount}/{hostingThreshold} NOW
                </div>
              )}

              <PaymentButton label="BOOST EVENT PROMOTION" reason="promotion" amount={promotionPrice} eventId={event.id} eventTitle={event.title} />

              {/* Delete event */}
              <div style={{ borderTop: '1px dashed var(--ink-faint)', paddingTop: 10, marginTop: 2 }}>
                {!deleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', border: '1.5px solid var(--terra)',
                      background: 'transparent', cursor: 'pointer',
                      fontFamily: 'var(--font-mono), monospace', fontSize: 10,
                      textTransform: 'uppercase', letterSpacing: '0.14em',
                      color: 'var(--terra)', width: '100%',
                    }}
                  >
                    <Trash2 size={14} />
                    DELETE EVENT
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--terra)' }}>
                      THIS CANNOT BE UNDONE. DELETE?
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        style={{
                          flex: 1, padding: '9px 14px',
                          background: 'var(--terra)', border: '1.5px solid var(--terra-deep)',
                          boxShadow: '2px 2px 0 var(--terra-deep)',
                          color: 'var(--cream)', cursor: deleting ? 'default' : 'pointer',
                          fontFamily: 'var(--font-mono), monospace', fontSize: 10,
                          fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em',
                        }}
                      >
                        {deleting ? 'DELETING…' : 'YES, DELETE'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setDeleteConfirm(false); setDeleteError(''); }}
                        style={{
                          flex: 1, padding: '9px 14px',
                          background: 'var(--paper-2)', border: '1.5px solid var(--ink)',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-mono), monospace', fontSize: 10,
                          textTransform: 'uppercase', letterSpacing: '0.14em',
                          color: 'var(--ink)',
                        }}
                      >
                        CANCEL
                      </button>
                    </div>
                    {deleteError && (
                      <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, color: 'var(--terra)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                        {deleteError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Payment QR ── */}
        {event.isPaid && event.paymentQrUrl && !isOrganizer && (
          <>
            <Sep label="payment" />
            <div className="flyer-card-sm" style={{ padding: 14 }}>
              <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'var(--ink-soft)', marginBottom: 10 }}>
                SCAN TO PAY · UPI APPS ACCEPTED
              </div>
              <img src={event.paymentQrUrl} alt="Payment QR code" style={{ width: 160, border: '1.5px solid var(--ink)', display: 'block' }} />
              <a
                href={event.paymentQrUrl}
                download="payment-qr.png"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 10,
                  padding: '8px 12px', border: '1.5px solid var(--ink)',
                  background: 'var(--paper-2)', fontSize: 10, textDecoration: 'none',
                  fontFamily: 'var(--font-mono), monospace', color: 'var(--ink)',
                  textTransform: 'uppercase', letterSpacing: '0.14em',
                }}
              >
                <Download size={13} />
                DOWNLOAD QR
              </a>
            </div>
          </>
        )}
      </div>

      {/* ── Sticky RSVP bottom bar ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '12px 16px',
        background: 'var(--paper-card)',
        borderTop: '1.5px solid var(--ink)',
        zIndex: 30,
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-serif), serif', fontSize: 18, lineHeight: 1, fontStyle: 'italic' }}>
                {formatEventRange(event.startTime, event.endTime)}
              </div>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono), monospace', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--ink-soft)', marginTop: 3 }}>
                {formatEventDay(event.startTime)} · {seatsLeft > 0 ? `${seatsLeft} SPOTS LEFT` : 'FULL'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={handleShare}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 40, height: 40, border: '1.5px solid var(--ink)',
                  background: 'transparent', cursor: 'pointer',
                }}
                aria-label="Share"
              >
                <Share2 size={15} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Link
              href="/"
              style={{
                flex: 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '11px 14px', border: '1.5px solid var(--ink)',
                background: 'transparent', color: 'var(--ink)',
                fontFamily: 'var(--font-mono), monospace', fontSize: 10,
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em',
                textDecoration: 'none',
              }}
            >
              ← BACK
            </Link>
            <button
              type="button"
              onClick={rsvp}
              disabled={loading || joined}
              style={{
                flex: 1.4, padding: '11px 18px',
                background: joined ? 'var(--sage)' : loading ? 'var(--ink-faint)' : 'var(--terra)',
                border: `1.5px solid ${joined ? 'var(--sage)' : 'var(--terra-deep)'}`,
                boxShadow: `2px 2px 0 ${joined ? 'var(--sage)' : 'var(--terra-deep)'}`,
                color: 'var(--cream)',
                fontFamily: 'var(--font-mono), monospace', fontSize: 11,
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em',
                cursor: loading || joined ? 'default' : 'pointer',
              }}
            >
              {loading ? 'RESERVING…' : joined ? '✓ YOU\'RE IN' : 'RSVP · I\'M IN →'}
            </button>
          </div>

          {rsvpError && (
            <p style={{ fontSize: 10, color: 'var(--terra)', marginTop: 6, fontFamily: 'var(--font-mono), monospace' }}>
              {rsvpError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
