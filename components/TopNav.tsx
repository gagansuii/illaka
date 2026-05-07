'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ width: 36, height: 36 }} />;
  const isDark = resolvedTheme === 'dark';
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: 36, height: 36,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1.5px solid var(--ink)',
        background: 'var(--paper-2)',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      {isDark ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
    </button>
  );
}

export function TopNav() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6 lg:px-8">
      <div
        className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5"
        style={{
          background: 'var(--paper-card)',
          border: '1.5px solid var(--ink)',
          boxShadow: '3px 3px 0 var(--ink)',
        }}
      >
        {/* Logo mark */}
        <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Home">
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'var(--terra)',
              border: '1.5px solid var(--ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cream)',
              fontFamily: 'var(--font-fraunces), serif',
              fontWeight: 700,
              fontSize: 16,
              position: 'relative',
            }}
          >
            i
          </div>
          <span
            style={{
              fontFamily: 'var(--font-fraunces), serif',
              fontWeight: 600,
              fontSize: 20,
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
            }}
          >
            ilaaka
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden sm:flex items-center gap-2">
          {isHome ? (
            <>
              <Link
                href="/discover"
                className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{
                  border: '1.5px solid var(--ink)',
                  background: 'var(--terra)',
                  color: 'var(--cream)',
                  boxShadow: '2px 2px 0 var(--terra-deep)',
                  fontFamily: 'var(--font-mono), monospace',
                }}
              >
                EXPLORE →
              </Link>
              <Link
                href="/events/new"
                className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{
                  border: '1.5px solid var(--ink)',
                  background: 'transparent',
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-mono), monospace',
                }}
              >
                HOST EVENT
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/events/new"
                className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{
                  border: '1.5px solid var(--ink)',
                  background: 'var(--terra)',
                  color: 'var(--cream)',
                  boxShadow: '2px 2px 0 var(--terra-deep)',
                  fontFamily: 'var(--font-mono), monospace',
                }}
              >
                HOST EVENT
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{
                  border: '1.5px solid var(--ink)',
                  background: 'transparent',
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-mono), monospace',
                }}
              >
                HOME
              </Link>
            </>
          )}

          <ThemeToggle />

          <Link
            href="/profile"
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ border: '1.5px solid var(--ink)', background: 'var(--paper-2)' }}
            aria-label="Profile"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
            </svg>
          </Link>
        </div>

        {/* Mobile: theme toggle + map icon (bottom nav handles the rest) */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle />
          <Link
            href="/discover"
            className="flex h-9 w-9 items-center justify-center"
            style={{ border: '1.5px solid var(--ink)', background: 'var(--paper-2)' }}
            aria-label="Map"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2z" />
              <path d="M9 4v16M15 6v16" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
