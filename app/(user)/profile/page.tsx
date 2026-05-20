'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { PaymentButton } from '@/components/PaymentButton';
import { OrganizerDashboard } from '@/components/OrganizerDashboard';

type MyEvent = {
  id: string; title: string; startTime: string; endTime: string;
  visibility: string; capacity: number; isPaid: boolean;
  _count?: { rsvps: number };
};

const VIBE_TAGS = [
  ['slow walks', 'terra'], ['hot chai', 'mustard'], ['local events', 'sage'],
  ['old books', 'plum'], ['street food', 'mustard'], ['open mic', 'plum'],
];

const BADGES = [
  { icon: '✓', label: 'VERIFIED', color: 'var(--sage)', earned: true },
  { icon: '☕', label: 'LOCAL HOST', color: 'var(--terra)', earned: true },
  { icon: '☷', label: 'EARLY BIRD', color: 'var(--mustard)', earned: true },
  { icon: '✿', label: 'EXPLORER', color: 'var(--plum)', earned: false },
  { icon: '♪', label: 'OPEN MIC', color: 'var(--sky)', earned: false },
  { icon: '⇡', label: 'RUN CLUB', color: 'var(--sage)', earned: false },
];

function Badge({ icon, label, color, earned }: { icon: string; label: string; color: string; earned: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, opacity: earned ? 1 : 0.32, width: 66 }}>
      <div style={{
        width: 52, height: 52,
        background: earned ? color : 'var(--paper-2)',
        border: '1.5px solid var(--ink)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
      }}>
        <span style={{ fontSize: 22, color: earned ? 'var(--cream)' : 'var(--ink-faint)' }}>{icon}</span>
      </div>
      <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', color: 'var(--ink-soft)' }}>{label}</span>
    </div>
  );
}

