'use client';

import useSWR, { SWRConfiguration, SWRResponse } from 'swr';
import { useLoading } from '@/components/loading/LoadingProvider';
import { useEffect } from 'react';
import { createSWRConfig, DataFetchType, getSWRConfigForKey } from '@/lib/swr-config';

/**
 * Custom hook that combines SWR with the loading provider
 * @param key The SWR key
 * @param fetcher The fetcher function
 * @param loadingId Optional loading ID for the loading provider
 * @param config SWR configuration
 * @returns SWR response
 */
export function useLoadingSWR<Data = any, Error = any>(
  key: string | null,
  fetcher: (url: string) => Promise<Data>,
  loadingId: string = key || 'global',
  config?: SWRConfiguration
): SWRResponse<Data, Error> {
  const { startLoading, stopLoading } = useLoading();

  // Wrap the fetcher to add better error handling and performance tracking
  const wrappedFetcher = async (url: string): Promise<Data> => {
    // Check if URL is valid
    if (!url) {
      console.error('Invalid URL provided to useLoadingSWR:', url);
      return {} as Data; // Return empty data to prevent errors
    }

    // Track performance
    const startTime = Date.now();
    let success = false;

    try {
      // Add a timeout to prevent hanging requests
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timeout for ${url}`));
        }, 30000); // 30 second timeout
      });

      // Race the fetcher against the timeout
      const result = await Promise.race([
        fetcher(url),
        timeoutPromise
      ]) as Data;

      success = true;
      return result;
    } catch (error) {
      console.error(`Error in useLoadingSWR fetcher for key ${key}:`, error);
      // Re-throw the error for SWR to handle
      throw error;
    } finally {
      // Log performance metrics
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (duration > 1000) {
        // Only log slow requests (over 1 second)
        console.warn(`Slow request for ${key}: ${duration}ms (${success ? 'success' : 'failed'})`);
      }
    }
  };

  // Get the appropriate SWR config based on the key
  const baseConfig = getSWRConfigForKey(key);

  // Only use SWR if we have a valid key
  const response = useSWR<Data, Error>(
    // Ensure key is a valid string
    typeof key === 'string' && key.length > 0 ? key : null,
    // Only call fetcher if key is valid
    key ? wrappedFetcher : null,
    {
      // Start with the appropriate base config for this type of data
      ...baseConfig,
      // Add custom config options
      ...config,
      // Add onError handler to log errors
      onError: (err, key) => {
        console.error(`SWR Error for key ${key}:`, err);
        // Call the original onError handler if provided
        if (config?.onError) {
          config.onError(err, key, config);
        } else if (baseConfig.onError) {
          // Fall back to the base config's onError handler
          baseConfig.onError(err, key, baseConfig);
        }
      },
      // Provide a fallback empty object to prevent null errors if not provided
      fallbackData: config?.fallbackData || baseConfig.fallbackData || (
        // Provide appropriate fallback data based on the key pattern
        key?.includes('/orders') ?
          { orders: [], totalCount: 0, pageCount: 0 } as unknown as Data :
          {} as Data
      )
    }
  );

  // Update loading state based on SWR state with improved handling
  useEffect(() => {
    // Track when loading starts to implement a minimum loading time
    const loadingStartTime = Date.now();
    let loadingTimeoutId: NodeJS.Timeout | null = null;

    // Only show loading state if we're loading for the first time (no data yet)
    // or if we're validating and don't have any data
    const shouldShowLoading =
      (response.isLoading && !response.data) ||
      (response.isValidating && !response.data);

    if (shouldShowLoading) {
      startLoading(loadingId);
    } else {
      // Ensure loading state shows for at least 500ms to prevent flickering
      const loadingDuration = Date.now() - loadingStartTime;
      const minLoadingTime = 500; // 500ms minimum loading time

      if (loadingDuration < minLoadingTime) {
        // If loading completed too quickly, delay hiding the loading state
        loadingTimeoutId = setTimeout(() => {
          stopLoading(loadingId);
        }, minLoadingTime - loadingDuration);
      } else {
        stopLoading(loadingId);
      }
    }

    // Cleanup on unmount
    return () => {
      if (loadingTimeoutId) {
        clearTimeout(loadingTimeoutId);
      }
      stopLoading(loadingId);
    };
  }, [response.isLoading, response.isValidating, response.data, startLoading, stopLoading, loadingId]);

  return response;
}

/**
 * Custom hook for fetching data with loading state
 * @param url The URL to fetch
 * @param loadingId Optional loading ID for the loading provider
 * @param config SWR configuration
 * @returns SWR response
 */
export function useFetch<Data = any, Error = any>(
  url: string | null,
  loadingId?: string,
  config?: SWRConfiguration
): SWRResponse<Data, Error> {
  return useLoadingSWR<Data, Error>(
    url,
    async (url) => {
      const startTime = Date.now();
      try {
        // Add timeout to fetch to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        try {
          const res = await fetch(url, {
            signal: controller.signal,
            // Add cache control headers to improve caching
            headers: {
              'Cache-Control': 'max-age=300', // 5 minutes
            }
          });

          // Clear the timeout
          clearTimeout(timeoutId);

          if (!res.ok) {
            const errorText = await res.text().catch(() => 'Unknown error');
            console.error(`Fetch error (${res.status}): ${errorText}`);
            const error = new Error(`HTTP error ${res.status}: ${errorText}`);
            throw error;
          }

          const data = await res.json();

          // Log performance for slow requests
          const duration = Date.now() - startTime;
          if (duration > 1000) {
            console.warn(`Slow fetch for ${url}: ${duration}ms`);
          }

          return data;
        } catch (fetchError) {
          // Clear the timeout to prevent memory leaks
          clearTimeout(timeoutId);
          throw fetchError;
        }
      } catch (error) {
        console.error(`Error fetching ${url}:`, error);

        // Check if it's an abort error (timeout)
        if (error.name === 'AbortError') {
          console.error(`Fetch request timed out for ${url}`);
        }

        throw error;
      }
    },
    loadingId,
    config
  );
}
