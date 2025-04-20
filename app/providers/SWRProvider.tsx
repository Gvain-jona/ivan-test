'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { SWRConfig } from 'swr';
import { createSWRConfig, DataFetchType, getSWRConfigForKey } from '@/lib/swr-config';

// Create a context to track slow loading requests
interface SlowLoadingContext {
  slowLoadingKeys: Set<string>;
  addSlowLoadingKey: (key: string) => void;
  removeSlowLoadingKey: (key: string) => void;
}

const SlowLoadingContext = createContext<SlowLoadingContext>({
  slowLoadingKeys: new Set(),
  addSlowLoadingKey: () => {},
  removeSlowLoadingKey: () => {},
});

export const useSlowLoading = () => useContext(SlowLoadingContext);

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

    // Determine the data type based on the URL
    let dataType: DataFetchType = 'list';
    let cacheStrategy: RequestCache = 'default';
    let revalidateTime = 60; // Default to 1 minute

    // Use different caching strategies based on the endpoint
    if (url.includes('/api/dropdown')) {
      dataType = 'dropdown';
      cacheStrategy = 'force-cache';
      revalidateTime = 3600; // 1 hour
    } else if (url.includes('/api/dashboard')) {
      dataType = 'dashboard';
      cacheStrategy = 'default';
      revalidateTime = 300; // 5 minutes
    } else if (url.includes('/api/orders') && url.includes('/')) {
      // Single order endpoint (detail view)
      dataType = 'detail';
      cacheStrategy = 'no-store'; // Still use no-store for order details
    } else if (url.includes('/api/orders')) {
      // Orders list endpoint
      dataType = 'list';
      cacheStrategy = 'no-store';
    } else {
      // For other data, use default caching with shorter revalidation
      cacheStrategy = 'default';
      revalidateTime = 60; // 1 minute
    }

    // Apply the determined cache strategy
    options.cache = cacheStrategy;
    if (cacheStrategy !== 'no-store') {
      options.next = { revalidate: revalidateTime };
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
 * Now using the standardized configuration factory
 */
const DEFAULT_SWR_CONFIG = {
  fetcher,
  // Use the base configuration from our factory
  ...createSWRConfig('list'),
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
 * Wraps the application with SWR configuration and provides a shared cache
 */
export function SWRProvider({ children }: { children: React.ReactNode }) {
  // Track slow loading requests
  const [slowLoadingKeys, setSlowLoadingKeys] = useState<Set<string>>(new Set());

  const addSlowLoadingKey = (key: string) => {
    setSlowLoadingKeys((prev) => {
      const newSet = new Set(prev);
      newSet.add(key);
      return newSet;
    });
  };

  const removeSlowLoadingKey = (key: string) => {
    setSlowLoadingKeys((prev) => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  };

  // Create a shared cache that persists across renders
  const [sharedCache] = useState(() => {
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
  });

  // Enhanced SWR config with shared cache and middleware
  const enhancedConfig = {
    ...DEFAULT_SWR_CONFIG,
    provider: () => sharedCache,
    use: [
      (useSWRNext) => {
        return (key, fetcher, config) => {
          // Use the next middleware
          const swr = useSWRNext(key, fetcher, config);

          // Track slow loading requests
          useEffect(() => {
            if (!key || !swr.isLoading) return;

            // Set a timeout to detect slow loading requests
            const timeoutId = setTimeout(() => {
              if (swr.isLoading) {
                console.log('Slow loading:', key);
                addSlowLoadingKey(typeof key === 'string' ? key : JSON.stringify(key));
              }
            }, 5000); // 5 seconds threshold

            return () => {
              clearTimeout(timeoutId);
              if (swr.data || swr.error) {
                removeSlowLoadingKey(typeof key === 'string' ? key : JSON.stringify(key));
              }
            };
          }, [key, swr.isLoading, swr.data, swr.error]);

          return swr;
        };
      },
    ],
  };

  return (
    <SlowLoadingContext.Provider value={{ slowLoadingKeys, addSlowLoadingKey, removeSlowLoadingKey }}>
      <SWRConfig value={enhancedConfig}>
        {children}
      </SWRConfig>
    </SlowLoadingContext.Provider>
  );
}