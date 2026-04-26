'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function BottomNav() {
  const pathname = usePathname();

  const active = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {/* Home */}
      <Link href="/" className={`bottom-nav-item ${pathname === '/' ? 'active' : ''}`} aria-label="Home">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11l9-8 9 8v10a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1V11z" />
        </svg>
        <span>home</span>
      </Link>

      {/* Map / Discover */}
      <Link href="/discover" className={`bottom-nav-item ${active('/discover') ? 'active' : ''}`} aria-label="Map">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2z" />
          <path d="M9 4v16M15 6v16" />
        </svg>
        <span>map</span>
      </Link>

      {/* Host (centre + button) */}
      <Link href="/events/new" className="bottom-nav-host" aria-label="Host event">
        <span style={{ lineHeight: 1, marginTop: -2 }}>＋</span>
      </Link>

      {/* Hood (placeholder — links to home for now) */}
      <Link href="/" className="bottom-nav-item" aria-label="Hood">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
        <span>hood</span>
      </Link>

      {/* Profile */}
      <Link href="/profile" className={`bottom-nav-item ${active('/profile') ? 'active' : ''}`} aria-label="Profile">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
        </svg>
        <span>you</span>
      </Link>
    </nav>
  );
}
