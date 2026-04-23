'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

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
            illaka
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

        {/* Mobile: search icon only (bottom nav handles the rest) */}
        <div className="flex sm:hidden items-center gap-2">
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