function EventRow({ event, isPast, onDelete }: { event: MyEvent; isPast: boolean; onDelete: (id: string) => void }) {
  const start = new Date(event.startTime);
  const dateStr = start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }).toUpperCase();
  const timeStr = start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm) { setConfirm(true); return; }
    setDeleting(true);
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: 'DELETE' });
      if (res.ok) onDelete(event.id);
    } finally {
      setDeleting(false);
      setConfirm(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <Link
          href={`/events/${event.id}`}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 12px',
            border: `1.5px solid ${isPast ? 'var(--ink-faint)' : 'var(--ink)'}`,
            borderRight: 'none',
            background: isPast ? 'transparent' : 'var(--paper-card)',
            boxShadow: isPast ? 'none' : '2px 2px 0 var(--ink)',
            textDecoration: 'none', color: 'var(--ink)',
            opacity: isPast ? 0.55 : 1,
            minWidth: 0,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 600, fontSize: 15, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {event.title}
            </div>
            <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--ink-soft)', marginTop: 3 }}>
              {dateStr} · {timeStr} · {event._count?.rsvps ?? 0}/{event.capacity} RSVPS
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 10 }}>
            {event.visibility === 'PRIVATE' && (
              <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.14em', border: '1px solid var(--ink-faint)', padding: '2px 6px', color: 'var(--ink-soft)' }}>PRIVATE</span>
            )}
            {isPast ? (
              <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.14em', border: '1px solid var(--ink-faint)', padding: '2px 6px', color: 'var(--ink-faint)' }}>ENDED</span>
            ) : (
              <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 8, color: 'var(--ink-soft)' }}>→</span>
            )}
          </div>
        </Link>

        {/* Delete button */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          title={confirm ? 'Click again to confirm delete' : 'Delete event'}
          style={{
            flexShrink: 0, width: 42,
            border: `1.5px solid ${confirm ? 'var(--terra)' : isPast ? 'var(--ink-faint)' : 'var(--ink)'}`,
            borderLeft: '1px solid var(--ink-faint)',
            background: confirm ? 'rgba(200,85,54,0.12)' : 'transparent',
            cursor: deleting ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: confirm ? 'var(--terra)' : 'var(--ink-faint)',
            transition: 'all 150ms',
          }}
          aria-label={confirm ? 'Confirm delete' : 'Delete event'}
        >
          {deleting ? (
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono), monospace' }}>…</span>
          ) : confirm ? (
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono), monospace', fontWeight: 700, color: 'var(--terra)' }}>✓?</span>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          )}
        </button>
      </div>

      {/* Confirm banner (shown below row when confirm=true) */}
      {confirm && !deleting && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 12px',
          background: 'rgba(200,85,54,0.08)', border: '1.5px solid var(--terra)', borderTop: 'none',
          fontFamily: 'var(--font-mono), monospace', fontSize: 9,
          textTransform: 'uppercase', letterSpacing: '0.14em',
        }}>
          <span style={{ color: 'var(--terra)' }}>DELETE "{event.title.slice(0, 28)}{event.title.length > 28 ? '…' : ''}"?</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={handleDelete} style={{ background: 'var(--terra)', border: 'none', color: 'var(--cream)', padding: '3px 10px', cursor: 'pointer', fontFamily: 'var(--font-mono), monospace', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em' }}>YES</button>
            <button type="button" onClick={(e) => { e.preventDefault(); setConfirm(false); }} style={{ background: 'transparent', border: '1px solid var(--ink-faint)', color: 'var(--ink-soft)', padding: '3px 10px', cursor: 'pointer', fontFamily: 'var(--font-mono), monospace', fontSize: 9, letterSpacing: '0.12em' }}>NO</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { data } = useSession();
  const [name, setName] = useState('');
  const [radius, setRadius] = useState(5000);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<MyEvent[]>([]);
  const [pastEvents, setPastEvents] = useState<MyEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const canViewOrganizerDashboard = data?.user?.role === 'ORGANIZER' || data?.user?.role === 'ADMIN';

  function handleEventDeleted(id: string) {
    setUpcomingEvents(prev => prev.filter(e => e.id !== id));
    setPastEvents(prev => prev.filter(e => e.id !== id));
  }

  useEffect(() => {
    if (data?.user?.name) setName(data.user.name);
  }, [data]);

  useEffect(() => {
    if (!data?.user) return;
    setEventsLoading(true);
    fetch('/api/users/my-events')
      .then(r => r.json())
      .then(d => {
        setUpcomingEvents(d.upcoming ?? []);
        setPastEvents(d.past ?? []);
      })
      .catch(() => null)
      .finally(() => setEventsLoading(false));
  }, [data?.user]);

  async function saveProfile() {
    setSaving(true);
    setSaveError('');
    const res = await fetch('/api/users/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, radiusPreference: radius }),
    });
    if (!res.ok) {
      let d: any = null;
      try { d = await res.json(); } catch { d = null; }
      setSaveError(d?.error ?? 'Could not save profile');
    }
    setSaving(false);
  }

  const initials = (name || data?.user?.name || 'IL')
    .split(' ')
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div style={{
      maxWidth: 560, margin: '0 auto', padding: '0 16px 100px',
      fontFamily: 'var(--font-mono), ui-monospace, monospace',
      color: 'var(--ink)',
    }}>
      {/* top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 0' }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'var(--ink-soft)' }}
        >
          ← BACK
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setEditOpen((v) => !v)}
            style={{
              padding: '5px 12px', border: '1.5px solid var(--ink)', background: 'var(--paper-card)',
              cursor: 'pointer', fontSize: 9, fontFamily: 'var(--font-mono), monospace',
              textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--ink)',
            }}
          >
            ✎ EDIT
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={{
              padding: '5px 12px', border: '1.5px solid var(--ink)', background: 'transparent',
              cursor: 'pointer', fontSize: 9, fontFamily: 'var(--font-mono), monospace',
              textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--ink-soft)',
            }}
          >
            SIGN OUT
          </button>
        </div>
      </div>

      {/* ── ID Card ── */}
      <div
        className="flyer-card tilt-l"
        style={{ padding: 16, marginTop: 14, position: 'relative' }}
      >
        <span className="tape" style={{ top: -10, left: '38%', transform: 'rotate(3deg)', width: 66 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'var(--ink-soft)' }}>
            ILAKA · LOCAL ID
          </span>
          <span className="stamp stamp-terra">
            {data?.user?.role === 'ORGANIZER' || data?.user?.role === 'ADMIN' ? 'HOST' : 'MEMBER'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 14, marginTop: 14, alignItems: 'flex-start' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 74, height: 84,
              background: 'linear-gradient(135deg, rgba(200,85,54,0.35), rgba(154,62,35,0.2))',
              border: '1.5px solid var(--terra-deep)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-fraunces), serif', fontWeight: 700,
              fontSize: 32, color: 'var(--cream)',
            }}>
              {initials}
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{
              fontFamily: 'var(--font-fraunces), serif', fontWeight: 600,
              fontSize: 28, lineHeight: 0.95, letterSpacing: '-0.02em',
            }}>
              {name || data?.user?.name || 'Neighbour'}
            </h2>
            <div style={{ marginTop: 6, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--ink-soft)' }}>
              {data?.user?.email ?? 'MEMBER'}
            </div>
            <p style={{ fontFamily: 'var(--font-caveat), cursive', fontWeight: 600, fontSize: 17, marginTop: 8, color: 'var(--ink-2)', lineHeight: 1.2 }}>
              slow walks, hot chai, local events.
            </p>
          </div>
        </div>

        <div style={{ height: 1.5, background: 'var(--ink)', opacity: 0.15, margin: '14px 0 10px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {[['0', 'went'], ['0', 'hosted'], ['★', 'rating']].map(([n, l]) => (
            <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 600, fontSize: 22 }}>{n}</span>
              <span style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--ink-soft)', marginTop: 2 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Edit panel (collapsible) ── */}
      {editOpen && (
        <>
          <div className="ilaka-sep" style={{ margin: '18px 0 12px' }}>
            <span>edit profile</span>
          </div>
          <div className="flyer-card-sm" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--ink-soft)', display: 'block', marginBottom: 6 }}>
                DISPLAY NAME
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ border: '1.5px solid var(--ink)', borderRadius: 0, background: 'var(--paper-2)', fontFamily: 'var(--font-mono), monospace' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--ink-soft)', display: 'block', marginBottom: 6 }}>
                DISCOVERY RADIUS (METERS)
              </label>
              <Input
                type="number"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                style={{ border: '1.5px solid var(--ink)', borderRadius: 0, background: 'var(--paper-2)', fontFamily: 'var(--font-mono), monospace' }}
              />
            </div>
            <button
              type="button"
              onClick={saveProfile}
              disabled={saving}
              style={{
                padding: '11px 18px',
                background: saving ? 'var(--ink-faint)' : 'var(--terra)',
                border: '1.5px solid var(--terra-deep)',
                boxShadow: '2px 2px 0 var(--terra-deep)',
                color: 'var(--cream)',
                fontFamily: 'var(--font-mono), monospace', fontSize: 11,
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em',
                cursor: saving ? 'default' : 'pointer',
              }}
            >
              {saving ? 'SAVING…' : 'SAVE CHANGES →'}
            </button>
            {saveError && <p style={{ fontSize: 10, color: 'var(--terra)' }}>{saveError}</p>}
          </div>
        </>
      )}

      {/* ── Badges ── */}
      <div className="ilaka-sep" style={{ margin: '18px 0 12px' }}>
        <span>badges</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
        {BADGES.map((b) => (
          <Badge key={b.label} {...b} />
        ))}
      </div>

      {/* ── Vibes ── */}
      <div className="ilaka-sep" style={{ margin: '18px 0 12px' }}>
        <span>vibes i&apos;m drawn to</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {VIBE_TAGS.map(([tag, color]) => (
          <span
            key={tag}
            style={{
              padding: '5px 12px',
              border: `1.5px solid var(--${color})`,
              background: `rgba(${color === 'terra' ? '200,85,54' : color === 'mustard' ? '212,167,58' : color === 'sage' ? '108,125,87' : '107,69,104'},0.14)`,
              fontFamily: 'var(--font-mono), monospace', fontSize: 10,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              color: `var(--${color})`,
              borderRadius: 999,
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* ── My Events ── */}
      <div className="ilaka-sep" style={{ margin: '18px 0 12px' }}>
        <span>my events</span>
      </div>

      {eventsLoading ? (
        <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--ink-faint)', padding: '10px 0' }}>
          LOADING…
        </div>
      ) : upcomingEvents.length === 0 && pastEvents.length === 0 ? (
        <div style={{ border: '1.5px dashed var(--ink-faint)', padding: '18px 16px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>
            YOU HAVEN'T HOSTED ANYTHING YET.
          </p>
          <Link href="/events/new" style={{ display: 'inline-block', padding: '8px 16px', background: 'var(--terra)', border: '1.5px solid var(--terra-deep)', boxShadow: '2px 2px 0 var(--terra-deep)', color: 'var(--cream)', fontFamily: 'var(--font-mono), monospace', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', textDecoration: 'none' }}>
            HOST SOMETHING →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {upcomingEvents.length > 0 && (
            <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--sage)', marginBottom: 2 }}>
              UPCOMING · {upcomingEvents.length}
            </div>
          )}
          {upcomingEvents.map(ev => (
            <EventRow key={ev.id} event={ev} isPast={false} onDelete={handleEventDeleted} />
          ))}
          {pastEvents.length > 0 && (
            <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--ink-faint)', marginTop: 6, marginBottom: 2 }}>
              PAST · {pastEvents.length}
            </div>
          )}
          {pastEvents.map(ev => (
            <EventRow key={ev.id} event={ev} isPast={true} onDelete={handleEventDeleted} />
          ))}
        </div>
      )}

      {/* ── Subscription / upgrade ── */}
      <div className="ilaka-sep" style={{ margin: '18px 0 12px' }}>
        <span>upgrade</span>
      </div>
      <PaymentButton
        label="UPGRADE TO PREMIUM CUSTOMISATION"
        reason="subscription"
        amount={Number(process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE ?? 49900)}
      />

      {/* ── Organizer dashboard ── */}
      {canViewOrganizerDashboard && (
        <>
          <div className="ilaka-sep" style={{ margin: '18px 0 12px' }}>
            <span>organizer dashboard</span>
          </div>
          <div className="flyer-card-sm" style={{ padding: 14 }}>
            <OrganizerDashboard />
          </div>
        </>
      )}
    </div>
  );
}
