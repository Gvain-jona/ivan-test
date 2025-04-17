'use client';

import { mutate, unstable_serialize } from 'swr';

/**
 * Prefetch data for SWR
 * This allows us to load data before it's needed
 *
 * Note: This implementation uses the mutate function directly
 * since the cache object is not directly exposed in SWR
 */
export function prefetch(key: string, fetcher: () => Promise<any>): void {
  // Don't prefetch on the server
  if (typeof window === 'undefined') return;

  // Create a serialized key for SWR
  const serializedKey = typeof key === 'string' ? key : unstable_serialize(key);

  // Prefetch the data
  fetcher()
    .then((data) => {
      // Populate the SWR cache without revalidation
      mutate(serializedKey, data, false);
      console.log(`Prefetched data for ${serializedKey}`);
    })
    .catch((error) => {
      console.error(`Error prefetching ${serializedKey}:`, error);
    });
}

/**
 * Prefetch multiple keys at once
 */
export function prefetchMultiple(
  items: Array<{ key: string; fetcher: () => Promise<any> }>
): void {
  items.forEach(({ key, fetcher }) => prefetch(key, fetcher));
}

/**
 * Example usage:
 *
 * // Prefetch orders data
 * prefetch('/api/orders', () => fetch('/api/orders').then(res => res.json()));
 *
 * // Prefetch multiple resources
 * prefetchMultiple([
 *   { key: '/api/orders', fetcher: () => fetch('/api/orders').then(res => res.json()) },
 *   { key: '/api/clients', fetcher: () => fetch('/api/clients').then(res => res.json()) }
 * ]);
 */
