interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

type Cache = {
  [key: string]: CacheEntry<any>;
};

const cache: Cache = {};

export async function getCachedData<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const now = Date.now();

  if (cache[key] && cache[key].expiresAt > now) {
    return cache[key].data;
  }

  const data = await fetchFn();

  cache[key] = {
    data,
    expiresAt: now + (ttlSeconds * 1000)
  };

  return data;
}

export function invalidateCache(key: string): void {
  delete cache[key];
}

export function invalidateAllCache(): void {
  Object.keys(cache).forEach(key => delete cache[key]);
}

export function getAnalyticsCacheKey(endpoint: string, params: Record<string, any>): string {
  const sortedParams = Object.entries(params)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return `${endpoint}?${sortedParams}`;
}

/**
 * Parse startDate/endDate from URLSearchParams with a 30-day default window.
 */
export function parseAnalyticsDates(searchParams: URLSearchParams): { startDate: string; endDate: string } {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 29);
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const s = searchParams.get('startDate');
  const e = searchParams.get('endDate');

  return {
    startDate: s && s !== 'undefined' ? s : fmt(thirtyDaysAgo),
    endDate: e && e !== 'undefined' ? e : fmt(today),
  };
}
