'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CoffeeRouteLoader } from '@/components/CoffeeRouteLoader';

type RouteTransitionContextValue = {
  isTransitioning: boolean;
  navigate: (href: string) => void;
  startTransition: () => void;
};

const RouteTransitionContext = createContext<RouteTransitionContextValue | null>(null);

const MIN_VISIBLE_MS = 700;
const FAILSAFE_MS = 8000;

// Isolated component so useSearchParams() is contained inside a Suspense boundary,
// preventing it from blocking static generation of pages that use this provider.
function RouteChangeDetector({
  isTransitioning,
  onFinish
}: {
  isTransitioning: boolean;
  onFinish: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isTransitioning) return;
    onFinish();
  }, [pathname, searchParams, isTransitioning, onFinish]);

  return null;
}

export function RouteTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionStartedAtRef = useRef(0);
  const failsafeTimeoutRef = useRef<number | null>(null);

  const clearFailsafe = useCallback(() => {
    if (failsafeTimeoutRef.current !== null) {
      window.clearTimeout(failsafeTimeoutRef.current);
      failsafeTimeoutRef.current = null;
    }
  }, []);

  const finishTransition = useCallback(() => {
    const elapsed = Date.now() - transitionStartedAtRef.current;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

    window.setTimeout(() => {
      setIsTransitioning(false);
      clearFailsafe();
    }, remaining);
  }, [clearFailsafe]);

  const startTransition = useCallback(() => {
    transitionStartedAtRef.current = Date.now();
    setIsTransitioning(true);
    clearFailsafe();
    failsafeTimeoutRef.current = window.setTimeout(() => {
      setIsTransitioning(false);
      failsafeTimeoutRef.current = null;
    }, FAILSAFE_MS);
  }, [clearFailsafe]);

  const navigate = useCallback(
    (href: string) => {
      startTransition();
      router.push(href);
    },
    [router, startTransition]
  );

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      const rawHref = anchor.getAttribute('href');
      if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) return;

      const nextUrl = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);

      if (nextUrl.origin !== currentUrl.origin) return;
      if (nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search) return;

      startTransition();
    }

    document.addEventListener('click', handleDocumentClick, true);

    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, [startTransition]);

  useEffect(() => {
    return () => {
      clearFailsafe();
    };
  }, [clearFailsafe]);

  const value = useMemo(
    () => ({
      isTransitioning,
      navigate,
      startTransition
    }),
    [isTransitioning, navigate, startTransition]
  );

  return (
    <RouteTransitionContext.Provider value={value}>
      <Suspense fallback={null}>
        <RouteChangeDetector isTransitioning={isTransitioning} onFinish={finishTransition} />
      </Suspense>
      {children}
      <AnimatePresence>
        {isTransitioning ? (
          <motion.div
            key="route-transition-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ willChange: 'opacity' }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(245,237,226,0.88)] px-4 dark:bg-[rgba(9,13,19,0.88)]"
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -18, scale: 0.98 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="route-loader-panel"
              aria-live="polite"
              aria-busy="true"
            >
              <div className="route-loader-panel__glow" />
              <div className="route-loader-panel__content">
                <p className="route-loader-panel__eyebrow">Brewing the next stop</p>
                <CoffeeRouteLoader />
                <p className="route-loader-panel__title">Preparing your Ilaaka view</p>
                <p className="route-loader-panel__body">
                  Pouring in the next page with a smoother neighborhood transition.
                </p>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </RouteTransitionContext.Provider>
  );
}

export function useRouteTransition() {
  const context = useContext(RouteTransitionContext);

  if (!context) {
    throw new Error('useRouteTransition must be used within RouteTransitionProvider.');
  }

  return context;
}
