'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ResilientImage } from '@/components/ResilientImage';
import { formatEventDay, formatEventRange } from '@/lib/event-style';

/* ─── helpers ─── */
const TINTS = ['terra', 'sage', 'mustard', 'plum', 'sky'] as const;
const TILTS = ['tilt-l', 'tilt-r', 'tilt-ll', 'tilt-rr'] as const;
const TAPE_COLORS = [
  'rgba(212,167,58,0.45)',
  'rgba(150,167,126,0.55)',
  'rgba(212,167,58,0.45)',
];

function tint(i: number) { return TINTS[i % TINTS.length]; }
function tilt(i: number) { return TILTS[i % TILTS.length]; }

const AVATAR_BG = ['var(--terra)', 'var(--sage)', 'var(--mustard)', 'var(--plum)', 'var(--sky)', 'var(--terra-2)'];

function Avatar({ letter, size = 44, bg = 'var(--terra)' }: { letter: string; size?: number; bg?: string }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, border: '1.5px solid var(--ink)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-fraunces), serif', fontWeight: 700,
      fontSize: size * 0.38, color: 'var(--cream)', flexShrink: 0,
    }}>
      {letter}
    </div>
  );
}

function Sep({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '22px 0 14px' }}>
      <div style={{ width: 20, height: 1.5, background: 'var(--ink)', opacity: 0.2 }} />
      <svg width="9" height="9" viewBox="0 0 10 10"><path d="M5 0L6 4L10 5L6 6L5 10L4 6L0 5L4 4Z" fill="var(--terra)" /></svg>
      <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.24em', color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>{label}</span>
      <svg width="9" height="9" viewBox="0 0 10 10"><path d="M5 0L6 4L10 5L6 6L5 10L4 6L0 5L4 4Z" fill="var(--terra)" /></svg>
      <div style={{ flex: 1, height: 1.5, background: 'var(--ink)', opacity: 0.1, borderTop: '1.5px dotted rgba(35,28,21,0.2)' }} />
    </div>
  );
}

/* ─── Flyer Card ─── */
function FlyerCard({
  event, index, size = 'large',
}: {
  event: any;
  index: number;
  size?: 'large' | 'small';
}) {
  const c = tint(index);
  const tiltClass = tilt(index);
  const isLarge = size === 'large';
  const imgBg = c === 'terra'
    ? 'linear-gradient(135deg,rgba(200,85,54,.35),rgba(154,62,35,.2)),repeating-linear-gradient(-45deg,transparent 0 5px,rgba(35,28,21,.06) 5px 6px)'
    : c === 'sage'
    ? 'linear-gradient(135deg,rgba(108,125,87,.35),rgba(80,95,65,.2)),repeating-linear-gradient(45deg,transparent 0 5px,rgba(35,28,21,.06) 5px 6px)'
    : c === 'mustard'
    ? 'linear-gradient(135deg,rgba(212,167,58,.4),rgba(180,140,40,.25)),repeating-linear-gradient(-45deg,transparent 0 5px,rgba(35,28,21,.06) 5px 6px)'
    : c === 'plum'
    ? 'linear-gradient(135deg,rgba(107,69,104,.4),rgba(70,40,70,.2)),repeating-linear-gradient(45deg,transparent 0 5px,rgba(35,28,21,.06) 5px 6px)'
    : 'linear-gradient(135deg,rgba(90,125,138,.35),rgba(60,95,110,.2)),repeating-linear-gradient(45deg,transparent 0 5px,rgba(35,28,21,.06) 5px 6px)';

  const organizer = event.organizer?.name || 'Local host';
  const initial = organizer[0]?.toUpperCase() || 'L';
  const rsvpCount = event.rsvps?.length ?? 0;
  const isTonight = (() => {
    try {
      const d = new Date(event.startTime);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    } catch { return false; }
  })();

  return (
    <Link href={`/events/${event.id}`} style={{ textDecoration: 'none', display: 'block', width: '100%' }}>
      <div
        className={tiltClass}
        style={{
          background: 'var(--paper-card)',
          border: '1.5px solid var(--ink)',
          boxShadow: isLarge ? '3px 3px 0 var(--ink)' : '2px 2px 0 var(--ink)',
          padding: isLarge ? 14 : 9,
          position: 'relative',
          cursor: 'pointer',
          transition: 'transform 180ms ease, box-shadow 180ms ease',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = 'rotate(0deg) translateY(-2px)';
          (e.currentTarget as HTMLElement).style.boxShadow = isLarge ? '5px 5px 0 var(--ink)' : '3px 3px 0 var(--ink)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = '';
          (e.currentTarget as HTMLElement).style.boxShadow = isLarge ? '3px 3px 0 var(--ink)' : '2px 2px 0 var(--ink)';
        }}
      >
        {/* Tape strip */}
        <span style={{
          position: 'absolute', top: -10, left: '35%',
          width: 58, height: 18,
          background: TAPE_COLORS[index % TAPE_COLORS.length],
          borderLeft: '1px dashed rgba(35,28,21,.25)',
          borderRight: '1px dashed rgba(35,28,21,.25)',
          transform: `rotate(${index % 2 ? 5 : -5}deg)`,
          zIndex: 2,
        }} />

        {/* Stamp */}
        {isTonight && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', padding: '3px 8px',
            background: 'var(--terra)', color: 'var(--cream)',
            border: '1.5px solid var(--terra-deep)',
            fontFamily: 'var(--font-mono), monospace', fontSize: 8,
            textTransform: 'uppercase', letterSpacing: '0.18em',
            marginBottom: 8,
          }}>
            TONIGHT
          </span>
        )}

        {/* Image */}
        <div style={{
          height: isLarge ? 110 : 72,
          background: imgBg,
          border: `1.5px solid var(--${c === 'terra' ? 'terra-deep' : c})`,
          overflow: 'hidden',
          position: 'relative',
        }}>
          {event.bannerUrl && (
            <ResilientImage
              src={event.bannerUrl}
              alt={event.title}
              className="w-full h-full object-cover"
              fallback={<div style={{ width: '100%', height: '100%', background: imgBg }} />}
            />
          )}
        </div>

        {/* Title */}
        <div style={{
          fontFamily: 'var(--font-fraunces), serif', fontWeight: 600,
          fontSize: isLarge ? 22 : 14, lineHeight: 1.05,
          letterSpacing: '-0.02em', marginTop: 8,
          color: 'var(--ink)',
        }}>
          {event.title}
        </div>

        {/* Meta */}
        <div style={{
          fontFamily: 'var(--font-mono), monospace', fontSize: 8,
          textTransform: 'uppercase', letterSpacing: '0.18em',
          color: 'var(--ink-soft)', marginTop: 4,
        }}>
          {formatEventDay(event.startTime)} · {formatEventRange(event.startTime, event.endTime)}
        </div>

        {/* Host row */}
        {isLarge && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Avatar letter={initial} size={20} bg={AVATAR_BG[index % AVATAR_BG.length]} />
              <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, color: 'var(--ink-soft)' }}>
                {organizer.split(' ')[0]}
              </span>
            </div>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '3px 9px', border: '1.4px solid var(--ink)',
              borderRadius: 999, background: 'var(--ink)',
              color: 'var(--cream)', fontFamily: 'var(--font-mono), monospace',
              fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.12em',
            }}>
              {rsvpCount > 0 ? `${rsvpCount} GOING` : 'RSVP →'}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

