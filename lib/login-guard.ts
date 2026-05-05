import { LRUCache } from 'lru-cache';
import { rateLimit } from './rate-limit';

// Sliding-window attempt counter (per email, 15-minute window)
const failMap = new LRUCache<string, number>({ max: 10_000, ttl: 15 * 60 * 1000 });

const MAX_ATTEMPTS = 5;        // lock after 5 consecutive failures
const RATE_WINDOW = 10;        // max 10 attempts per 60-second window (via rateLimit)

export const loginGuard = {
  async isAllowed(email: string): Promise<boolean> {
    // 1. Sliding-window rate limit via Redis/LRU (10 per minute)
    if (!(await rateLimit(`login:${email}`, RATE_WINDOW))) return false;

    // 2. Consecutive-failure lockout (in-process — good enough for single-process Vercel deployments)
    const attempts = failMap.get(email) ?? 0;
    return attempts < MAX_ATTEMPTS;
  },

  recordFailure(email: string): void {
    const n = failMap.get(email) ?? 0;
    failMap.set(email, n + 1);
  },

  recordSuccess(email: string): void {
    failMap.delete(email);
  },
};
