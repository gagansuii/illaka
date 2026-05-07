'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

const TILT_CLASSES = ['tilt-ll', 'tilt-rr', 'tilt-l'];

const PREVIEW_FLYERS = [
  { title: 'Kiln & chai', meta: 'TONITE · 6:30', tint: 'terra', pos: { top: 10, left: -6, width: 130 }, tilt: 'tilt-ll' },
  { title: 'Run club', meta: 'SAT · 6 AM', tint: 'sage', pos: { top: 4, right: -6, width: 128 }, tilt: 'tilt-rr' },
  { title: 'Open mic', meta: 'FRI · 8 PM', tint: 'plum', pos: { top: 190, left: '50%', width: 140 }, tilt: 'tilt-l', transform: 'translateX(-50%)' },
];

function FlyerPreview({ title, meta, tint, style, tilt }: any) {
  const imgBg = tint === 'terra'
    ? 'linear-gradient(135deg,rgba(200,85,54,.35),rgba(154,62,35,.2)),repeating-linear-gradient(-45deg,transparent 0 5px,rgba(35,28,21,.06) 5px 6px)'
    : tint === 'sage'
    ? 'linear-gradient(135deg,rgba(108,125,87,.35),rgba(80,95,65,.2)),repeating-linear-gradient(45deg,transparent 0 5px,rgba(35,28,21,.06) 5px 6px)'
    : 'linear-gradient(135deg,rgba(107,69,104,.4),rgba(70,40,70,.2)),repeating-linear-gradient(45deg,transparent 0 5px,rgba(35,28,21,.06) 5px 6px)';

  return (
    <div className={tilt} style={{
      position: 'absolute', ...style,
      background: 'var(--paper-card)',
      border: '1.5px solid var(--ink)',
      boxShadow: '2px 2px 0 var(--ink)',
      padding: 8,
    }}>
      <span style={{
        position: 'absolute', top: -8, left: 16, width: 50, height: 16,
        background: 'rgba(212,167,58,.45)',
        borderLeft: '1px dashed rgba(35,28,21,.25)',
        borderRight: '1px dashed rgba(35,28,21,.25)',
        transform: 'rotate(-4deg)', zIndex: 2,
      }} />
      <div style={{ height: 72, background: imgBg, border: `1.5px solid var(--${tint === 'terra' ? 'terra-deep' : tint})` }} />
      <div style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 600, fontSize: 14, lineHeight: 1.1, marginTop: 6, color: 'var(--ink)' }}>{title}</div>
      <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--ink-soft)', marginTop: 3 }}>{meta}</div>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await signIn('credentials', { email, password, redirect: false, callbackUrl: '/' });
      if (!res) { setError('Unable to sign in'); return; }
      if (res.error) { setError('Invalid email or password'); return; }
      if (res.url) window.location.href = res.url;
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 14px', boxSizing: 'border-box',
    border: '1.5px solid var(--ink)', background: 'var(--paper-2)',
    fontFamily: 'var(--font-mono), monospace', fontSize: 12,
    color: 'var(--ink)', outline: 'none',
    borderRadius: 0,
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px 80px',
      fontFamily: 'var(--font-mono), monospace',
      color: 'var(--ink)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'var(--terra)', border: '1.5px solid var(--ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-fraunces), serif', fontWeight: 700,
          fontSize: 18, color: 'var(--cream)',
        }}>
          i
        </div>
        <span style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 600, fontSize: 26, letterSpacing: '-0.02em' }}>
          ilaaka
        </span>
      </div>

      {/* Main card */}
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Headline */}
        <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'var(--ink-soft)' }}>
          WELCOME BACK
        </span>
        <h1 style={{
          fontFamily: 'var(--font-fraunces), serif', fontWeight: 600,
          fontSize: 'clamp(36px, 9vw, 52px)', lineHeight: 0.93,
          letterSpacing: '-0.025em', marginTop: 6,
        }}>
          your hood,
          <br />
          <span style={{ fontFamily: 'var(--font-serif), serif', fontStyle: 'italic', color: 'var(--terra)' }}>
            still alive.
          </span>
        </h1>
        <p style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: 'var(--ink-soft)', marginTop: 12, lineHeight: 1.6 }}>
          SIGN IN TO SEE WHAT'S HAPPENING ROUND THE CORNER.
        </p>

        {/* Flyer collage preview */}
        <div style={{ position: 'relative', height: 300, margin: '18px 0' }}>
          <FlyerPreview title="Kiln & chai" meta="TONITE · 6:30" tint="terra" tilt="tilt-ll" style={{ top: 10, left: -6, width: 130 }} />
          <FlyerPreview title="Run club" meta="SAT · 6 AM" tint="sage" tilt="tilt-rr" style={{ top: 4, right: -6, width: 128 }} />
          <FlyerPreview title="Open mic" meta="FRI · 8 PM" tint="plum" tilt="tilt-l" style={{ top: 190, left: '50%', width: 140, transform: 'translateX(-50%)' }} />
          <div style={{
            position: 'absolute', top: 150, left: 20, transform: 'rotate(-6deg)',
            fontFamily: 'var(--font-caveat), cursive', fontWeight: 600,
            fontSize: 18, color: 'var(--terra)', lineHeight: 1.3,
          }}>
            ↙ real<br />&nbsp;&nbsp;events
          </div>
        </div>

        {/* Form */}
        <div style={{
          background: 'var(--paper-card)', border: '1.5px solid var(--ink)',
          boxShadow: '3px 3px 0 var(--ink)', padding: 20,
          position: 'relative',
        }}>
          <span style={{ position: 'absolute', top: -9, left: '40%', width: 58, height: 18, background: 'rgba(212,167,58,0.45)', borderLeft: '1px dashed rgba(35,28,21,.25)', borderRight: '1px dashed rgba(35,28,21,.25)', transform: 'rotate(2deg)', zIndex: 2 }} />

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--ink-soft)' }}>EMAIL</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--ink-soft)' }}>PASSWORD</label>
                <Link href="/forgot-password" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--terra)', textDecoration: 'none' }}>
                  FORGOT?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>

            {error && (
              <div style={{
                padding: '8px 12px', background: 'rgba(200,85,54,0.1)',
                border: '1.5px solid var(--terra)', color: 'var(--terra)',
                fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 4, padding: '13px 18px',
                background: loading ? 'var(--ink-faint)' : 'var(--terra)',
                border: '1.5px solid var(--terra-deep)',
                boxShadow: loading ? 'none' : '2px 2px 0 var(--terra-deep)',
                color: 'var(--cream)',
                fontFamily: 'var(--font-mono), monospace', fontSize: 11,
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em',
                cursor: loading ? 'default' : 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {loading ? 'SIGNING IN…' : 'SIGN IN → OPEN THE WALL'}
            </button>
          </form>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--ink-soft)' }}>NEW HERE?</span>
          <Link href="/register" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--terra)', textDecoration: 'none', fontWeight: 700 }}>
            CREATE ACCOUNT →
          </Link>
        </div>
      </div>
    </div>
  );
}
