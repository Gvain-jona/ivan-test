'use client';

import { SWRConfig } from 'swr';

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        refreshInterval: 0, // Disable auto refresh by default
        revalidateOnFocus: false, // Disable revalidation on focus
        shouldRetryOnError: false, // Disable retry on error
      }}
    >
      {children}
    </SWRConfig>
  );
} 