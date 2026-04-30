'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

function WallNote({ text, style }: { text: string; style: React.CSSProperties }) {
  return (
    <div style={{
      position: 'absolute',
      fontFamily: 'var(--font-caveat), cursive',
      fontWeight: 600,
      fontSize: 16,
      color: 'var(--terra)',
      lineHeight: 1.3,
      ...style,
    }}>
      {text}
    </div>
  );
}

function TicketStrip({ tint, title, meta, style, tilt }: {
  tint: string; title: string; meta: string;
  style: React.CSSProperties; tilt: string;
}) {
  const bg = tint === 'mustard'
    ? 'linear-gradient(135deg,rgba(212,167,58,.3),rgba(180,140,30,.15))'
    : tint === 'sage'
    ? 'linear-gradient(135deg,rgba(108,125,87,.3),rgba(80,95,65,.15))'
    : 'linear-gradient(135deg,rgba(90,125,138,.3),rgba(60,95,110,.15))';

  return (
    <div className={tilt} style={{
      position: 'absolute', ...style,
      background: 'var(--paper-card)',
      border: '1.5px solid var(--ink)',
      boxShadow: '2px 2px 0 var(--ink)',
      padding: '6px 10px',
      display: 'flex', gap: 8, alignItems: 'center',
    }}>
      <div style={{ width: 28, height: 28, background: bg, border: `1px solid var(--${tint})`, flexShrink: 0 }} />
      <div>
        <div style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 600, fontSize: 13, lineHeight: 1.1, color: 'var(--ink)' }}>{title}</div>
        <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--ink-soft)', marginTop: 2 }}>{meta}</div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        let data: any = null;
        try { data = await res.json(); } catch { data = null; }
        setError(data?.error ?? 'Unable to register');
        return;
      }
      const signInRes = await signIn('credentials', { email, password, redirect: false, callbackUrl: '/' });
      if (signInRes?.error) {
        setError('Account created — please sign in manually.');
        return;
      }
      window.location.href = signInRes?.url ?? '/';
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 14px', boxSizing: 'border-box',
    border: '1.5px solid var(--ink)', background: 'var(--paper-2)',
    fontFamily: 'var(--font-mono), monospace', fontSize: 12,
    color: 'var(--ink)', outline: 'none', borderRadius: 0,
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
        }}>i</div>
        <span style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 600, fontSize: 26, letterSpacing: '-0.02em' }}>
          illaka
        </span>
      </div>

      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Headline */}
        <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'var(--ink-soft)' }}>
          NEW HERE? JOIN IN.
        </span>
        <h1 style={{
          fontFamily: 'var(--font-fraunces), serif', fontWeight: 600,
          fontSize: 'clamp(36px, 9vw, 52px)', lineHeight: 0.93,
          letterSpacing: '-0.025em', marginTop: 6,
        }}>
          find your
          <br />
          <span style={{ fontFamily: 'var(--font-serif), serif', fontStyle: 'italic', color: 'var(--terra)' }}>
            corner.
          </span>
        </h1>
        <p style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: 'var(--ink-soft)', marginTop: 12, lineHeight: 1.6 }}>
          CREATE AN ACCOUNT TO DISCOVER AND HOST LOCAL MOMENTS.
        </p>

        {/* Decorative ticket strip collage */}
        <div style={{ position: 'relative', height: 140, margin: '18px 0' }}>
          <TicketStrip title="Morning run" meta="SAT · 6AM · CUBBON" tint="sage" tilt="tilt-ll" style={{ top: 8, left: -4, width: 190 }} />
          <TicketStrip title="Book swap" meta="SUN · 11AM · HSR" tint="mustard" tilt="tilt-rr" style={{ top: 4, right: -4, width: 180 }} />
          <TicketStrip title="Chai & chat" meta="TONITE · 7PM · KORAMANGALA" tint="sky" tilt="tilt-l" style={{ top: 78, left: '50%', width: 210, transform: 'translateX(-50%)' }} />
          <WallNote text="↙ join them" style={{ bottom: 4, left: 16 }} />
        </div>

        {/* Form */}
        <div style={{
          background: 'var(--paper-card)', border: '1.5px solid var(--ink)',
          boxShadow: '3px 3px 0 var(--ink)', padding: 20, position: 'relative',
        }}>
          <span style={{ position: 'absolute', top: -9, left: '35%', width: 70, height: 18, background: 'rgba(212,167,58,0.45)', borderLeft: '1px dashed rgba(35,28,21,.25)', borderRight: '1px dashed rgba(35,28,21,.25)', transform: 'rotate(-2deg)', zIndex: 2 }} />

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--ink-soft)' }}>YOUR NAME</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="What should we call you?"
                style={inputStyle}
              />
            </div>
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
              <label style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--ink-soft)' }}>PASSWORD</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
              />
              <span style={{ fontSize: 9, color: 'var(--ink-soft)', letterSpacing: '0.08em', lineHeight: 1.5 }}>
                Min 8 chars · one uppercase · one number · one special character
              </span>
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
              {loading ? 'CREATING…' : 'CLAIM YOUR SPOT →'}
            </button>
          </form>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--ink-soft)' }}>ALREADY IN?</span>
          <Link href="/login" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--terra)', textDecoration: 'none', fontWeight: 700 }}>
            SIGN IN →
          </Link>
        </div>
      </div>
    </div>
  );
}
