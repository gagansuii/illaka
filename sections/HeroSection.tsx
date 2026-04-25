'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { MapPin, Map, LayoutList, ArrowRight } from 'lucide-react';
import { SmokeLayer } from '@/components/SmokeLayer';

const TAGS = [
  { label: 'Run Clubs',       icon: '⚡' },
  { label: 'Art Workshops',   icon: '🎨' },
  { label: 'Skill Swaps',     icon: '🔄' },
  { label: 'Street Food',     icon: '🍜' },
  { label: 'Open Mics',       icon: '🎤' },
] as const;

/* ── Reusable funky button with click-position ripple ── */
function HeritageButton({
  href,
  variant = 'primary',
  children,
}: {
  href: string;
  variant?: 'primary' | 'ghost';
  children: React.ReactNode;
}) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const addRipple = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id   = Date.now();
    setRipples(r => [...r, {
      id,
      x: ((e.clientX - rect.left) / rect.width)  * 100,
      y: ((e.clientY - rect.top)  / rect.height) * 100,
    }]);
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 750);
  };

  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.03, y: -3 }}
      whileTap={{ scale: 0.97, y: 0 }}
      transition={{ type: 'spring', stiffness: 440, damping: 20 }}
      onClick={addRipple}
      className={`heritage-btn heritage-btn--${variant}`}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {ripples.map(rp => (
        <span
          key={rp.id}
          className="heritage-btn__ripple"
          style={{ left: `${rp.x}%`, top: `${rp.y}%` }}
        />
      ))}
    </motion.a>
  );
}

/* ── Animated Feed / Map toggle ── */
function ViewToggle() {
  const [active, setActive] = useState<'feed' | 'map'>('feed');

  return (
    <div className="heritage-toggle" role="tablist">
      {(['feed', 'map'] as const).map(v => (
        <button
          key={v}
          role="tab"
          aria-selected={active === v}
          onClick={() => setActive(v)}
          className={`heritage-toggle__btn${active === v ? ' active' : ''}`}
        >
          {active === v && (
            <motion.span
              layoutId="heritage-toggle-pill"
              className="heritage-toggle__pill"
              transition={{ type: 'spring', stiffness: 520, damping: 32 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            {v === 'feed' ? <LayoutList className="h-3 w-3" /> : <Map className="h-3 w-3" />}
            {v === 'feed' ? 'Feed' : 'Map'}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ── Main hero ── */
export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const smooth = useSpring(scrollYProgress, { stiffness: 55, damping: 22, restDelta: 0.001 });

  const imageY    = useTransform(smooth, [0, 1], ['0%', '18%']);
  const contentY  = useTransform(smooth, [0, 0.5], ['0%', '-14%']);
  const contentOp = useTransform(smooth, [0, 0.4], [1, 0]);
  const hintOp    = useTransform(smooth, [0, 0.14], [1, 0]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{ height: '100svh', minHeight: '680px', background: '#161311' }}
    >
      {/* Full-bleed parallax photo */}
      <motion.div
        style={{ y: imageY, height: '118%' }}
        className="absolute inset-x-0 top-0 will-change-transform"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ui-image.jpeg"
          alt=""
          className="w-full h-full object-cover object-[center_28%]"
          draggable={false}
          fetchPriority="high"
        />
      </motion.div>

      {/* Heritage gradient overlay — transparent → #161311 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(22,19,17,0) 0%, rgba(22,19,17,0.18) 38%, rgba(22,19,17,0.72) 68%, rgba(22,19,17,1) 100%)',
          zIndex: 2,
        }}
      />

      {/* Vignette sides */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 42%, rgba(22,19,17,0.55) 100%)',
          zIndex: 2,
        }}
      />

      {/* Grain */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.038'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
          mixBlendMode: 'overlay',
          zIndex: 3,
        }}
      />

      {/* ── Bottom content block ── */}
      <motion.div
        style={{ y: contentY, opacity: contentOp, zIndex: 10 }}
        className="absolute bottom-0 left-0 w-full px-6 pb-16 sm:px-12 sm:pb-20 max-w-screen-2xl mx-auto"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-16">

          {/* Left: eyebrow + headline + tags */}
          <div className="max-w-3xl">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
              className="heritage-eyebrow mb-5"
            >
              <MapPin className="inline h-2.5 w-2.5 mr-1.5" />
              Discover your neighbourhood
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
              className="font-headline italic text-on-surface tracking-tighter leading-[0.9] mt-5 mb-6"
              style={{ fontSize: 'clamp(3rem, 8vw, 7rem)' }}
            >
              More alive than<br className="hidden sm:block" /> you think.
            </motion.h1>

            {/* Tags */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55 }}
              className="flex flex-wrap gap-2 mb-0 md:mb-0"
            >
              {TAGS.map((tag, i) => (
                <motion.button
                  key={tag.label}
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.32, delay: 0.58 + i * 0.065 }}
                  whileHover={{ scale: 1.06, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className="heritage-tag"
                >
                  <span aria-hidden>{tag.icon}</span>
                  {tag.label}
                </motion.button>
              ))}
            </motion.div>
          </div>

          {/* Right: toggle + CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.42 }}
            className="flex flex-col gap-4 md:items-end shrink-0"
          >
            <ViewToggle />
            <div className="flex flex-wrap gap-3">
              <HeritageButton href="/discover" variant="primary">
                Explore events
                <ArrowRight className="h-3.5 w-3.5" />
              </HeritageButton>
              <HeritageButton href="/events/new" variant="ghost">
                Host something
              </HeritageButton>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Smoke */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 8, pointerEvents: 'none' }}>
        <SmokeLayer />
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        style={{ opacity: hintOp, zIndex: 15 }}
        className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center"
      >
        <motion.svg
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="h-5 w-5 text-on-surface/30"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </motion.div>
    </div>
  );
}
