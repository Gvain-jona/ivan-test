'use client';

import { clearExpiredCache, getCacheSize, clearOldestCacheItems } from './cache';

// Maximum cache size before cleanup (4MB)
const MAX_CACHE_SIZE_BEFORE_CLEANUP = 4 * 1024 * 1024;

// Cleanup interval (5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;

// Debug mode flag
const DEBUG = process.env.NODE_ENV !== 'production';

// Log only in debug mode
const debugLog = (...args: any[]) => {
  if (DEBUG) {
    console.log('[CacheCleanup]', ...args);
  }
};

let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Initialize the cache cleanup service
 * This should be called once when the app starts
 */
export function initCacheCleanupService(): void {
  // Only run in browser environment
  if (typeof window === 'undefined') return;

  // Clear any existing interval
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }

  // Run an initial cleanup
  runCacheCleanup();

  // Set up periodic cleanup
  cleanupInterval = setInterval(() => {
    runCacheCleanup();
  }, CLEANUP_INTERVAL);

  debugLog('Cache cleanup service initialized');
}

/**
 * Run the cache cleanup process
 * This removes expired items and ensures the cache size is within limits
 */
export function runCacheCleanup(): void {
  // Only run in browser environment
  if (typeof window === 'undefined') return;

  try {
    // First, clear expired items
    const expiredCount = clearExpiredCache();
    
    // Then check the cache size
    const cacheSize = getCacheSize();
    
    // If the cache is still too large, remove oldest items
    if (cacheSize > MAX_CACHE_SIZE_BEFORE_CLEANUP) {
      debugLog(`Cache size (${Math.round(cacheSize / 1024)}KB) exceeds limit, removing oldest items`);
      
      // Calculate how many items to remove (roughly 25% of the cache)
      const itemsToRemove = 5; // Start with a small number
      
      // Remove oldest items
      const removedCount = clearOldestCacheItems(itemsToRemove);
      
      debugLog(`Removed ${removedCount} oldest items from cache`);
    }
  } catch (error) {
    console.error('Error running cache cleanup:', error);
  }
}

/**
 * Stop the cache cleanup service
 * This should be called when the app is unmounted
 */
export function stopCacheCleanupService(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    debugLog('Cache cleanup service stopped');
  }
}
