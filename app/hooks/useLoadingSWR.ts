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

  // Wrap the fetcher to add better error handling
  const wrappedFetcher = async (url: string): Promise<Data> => {
    try {
      return await fetcher(url);
    } catch (error) {
      console.error(`Error in useLoadingSWR fetcher for key ${key}:`, error);
      // Re-throw the error for SWR to handle
      throw error;
    }
  };

  // Get the appropriate SWR config based on the key
  const baseConfig = getSWRConfigForKey(key);

  const response = useSWR<Data, Error>(key, wrappedFetcher, {
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
    fallbackData: config?.fallbackData || baseConfig.fallbackData || {} as Data
  });

  // Update loading state based on SWR state with improved handling
  useEffect(() => {
    // Only show loading state if we're loading for the first time (no data yet)
    // or if we're validating and don't have any data
    const shouldShowLoading =
      (response.isLoading && !response.data) ||
      (response.isValidating && !response.data);

    if (shouldShowLoading) {
      startLoading(loadingId);
    } else {
      stopLoading(loadingId);
    }

    // Cleanup on unmount
    return () => {
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
      try {
        const res = await fetch(url);

        if (!res.ok) {
          const errorText = await res.text().catch(() => 'Unknown error');
          console.error(`Fetch error (${res.status}): ${errorText}`);
          const error = new Error(`HTTP error ${res.status}: ${errorText}`);
          throw error;
        }

        return await res.json();
      } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        throw error;
      }
    },
    loadingId,
    config
  );
}
