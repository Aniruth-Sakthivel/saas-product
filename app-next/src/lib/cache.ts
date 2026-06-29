import "server-only";

/**
 * Minimal swappable cache. Defaults to an in-process TTL map — zero dependencies
 * and correct for a single Node instance. When the app scales to multiple
 * instances (see docs/SCALING.md), replace `backend` with a Redis-backed
 * implementation of `CacheBackend`; call sites using `cached()` don't change.
 */
export interface CacheBackend {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
}

class MemoryCache implements CacheBackend {
  private store = new Map<string, { value: unknown; expires: number }>();

  async get<T>(key: string): Promise<T | undefined> {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expires < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

export const cache: CacheBackend = new MemoryCache();

/**
 * Returns the cached value for `key`, or runs `loader`, caches, and returns it.
 * Use for expensive, tolerably-stale reads (cross-tenant aggregates, catalogs).
 * Do NOT use for per-request authorization decisions.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const existing = await cache.get<T>(key);
  if (existing !== undefined) return existing;
  const value = await loader();
  await cache.set(key, value, ttlSeconds);
  return value;
}
