/**
 * Analytics Cache Utility
 * 
 * This utility provides a simple in-memory cache for analytics data.
 * It's used to cache expensive analytics calculations to improve performance.
 */

// Define the cache entry type
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// Define the cache type
type Cache = {
  [key: string]: CacheEntry<any>;
};

// Create a simple in-memory cache
const cache: Cache = {};

/**
 * Get data from cache or fetch it if not available
 * 
 * @param key - Cache key
 * @param ttlSeconds - Time to live in seconds
 * @param fetchFn - Function to fetch data if not in cache
 * @returns Cached or freshly fetched data
 */
export async function getCachedData<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  
  // Check if data is in cache and not expired
  if (cache[key] && cache[key].expiresAt > now) {
    console.log(`Cache hit for key: ${key}`);
    return cache[key].data;
  }
  
  // Fetch fresh data
  console.log(`Cache miss for key: ${key}, fetching fresh data`);
  const data = await fetchFn();
  
  // Store in cache
  cache[key] = {
    data,
    expiresAt: now + (ttlSeconds * 1000)
  };
  
  return data;
}

/**
 * Invalidate a specific cache entry
 * 
 * @param key - Cache key to invalidate
 */
export function invalidateCache(key: string): void {
  if (cache[key]) {
    delete cache[key];
    console.log(`Invalidated cache for key: ${key}`);
  }
}

/**
 * Invalidate all cache entries
 */
export function invalidateAllCache(): void {
  Object.keys(cache).forEach(key => {
    delete cache[key];
  });
  console.log('Invalidated all cache entries');
}

/**
 * Get analytics cache key
 * 
 * @param endpoint - API endpoint
 * @param params - Query parameters
 * @returns Cache key
 */
export function getAnalyticsCacheKey(endpoint: string, params: Record<string, any>): string {
  const sortedParams = Object.entries(params)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
    
  return `${endpoint}?${sortedParams}`;
}
