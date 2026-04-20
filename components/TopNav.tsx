'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, UserCircle2, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS: { href: string; label: string; highlight?: boolean }[] = [
  { href: '/discover',   label: 'Feed' },
  { href: '/map',        label: 'Map' },
  { href: '/events/new', label: 'Create Event', highlight: true },
];

export function TopNav() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-gradient-to-b from-[#161311] to-transparent">
        <div className="flex justify-between items-center px-6 py-5 sm:px-12 sm:py-6 w-full max-w-screen-2xl mx-auto">

          {/* Logo */}
          <Link
            href="/"
            className="text-2xl sm:text-3xl font-bold font-headline text-primary tracking-widest hover:text-tertiary transition-colors duration-300"
          >
            ILLAKA
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map(({ href, label, highlight }) => {
              const isActive = href === '/discover'
                ? pathname === '/discover' || pathname === '/'
                : pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    'font-label uppercase tracking-widest text-[10px] transition-colors duration-300 active:scale-95',
                    highlight
                      ? 'text-primary border-b-2 border-primary pb-0.5 hover:text-tertiary hover:border-tertiary'
                      : isActive
                      ? 'text-primary'
                      : 'text-on-surface/60 hover:text-tertiary',
                  ].join(' ')}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-5">
            <button
              className="text-primary hover:text-tertiary transition-colors duration-300 active:scale-95 hidden sm:block"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <Link
              href="/profile"
              className="text-primary hover:text-tertiary transition-colors duration-300 active:scale-95"
              aria-label="Profile"
            >
              <UserCircle2 className="h-5 w-5" strokeWidth={1.5} />
            </Link>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-primary hover:text-tertiary transition-colors active:scale-95"
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.14 }}>
                    <X className="h-5 w-5" strokeWidth={1.5} />
                  </motion.span>
                ) : (
                  <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.14 }}>
                    <Menu className="h-5 w-5" strokeWidth={1.5} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-[72px] inset-x-0 z-40 bg-surface-container-lowest border-b border-outline-variant/30 px-6 py-6 md:hidden"
          >
            <div className="flex flex-col gap-5 max-w-screen-2xl mx-auto">
              {NAV_LINKS.map(({ href, label, highlight }) => {
                const isActive = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={[
                      'font-label uppercase tracking-widest text-[11px] transition-colors duration-200',
                      highlight || isActive ? 'text-primary' : 'text-on-surface/60 hover:text-tertiary',
                    ].join(' ')}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
