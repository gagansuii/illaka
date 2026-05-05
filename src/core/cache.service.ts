type Entry<T> = { value: T; expiresAt: number };

class CacheService {
  private store = new Map<string, Entry<unknown>>();

  async getOrSet<T>(key: string, ttlMs: number, fetchFn: () => Promise<T>): Promise<T> {
    const entry = this.store.get(key) as Entry<T> | undefined;
    if (entry && entry.expiresAt > Date.now()) return entry.value;

    const value = await fetchFn();
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  }

  invalidate(key: string): void { this.store.delete(key); }
  invalidateAll(): void { this.store.clear(); }
}

export const cacheService = new CacheService();
