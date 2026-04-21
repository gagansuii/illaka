'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, ArrowRight, Compass, Map, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TopNav() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6 lg:px-8">
      <div className={`mx-auto flex max-w-7xl items-center justify-between gap-2 rounded-[1.75rem] border px-3 py-2.5 backdrop-blur-xl sm:gap-4 sm:px-4 sm:py-3 ${isHome ? 'border-white/35 bg-[rgba(255,252,247,0.72)] shadow-[0_20px_60px_rgba(17,24,39,0.08)] dark:border-white/10 dark:bg-[rgba(15,23,42,0.72)]' : 'border-[var(--line)] bg-[var(--surface-strong)] shadow-[0_20px_60px_rgba(17,24,39,0.12)]'}`}>
        {/* Logo */}
        <Link href="/" className="min-w-0 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--secondary)_0%,var(--accent)_100%)] text-white shadow-[0_8px_20px_rgba(15,118,110,0.22)] sm:h-11 sm:w-11 sm:rounded-2xl">
              <Compass className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <p className="font-[family:var(--font-fraunces)] text-lg leading-none sm:text-xl">
              ILAKA
            </p>
          </div>
        </Link>

        {/* Nav actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Desktop: back/forward */}
          <div className="hidden items-center gap-1 rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.4)] p-1 sm:flex dark:bg-[rgba(15,23,42,0.32)]">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => window.history.back()} aria-label="Go back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => window.history.forward()} aria-label="Go forward">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Desktop action buttons */}
          {isHome ? (
            <>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/discover">
                  <Map className="h-4 w-4" />
                  Explore Map
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
                <Link href="/events/new">Host Event</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/events/new">Host Event</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
                <Link href="/">Home</Link>
              </Button>
            </>
          )}

          {/* Mobile: two visible tap targets */}
          <Button asChild variant="outline" size="sm" className="h-9 px-3 text-xs sm:hidden">
            <Link href={isHome ? '/discover' : '/events/new'}>{isHome ? 'Map' : 'Host'}</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-9 px-3 text-xs sm:hidden">
            <Link href={isHome ? '/events/new' : '/'}>{isHome ? 'Host' : 'Home'}</Link>
          </Button>

          <Button asChild variant="ghost" size="sm" className="h-9 w-9 shrink-0 rounded-full p-0 sm:h-10 sm:w-10" aria-label="Profile">
            <Link href="/profile">
              <User className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
