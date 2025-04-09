'use client';

// Type for cached items
type CachedItem<T> = {
  value: T;
  expiry: number;
};

/**
 * Get an item from the cache
 * @param key The cache key
 * @param ttl Time to live in milliseconds (default: 5 minutes)
 * @returns The cached value or null if not found or expired
 */
export function getCachedData<T>(key: string, ttl = 300000): T | null {
  // Only run in browser environment
  if (typeof window === 'undefined') return null;
  
  try {
    const item = localStorage.getItem(`cache_${key}`);
    if (!item) return null;
    
    const { value, expiry } = JSON.parse(item) as CachedItem<T>;
    
    // Check if the item has expired
    if (Date.now() > expiry) {
      localStorage.removeItem(`cache_${key}`);
      return null;
    }
    
    return value;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
}

/**
 * Set an item in the cache
 * @param key The cache key
 * @param value The value to cache
 * @param ttl Time to live in milliseconds (default: 5 minutes)
 */
export function setCachedData<T>(key: string, value: T, ttl = 300000): void {
  // Only run in browser environment
  if (typeof window === 'undefined') return;
  
  try {
    const item: CachedItem<T> = {
      value,
      expiry: Date.now() + ttl,
    };
    
    localStorage.setItem(`cache_${key}`, JSON.stringify(item));
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
}

/**
 * Remove an item from the cache
 * @param key The cache key
 */
export function removeCachedData(key: string): void {
  // Only run in browser environment
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(`cache_${key}`);
  } catch (error) {
    console.error('Error removing from cache:', error);
  }
}

/**
 * Clear all cached data
 */
export function clearCache(): void {
  // Only run in browser environment
  if (typeof window === 'undefined') return;
  
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Get all cached keys
 * @returns Array of cache keys
 */
export function getCacheKeys(): string[] {
  // Only run in browser environment
  if (typeof window === 'undefined') return [];
  
  try {
    return Object.keys(localStorage)
      .filter(key => key.startsWith('cache_'))
      .map(key => key.replace('cache_', ''));
  } catch (error) {
    console.error('Error getting cache keys:', error);
    return [];
  }
}
