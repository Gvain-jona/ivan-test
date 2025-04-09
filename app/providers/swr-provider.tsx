'use client';

import { SWRConfig } from 'swr';

// Define a global fetcher function
const fetcher = async (url: string) => {
  const res = await fetch(url);

  // If the status code is not in the range 200-299,
  // we still try to parse and throw it.
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // Attach extra info to the error object.
    error.message = await res.text();
    throw error;
  }

  return res.json();
};

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateIfStale: false,
        revalidateOnReconnect: true,
        dedupingInterval: 60000, // 1 minute
        errorRetryInterval: 5000, // 5 seconds
        errorRetryCount: 3,
        suspense: false, // Changed to false to prevent components from suspending
      }}
    >
      {children}
    </SWRConfig>
  );
}
