'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function EventError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[EventError]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/20">
        <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-semibold">Could not load event</h2>
        <p className="mt-1 text-sm text-muted max-w-sm">
          This event may not exist, or there was a problem loading it. Please try again.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset} variant="outline" size="sm">Try again</Button>
        <Button asChild size="sm">
          <a href="/discover">Back to feed</a>
        </Button>
      </div>
    </div>
  );
}
