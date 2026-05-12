import { LRUCache } from 'lru-cache';
import { rateLimit } from './rate-limit';

// Sliding-window attempt counter (per email, 15-minute window)
// NOTE: In-process LRU is ephemeral per-instance. The Redis-backed rateLimit() call
// provides the cross-instance guard; this LRU adds a consecutive-failure lockout
// as a secondary layer that is best-effort across cold starts.
const failMap = new LRUCache<string, number>({ max: 10_000, ttl: 15 * 60 * 1000 });

const MAX_ATTEMPTS = 5;  // lock after 5 consecutive failures
const RATE_WINDOW = 10;  // max 10 attempts per 60-second window (via Redis)

export const loginGuard = {
  async isAllowed(email: string): Promise<boolean> {
    // 1. Sliding-window rate limit via Redis (cross-instance when Redis is configured)
    if (!(await rateLimit(`login:${email}`, RATE_WINDOW))) return false;

    // 2. Per-instance consecutive-failure lockout (best-effort; Redis rateLimit above is primary)
    const attempts = failMap.get(email) ?? 0;
    return attempts < MAX_ATTEMPTS;
  },

  recordFailure(email: string): void {
    const n = failMap.get(email) ?? 0;
    failMap.set(email, n + 1);
    // Also consume a rate-limit token asynchronously (cross-instance visibility)
    void rateLimit(`login:fail:${email}`, MAX_ATTEMPTS * 10);
  },

  recordSuccess(email: string): void {
    failMap.delete(email);
  },
};
