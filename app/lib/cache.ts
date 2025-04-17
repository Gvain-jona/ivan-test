'use client';

// Default cache TTLs
export const CACHE_TTL = {
  SHORT: 5 * 60 * 1000,    // 5 minutes
  MEDIUM: 15 * 60 * 1000,  // 15 minutes
  LONG: 60 * 60 * 1000,    // 1 hour
  EXTENDED: 4 * 60 * 60 * 1000, // 4 hours
};

// Type for cached items with metadata
type CachedItem<T> = {
  value: T;
  expiry: number;
  timestamp: number; // When the item was cached
  version: string;   // Cache version for invalidation
  size?: number;     // Approximate size in bytes
};

// Current cache version - increment this when data structure changes
const CACHE_VERSION = '1.0.1';

// Maximum cache size in bytes (5MB)
const MAX_CACHE_SIZE = 5 * 1024 * 1024;

// Debug mode flag - set to false in production
const DEBUG = process.env.NODE_ENV !== 'production';

// Log only in debug mode
const debugLog = (...args: any[]) => {
  if (DEBUG) {
    console.log(...args);
  }
};

/**
 * Estimate the size of an object in bytes
 * @param obj The object to measure
 * @returns Approximate size in bytes
 */
function getApproximateSize(obj: any): number {
  const jsonString = JSON.stringify(obj);
  return jsonString.length * 2; // Rough estimate: 2 bytes per character
}

/**
 * Get an item from the cache with improved error handling and logging
 * @param key The cache key
 * @param ttl Time to live in milliseconds (default: 15 minutes)
 * @returns The cached value or null if not found or expired
 */
export function getCachedData<T>(key: string, ttl = CACHE_TTL.MEDIUM): T | null {
  // Only run in browser environment
  if (typeof window === 'undefined') return null;

  try {
    const item = localStorage.getItem(`cache_${key}`);
    if (!item) return null;

    let parsedItem: CachedItem<T>;

    try {
      parsedItem = JSON.parse(item) as CachedItem<T>;
    } catch (parseError) {
      console.warn(`Invalid cache format for key ${key}, removing item`);
      localStorage.removeItem(`cache_${key}`);
      return null;
    }

    const { value, expiry, version = '0.0.0' } = parsedItem;

    // Check if the cache version matches
    if (version !== CACHE_VERSION) {
      debugLog(`Cache version mismatch for ${key}, removing outdated cache`);
      localStorage.removeItem(`cache_${key}`);
      return null;
    }

    // Check if the item has expired
    if (Date.now() > expiry) {
      debugLog(`Cache expired for ${key}, removing item`);
      localStorage.removeItem(`cache_${key}`);
      return null;
    }

    // Log cache hit in debug mode only
    debugLog(`Cache hit for ${key}, expires in ${Math.round((expiry - Date.now()) / 1000)}s`);
    return value;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
}

/**
 * Set an item in the cache with improved metadata and size management
 * @param key The cache key
 * @param value The value to cache
 * @param ttl Time to live in milliseconds (default: 15 minutes)
 * @param priority Whether this item should be prioritized during cache cleanup
 */
export function setCachedData<T>(
  key: string,
  value: T,
  ttl = CACHE_TTL.MEDIUM,
  priority = false
): void {
  // Only run in browser environment
  if (typeof window === 'undefined') return;

  try {
    // Don't cache null or undefined values
    if (value === null || value === undefined) {
      debugLog(`Attempted to cache null/undefined value for ${key}, skipping`);
      return;
    }

    // Calculate approximate size
    const size = getApproximateSize(value);

    // Skip if item is too large (over 1MB)
    if (size > 1024 * 1024) {
      console.warn(`Item ${key} is too large (${Math.round(size / 1024)}KB), not caching`);
      return;
    }

    // Check if we need to make room in the cache
    ensureCacheSpace(size, priority ? key : undefined);

    const now = Date.now();
    const item: CachedItem<T> = {
      value,
      expiry: now + ttl,
      timestamp: now,
      version: CACHE_VERSION,
      size
    };

    localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    debugLog(`Cached data for ${key}, expires in ${Math.round(ttl / 1000)}s, size: ${Math.round(size / 1024)}KB`);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded, clearing non-essential cache items');
      clearOldestCacheItems(5);
    } else {
      console.error('Error writing to cache:', error);
    }
  }
}

/**
 * Ensure there's enough space in the cache for a new item
 * @param requiredSize Size in bytes needed
 * @param priorityKey Key to preserve during cleanup
 */
