'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * Batch fetcher for Supabase
 * Allows batching multiple queries into a single request
 */
export async function batchFetch<T>(
  queries: { table: string; query: (supabase: any) => any }[]
): Promise<T[]> {
  const supabase = createClient();
  
  try {
    // Execute all queries in parallel
    const results = await Promise.all(
      queries.map(({ query }) => query(supabase))
    );
    
    // Process results and handle errors
    return results.map((result, index) => {
      if (result.error) {
        console.error(`Error in batch query for ${queries[index].table}:`, result.error);
        return null;
      }
      return result.data;
    });
  } catch (error) {
    console.error('Error in batch fetch:', error);
    throw error;
  }
}

/**
 * Example usage:
 * 
 * const [orders, clients] = await batchFetch([
 *   { 
 *     table: 'orders',
 *     query: (supabase) => supabase.from('orders').select('*').limit(10)
 *   },
 *   {
 *     table: 'clients',
 *     query: (supabase) => supabase.from('clients').select('*')
 *   }
 * ]);
 */
