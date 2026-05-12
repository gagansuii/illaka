import { logger } from '@/src/core/logger';

export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onFailure?: (err: unknown, attempt: number) => void;
}

/**
 * Retry an async operation with exponential back-off.
 * Does NOT throw — logs the final failure and returns undefined.
 */
export async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T | undefined> {
  const { attempts = 3, baseDelayMs = 500, maxDelayMs = 8_000 } = opts;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      opts.onFailure?.(err, i + 1);
      const isLast = i === attempts - 1;
      if (isLast) {
        logger.error(`[retry] ${label} failed after ${attempts} attempts`, { error: String(err) });
        return undefined;
      }
      const delay = Math.min(baseDelayMs * 2 ** i, maxDelayMs);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}