function ensureCacheSpace(requiredSize: number, priorityKey?: string): void {
  try {
    // Get current cache size
    let totalSize = 0;
    const cacheItems: Array<{key: string, size: number, expiry: number, timestamp: number}> = [];

    // Collect all cache items and their metadata
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cache_')) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const parsed = JSON.parse(item);
            const itemSize = parsed.size || getApproximateSize(parsed.value);
            totalSize += itemSize;

            // Skip priority key
            if (priorityKey && key === `cache_${priorityKey}`) continue;

            cacheItems.push({
              key,
              size: itemSize,
              expiry: parsed.expiry,
              timestamp: parsed.timestamp
            });
          } catch (e) {
            // Invalid item, remove it
            localStorage.removeItem(key);
          }
        }
      }
    }

    // If we're approaching the limit, remove items until we have enough space
    if (totalSize + requiredSize > MAX_CACHE_SIZE) {
      debugLog(`Cache cleanup needed: ${Math.round(totalSize / 1024)}KB used, need ${Math.round(requiredSize / 1024)}KB more`);

      // Sort by expiry (expired first), then by timestamp (oldest first)
      cacheItems.sort((a, b) => {
        const now = Date.now();
        const aExpired = a.expiry < now;
        const bExpired = b.expiry < now;

        // Expired items first
        if (aExpired && !bExpired) return -1;
        if (!aExpired && bExpired) return 1;

        // Then sort by timestamp (oldest first)
        return a.timestamp - b.timestamp;
      });

      // Remove items until we have enough space
      let removedSize = 0;
      for (const item of cacheItems) {
        localStorage.removeItem(item.key);
        removedSize += item.size;
        debugLog(`Removed cache item ${item.key}, freed ${Math.round(item.size / 1024)}KB`);

        if (removedSize >= requiredSize) {
          break;
        }
      }
    }
  } catch (error) {
    console.error('Error ensuring cache space:', error);
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
    debugLog(`Removed cache item ${key}`);
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
    let count = 0;
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
        count++;
      }
    });
    console.log(`Cleared ${count} items from cache`);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Clear only expired cache items
 * @returns Number of items cleared
 */
export function clearExpiredCache(): number {
  // Only run in browser environment
  if (typeof window === 'undefined') return 0;

  try {
    let count = 0;
    const now = Date.now();
    const keys = Object.keys(localStorage);

    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            if (parsed.expiry < now) {
              localStorage.removeItem(key);
              count++;
            }
          }
        } catch (e) {
          // Invalid item, remove it
          localStorage.removeItem(key);
          count++;
        }
      }
    });

    debugLog(`Cleared ${count} expired items from cache`);
    return count;
  } catch (error) {
    console.error('Error clearing expired cache:', error);
    return 0;
  }
}

/**
 * Clear the oldest cache items
 * @param count Number of items to clear
 * @returns Number of items actually cleared
 */
export function clearOldestCacheItems(count: number): number {
  // Only run in browser environment
  if (typeof window === 'undefined') return 0;

  try {
    // Get all cache items with their timestamps
    const items: Array<{key: string, timestamp: number}> = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cache_')) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            items.push({
              key,
              timestamp: parsed.timestamp || 0
            });
          }
        } catch (e) {
          // Invalid item, add it to be removed
          items.push({
            key,
            timestamp: 0
          });
        }
      }
    }

    // Sort by timestamp (oldest first)
    items.sort((a, b) => a.timestamp - b.timestamp);

    // Remove the oldest items
    const itemsToRemove = items.slice(0, count);
    itemsToRemove.forEach(item => {
      localStorage.removeItem(item.key);
    });

    debugLog(`Cleared ${itemsToRemove.length} oldest items from cache`);
    return itemsToRemove.length;
  } catch (error) {
    console.error('Error clearing oldest cache items:', error);
    return 0;
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

/**
 * Get the current cache size in bytes
 * @returns Total size in bytes
 */
export function getCacheSize(): number {
  // Only run in browser environment
  if (typeof window === 'undefined') return 0;

  try {
    let totalSize = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cache_')) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const parsed = JSON.parse(item);
            totalSize += parsed.size || getApproximateSize(parsed.value);
          } catch (e) {
            // Invalid item
            totalSize += item.length * 2;
          }
        }
      }
    }

    return totalSize;
  } catch (error) {
    console.error('Error getting cache size:', error);
    return 0;
  }
}
