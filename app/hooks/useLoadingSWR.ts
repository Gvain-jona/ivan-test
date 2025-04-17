'use client';

import useSWR, { SWRConfiguration, SWRResponse } from 'swr';
import { useLoading } from '@/components/loading/LoadingProvider';
import { useEffect } from 'react';

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
  const response = useSWR<Data, Error>(key, fetcher, config);
  
  // Update loading state based on SWR state
  useEffect(() => {
    if (response.isLoading || response.isValidating) {
      startLoading(loadingId);
    } else {
      stopLoading(loadingId);
    }
    
    // Cleanup on unmount
    return () => {
      stopLoading(loadingId);
    };
  }, [response.isLoading, response.isValidating, startLoading, stopLoading, loadingId]);
  
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
      const res = await fetch(url);
      
      if (!res.ok) {
        const error = new Error('An error occurred while fetching the data.');
        throw error;
      }
      
      return res.json();
    },
    loadingId,
    config
  );
}
