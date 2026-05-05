'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com';

if (typeof window !== 'undefined' && POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    // Never send cookies — use localStorage instead (more privacy-friendly)
    persistence: 'localStorage',
    autocapture: false, // manual events only — prevents PII leakage via autocapture
    sanitize_properties: (props) => {
      // Strip any accidental PII that might appear in captured properties
      const blocked = ['password', 'token', 'secret', 'key', 'auth'];
      const clean: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(props)) {
        if (!blocked.some((b) => k.toLowerCase().includes(b))) clean[k] = v;
      }
      return clean;
    },
  });
}

function SessionSync() {
  const { data: session, status } = useSession();
  const ph = usePostHog();

  useEffect(() => {
    if (!ph) return;
    if (status === 'authenticated' && session?.user) {
      const user = session.user as { id?: string; email?: string };
      if (user.id) {
        // Identify without PII — only the user ID; email is omitted
        ph.identify(user.id);
      }
    } else if (status === 'unauthenticated') {
      ph.reset();
    }
  }, [status, session, ph]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (!POSTHOG_KEY) return <>{children}</>;

  return (
    <PHProvider client={posthog}>
      <SessionSync />
      {children}
    </PHProvider>
  );
}
