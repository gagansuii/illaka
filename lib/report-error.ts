'use client';

/**
 * Client-side error reporter. Sends errors to /api/errors (if configured)
 * and optionally to a third-party APM (Sentry, etc.) when the SDK is present.
 *
 * Usage: call reportError(err) from error.tsx / global-error.tsx
 */
export function reportError(error: Error & { digest?: string }): void {
  try {
    // Fire-and-forget POST to our own ingestion endpoint
    void fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        digest: error.digest,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        ts: new Date().toISOString(),
      }),
      // Don't block page interaction — best-effort only
      keepalive: true,
    });
  } catch {
    // Silently ignore — never let error reporting break the UI
  }
}
