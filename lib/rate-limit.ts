import { LRUCache } from 'lru-cache';
import Redis from 'ioredis';

const cache = new LRUCache<string, number>({
  max: 5000,
  ttl: 1000 * 60
});

let redis: Redis | null = null;
let redisEnabled = Boolean(process.env.REDIS_URL);
let redisWarningShown = false;

// Warn loudly in production if Redis is absent — in-memory rate limiting is per-process
// and will be ineffective across multiple serverless instances.
if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
  console.warn(
    '[rate-limit] REDIS_URL is not set. Rate limiting is per-process only and WILL be ' +
    'ineffective across multiple serverless instances. Set REDIS_URL to fix this.',
  );
}

function disableRedis(err?: unknown) {
  if (!redisWarningShown) {
    redisWarningShown = true;
    if (err) {
      console.warn('Redis unavailable, falling back to in-memory rate limiting.', err);
    } else {
      console.warn('Redis unavailable, falling back to in-memory rate limiting.');
    }
  }

  redisEnabled = false;
  if (redis) {
    redis.disconnect();
    redis = null;
  }
}

function getRedis() {
  if (!redisEnabled || !process.env.REDIS_URL) {
    return null;
  }

  if (redis === null) {
    redis = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
      reconnectOnError: () => false
    });
    redis.on('error', (err) => {
      disableRedis(err);
    });
  }

  return redis;
}

// Prefer Redis when it is configured and reachable; otherwise use memory without spamming retries.
export async function rateLimit(key: string, limit = 60): Promise<boolean> {
  const r = getRedis();
  if (r) {
    try {
      if (r.status === 'wait') {
        await r.connect();
      }

      const count = await r.incr(key);
      if (count === 1) {
        await r.expire(key, 60);
      }
      return count <= limit;
    } catch (err) {
      disableRedis(err);
    }
  }

  const current = cache.get(key) ?? 0;
  if (current >= limit) return false;
  cache.set(key, current + 1);
  return true;
}
