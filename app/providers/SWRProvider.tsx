'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

/**
 * Global SWR configuration provider
 * This ensures consistent caching behavior across the application
 */
export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        provider: () => new Map(), // Use a new Map instance as the cache provider
        revalidateOnFocus: true, // Revalidate when window gets focus
        revalidateOnReconnect: true, // Revalidate when browser regains connection
        refreshInterval: 0, // Don't poll for new data
        dedupingInterval: 2000, // Dedupe requests within 2 seconds only
        shouldRetryOnError: true, // Retry on error
        errorRetryCount: 3, // Retry 3 times on error
        keepPreviousData: true, // Keep previous data while fetching new data
        revalidateIfStale: true, // Always revalidate if data is stale
        revalidateOnMount: true, // Always revalidate on component mount
        onError: (error) => {
          console.error('Global SWR error:', error);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