/* ─── Editorial Wall ─── */
export function EditorialWall({ events }: { events: any[] }) {
  const [dateStr, setDateStr] = useState('');
  const [vol, setVol] = useState('VOL. I');

  useEffect(() => {
    const d = new Date();
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    setDateStr(`${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`);
    setVol(`VOL. ${Math.ceil((d.getMonth() + 1) / 3) + 3}`);
  }, []);

  const featuredEvents = events.slice(0, 2);
  const pinnedEvents = events.slice(2, 7);
  const hosts = events
    .map(e => ({ name: e.organizer?.name || 'Host', id: e.organizerId }))
    .filter((h, i, arr) => arr.findIndex(x => x.id === h.id) === i)
    .slice(0, 6);

  return (
    <main style={{
      maxWidth: 640, margin: '0 auto',
      padding: '0 16px 100px',
      fontFamily: 'var(--font-mono), monospace',
      color: 'var(--ink)',
    }}>
      {/* ── Masthead ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 12 }}>
        <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'var(--ink-soft)' }}>
          {vol} · {dateStr}
        </span>
        <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--terra)' }}>
          ◉ YOUR HOOD
        </span>
      </div>

      {/* Solid rule */}
      <div style={{ height: 1.5, background: 'var(--ink)', margin: '6px 0 12px', opacity: 0.7 }} />

      {/* ── Hero headline ── */}
      <h1 style={{
        fontFamily: 'var(--font-fraunces), serif', fontWeight: 600,
        fontSize: 'clamp(42px, 12vw, 60px)', lineHeight: 0.93,
        letterSpacing: '-0.025em', color: 'var(--ink)',
      }}>
        more alive
        <br />
        <span style={{
          fontFamily: 'var(--font-serif), serif', fontStyle: 'italic',
          color: 'var(--terra)',
        }}>
          than you think.
        </span>
      </h1>

      <p style={{
        fontFamily: 'var(--font-mono), monospace', fontSize: 11,
        color: 'var(--ink-soft)', marginTop: 12, lineHeight: 1.6,
      }}>
        {events.length > 0
          ? `${events.length} things happening in walking distance. pick one for tonight.`
          : 'Discover what\'s happening in your neighbourhood. No algorithm, no ads.'}
      </p>

      {/* CTA row */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Link
          href="/discover"
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '12px 18px',
            background: 'var(--terra)',
            border: '1.5px solid var(--terra-deep)',
            boxShadow: '2px 2px 0 var(--terra-deep)',
            color: 'var(--cream)',
            fontFamily: 'var(--font-mono), monospace', fontSize: 11,
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em',
            textDecoration: 'none',
          }}
        >
          EXPLORE →
        </Link>
        <Link
          href="/discover"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '12px 16px',
            background: 'transparent',
            border: '1.5px solid var(--ink)',
            color: 'var(--ink)',
            fontFamily: 'var(--font-mono), monospace', fontSize: 11,
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em',
            textDecoration: 'none',
          }}
        >
          ◎ MAP
        </Link>
      </div>

      {/* ── Featured events ── */}
      {featuredEvents.length > 0 && (
        <>
          <Sep label="starting soon" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {featuredEvents.map((event, i) => (
              <FlyerCard key={event.id} event={event} index={i} size="large" />
            ))}
          </div>
        </>
      )}

      {/* ── Pinned on the wall ── */}
      {pinnedEvents.length > 0 && (
        <>
          <Sep label="pinned on the wall" />
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12, paddingTop: 8, marginLeft: -4, paddingLeft: 4 }}>
            {pinnedEvents.map((event, i) => (
              <div key={event.id} style={{ minWidth: 140, flexShrink: 0 }}>
                <FlyerCard event={event} index={i + 2} size="small" />
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── People hosting ── */}
      {hosts.length > 0 && (
        <>
          <Sep label="people hosting this week" />
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
            {hosts.map((host, i) => (
              <div key={host.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, minWidth: 56, flexShrink: 0 }}>
                <Avatar
                  letter={host.name[0]?.toUpperCase() || 'H'}
                  size={50}
                  bg={AVATAR_BG[i % AVATAR_BG.length]}
                />
                <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-soft)', textAlign: 'center' }}>
                  {host.name.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Empty state ── */}
      {events.length === 0 && (
        <>
          <Sep label="the wall is quiet" />
          <div
            className="tilt-l"
            style={{
              background: 'var(--paper-card)', border: '1.5px solid var(--ink)',
              boxShadow: '3px 3px 0 var(--ink)', padding: 20,
              position: 'relative',
            }}
          >
            <span style={{ position: 'absolute', top: -10, left: 20, width: 58, height: 18, background: 'rgba(212,167,58,0.45)', borderLeft: '1px dashed rgba(35,28,21,.25)', borderRight: '1px dashed rgba(35,28,21,.25)', transform: 'rotate(-5deg)', zIndex: 2 }} />
            <div style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 600, fontSize: 28, lineHeight: 1 }}>
              Be the first to<br />
              <span style={{ fontFamily: 'var(--font-serif), serif', fontStyle: 'italic', color: 'var(--terra)' }}>pin something.</span>
            </div>
            <p style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: 'var(--ink-soft)', marginTop: 10, lineHeight: 1.6 }}>
              HOST AN EVENT AND WATCH YOUR HOOD COME ALIVE.
            </p>
            <Link
              href="/events/new"
              style={{
                display: 'inline-flex', alignItems: 'center', marginTop: 14,
                padding: '11px 18px',
                background: 'var(--terra)', border: '1.5px solid var(--terra-deep)',
                boxShadow: '2px 2px 0 var(--terra-deep)',
                color: 'var(--cream)', textDecoration: 'none',
                fontFamily: 'var(--font-mono), monospace', fontSize: 11,
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em',
              }}
            >
              HOST AN EVENT →
            </Link>
          </div>
        </>
      )}

      {/* ── Host CTA ── */}
      {events.length > 0 && (
        <>
          <Sep label="make it happen" />
          <div style={{ position: 'relative' }}>
            {/* Hand note */}
            <div style={{
              fontFamily: 'var(--font-caveat), cursive', fontWeight: 600,
              fontSize: 18, color: 'var(--terra)',
              transform: 'rotate(-3deg)', marginBottom: 8, display: 'inline-block',
            }}>
              ↙ your gathering, your rules
            </div>
            <Link
              href="/events/new"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '13px 18px',
                background: 'var(--ink)', border: '1.5px solid var(--ink)',
                boxShadow: '2px 2px 0 var(--ink-2)',
                color: 'var(--cream)', textDecoration: 'none',
                fontFamily: 'var(--font-mono), monospace', fontSize: 11,
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em',
              }}
            >
              ＋ HOST AN EVENT
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
