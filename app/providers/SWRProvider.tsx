'use client';

import { SWRConfig } from 'swr';

/**
 * Standardized SWR Provider
 * This provider configures SWR with consistent settings across the application
 * It includes a robust fetcher function with proper error handling and caching strategies
 */

/**
 * Enhanced fetcher function with optimized caching, compression, and error handling
 * This fetcher is designed to maximize performance while maintaining reliability
 */
const fetcher = async (url: string) => {
  try {
    // Apply different caching strategies based on the endpoint
    const options: RequestInit = {
      // Add headers for better performance
      headers: {
        // Request compressed responses
        'Accept-Encoding': 'gzip, deflate, br',
        // Prefer JSON responses
        'Accept': 'application/json',
        // Add a cache buster for dynamic data to avoid browser cache issues
        ...(url.includes('/api/orders') || url.includes('/api/dashboard')
          ? { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
          : {})
      }
    };

    // Use different caching strategies based on the endpoint
    if (url.includes('/api/dropdown')) {
      // For dropdown data, which changes infrequently, use force-cache
      options.cache = 'force-cache';
      options.next = { revalidate: 3600 }; // Revalidate every hour
    } else if (url.includes('/api/dashboard')) {
      // For dashboard data, which changes more frequently, use default caching
      options.cache = 'default';
      options.next = { revalidate: 300 }; // Revalidate every 5 minutes
    } else if (url.includes('/api/orders')) {
      // For orders data, which changes frequently, use no-store
      options.cache = 'no-store';
    } else {
      // For other data, use default caching with shorter revalidation
      options.cache = 'default';
      options.next = { revalidate: 60 }; // Revalidate every minute
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    options.signal = controller.signal;

    // Make the request with the appropriate caching strategy
    const res = await fetch(url, options);

    // Clear the timeout
    clearTimeout(timeoutId);

    // Handle response status
    if (!res.ok) {
      // For 404 errors, return an empty array instead of throwing
      if (res.status === 404) {
        console.warn(`Resource not found: ${url}, returning empty array`);
        return [];
      }

      // For 500 errors on dropdown endpoints, return empty array to prevent cascading failures
      if (res.status === 500 && url.includes('/api/dropdown')) {
        console.warn(`Server error on dropdown endpoint: ${url}, returning empty array`);
        return [];
      }

      // For other errors, throw with details
      const error = new Error('An error occurred while fetching the data.');
      error.message = await res.text();
      throw error;
    }

    // Parse and return the response
    return res.json();
  } catch (error) {
    // Handle abort errors gracefully
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.warn(`Request timeout for ${url}`);
      // Return empty data for dropdown endpoints instead of throwing
      if (url.includes('/api/dropdown')) {
        console.warn(`Returning empty array for timed out dropdown request: ${url}`);
        return [];
      }
      throw new Error(`Request timed out for ${url}`);
    }

    // For dropdown endpoints, return empty array instead of throwing to prevent cascading failures
    if (url.includes('/api/dropdown')) {
      console.warn(`Error fetching dropdown data ${url}, returning empty array:`, error);
      return [];
    }

    // Log and rethrow other errors
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error fetching ${url}:`, error);
    }
    throw error;
  }
};

/**
 * Performance-optimized SWR configuration
 * This configuration is designed to maximize performance while maintaining reliability
 */
const DEFAULT_SWR_CONFIG = {
  fetcher,
  // Disable automatic revalidation on window focus to prevent unnecessary requests
  revalidateOnFocus: false,
  // Only revalidate stale data when explicitly triggered
  revalidateIfStale: false,
  // Enable revalidation when reconnecting to prevent stale data after connection loss
  revalidateOnReconnect: true,
  // Keep previous data while fetching new data to prevent flashing
  keepPreviousData: true,
  // Cache data for 2 minutes by default to reduce unnecessary requests
  dedupingInterval: 120000, // 2 minutes
  // Retry failed requests up to 3 times
  errorRetryCount: 3,
  // Increase retry delay to reduce network pressure
  errorRetryInterval: 3000, // 3 seconds
  // Set a 10 second timeout for loading states
  loadingTimeout: 10000, // 10 seconds
  // Throttle focus events to reduce unnecessary revalidations
  focusThrottleInterval: 60000, // 1 minute
  // Disable suspense to prevent components from suspending
  suspense: false,
  // Use a more efficient cache provider with size limit to prevent memory leaks
  provider: () => {
    // Create a Map with a maximum size of 100 entries
    const cache = new Map();
    const MAX_SIZE = 100;

    // Override set method to limit cache size
    const originalSet = cache.set.bind(cache);
    cache.set = (key, value) => {
      // If cache is full, remove the oldest entry
      if (cache.size >= MAX_SIZE) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      return originalSet(key, value);
    };

    return cache;
  },
  // Custom error retry function with exponential backoff
  onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
    // Don't retry on 404s
    if (error.status === 404) return;
    // Don't retry on aborted requests
    if (error.message && error.message.includes('timed out')) return;
    // Only retry up to 3 times
    if (retryCount >= 3) return;
    // Use exponential backoff for retries
    const delay = Math.min(1000 * (2 ** retryCount), 30000);
    setTimeout(() => revalidate({ retryCount }), delay);
  },
  // Log errors and slow loading only in development
  onLoadingSlow: function(key) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Slow loading: ${key}`);
    }
  },
  // Only log success for important data in development
  onSuccess: function(data, key) {
    if (process.env.NODE_ENV !== 'production') {
      // Only log success for important data to reduce console spam
      if (key.includes('/api/orders') || key.includes('/api/dashboard') || key.includes('/api/clients')) {
        console.log(`Successfully loaded data for ${key}`);
      }
    }
  },
  onError: function(error, key) {
    console.error(`Error loading ${key}:`, error);
  },
  // Use a comparison function that ignores undefined values
  compare: function(a, b) {
    if (a === b) return true;
    if (!a || !b) return false;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every(function(item, i) { return item === b[i]; });
    }
    if (typeof a === 'object' && typeof b === 'object') {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    return false;
  }
};

/**
 * SWR Provider Component
 * Wraps the application with SWR configuration
 */
export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={DEFAULT_SWR_CONFIG}>
      {children}
    </SWRConfig>
  );
}