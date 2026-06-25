/**
 * Standardized SWR configuration for expense-related hooks
 * This ensures consistent caching behavior across the application
 */

import { SWRConfiguration } from 'swr';
import { SWR_CACHE_TIMES, SWR_RETRY } from '@/lib/swr-config';

/**
 * Data types for SWR configuration
 */
export type SWRDataType = 'list' | 'detail' | 'stats' | 'recurring';

/**
 * Create a standardized SWR configuration based on data type
 * @param type Type of data being fetched
 * @returns SWR configuration object
 */
export const createExpenseSWRConfig = (type: SWRDataType): SWRConfiguration => {
  const baseConfig: SWRConfiguration = {
    keepPreviousData: true,
    errorRetryCount: SWR_RETRY.DEFAULT_COUNT,
    refreshInterval: 0,
  };

  switch (type) {
    case 'list':
      return {
        ...baseConfig,
        dedupingInterval: SWR_CACHE_TIMES.STATS_DEDUPE,
        revalidateOnFocus: false,
        revalidateIfStale: false,
        revalidateOnReconnect: false,
      };

    case 'detail':
      return {
        ...baseConfig,
        dedupingInterval: SWR_CACHE_TIMES.DETAIL_DEDUPE,
        revalidateOnFocus: false,
        revalidateIfStale: false,
        revalidateOnReconnect: false,
      };

    case 'stats':
      return {
        ...baseConfig,
        dedupingInterval: SWR_CACHE_TIMES.STATS_DEDUPE,
        revalidateOnFocus: false,
        revalidateIfStale: false,
        revalidateOnReconnect: false,
      };

    case 'recurring':
      return {
        ...baseConfig,
        dedupingInterval: SWR_CACHE_TIMES.RECURRING_DEDUPE,
        revalidateOnFocus: false,
        revalidateIfStale: false,
        revalidateOnReconnect: false,
      };

    default:
      return baseConfig;
  }
};
