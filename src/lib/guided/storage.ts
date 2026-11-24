/**
 * Web stand-in for binectics-mobile src/utils/cache.ts (AsyncStorage) used by
 * the guided-session modules: the same TTL envelope and `cache_` prefix, on
 * localStorage. Every access is wrapped: storage can be missing, full or
 * blocked (private windows, previews), and none of that may break a session.
 * The API stays async so the ported modules are unchanged.
 */
const DEFAULT_TTL = 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

function store(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export async function getCached<T>(key: string): Promise<T | null> {
  return getCachedSync<T>(key);
}

export function getCachedSync<T>(key: string): T | null {
  try {
    const s = store();
    const raw = s?.getItem(`cache_${key}`);
    if (!s || !raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.timestamp > entry.ttl) {
      s.removeItem(`cache_${key}`);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export async function setCache<T>(key: string, data: T, ttl = DEFAULT_TTL): Promise<void> {
  setCacheSync(key, data, ttl);
}

export function setCacheSync<T>(key: string, data: T, ttl = DEFAULT_TTL): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl };
    store()?.setItem(`cache_${key}`, JSON.stringify(entry));
  } catch {
    /* storage full or blocked: not critical */
  }
}

export async function clearCache(key: string): Promise<void> {
  try {
    store()?.removeItem(`cache_${key}`);
  } catch {
    /* nothing saved */
  }
}
