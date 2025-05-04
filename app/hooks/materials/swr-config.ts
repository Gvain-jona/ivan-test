import { SWRConfiguration } from 'swr';
import { SWR_CACHE_TIMES, SWR_RETRY } from '@/lib/swr-config';

type SWRDataType = 'list' | 'detail' | 'dropdown' | 'stats' | 'recurring';

/**
 * Create a standardized SWR configuration based on data type
 * @param type Type of data being fetched
 * @returns SWR configuration object
 */
export const createMaterialSWRConfig = (type: SWRDataType): SWRConfiguration => {
  const baseConfig: SWRConfiguration = {
    // Keep previous data while fetching new data to prevent UI flashing
    keepPreviousData: true,

    // Retry failed requests up to 3 times
    errorRetryCount: SWR_RETRY.DEFAULT_COUNT,

    // Disable automatic refresh interval (we'll manually trigger refreshes)
    refreshInterval: 0,

    // Throttle focus events to reduce unnecessary revalidations
    focusThrottleInterval: 5000,
  };

  // Customize based on the type of data
  switch (type) {
    case 'list':
      return {
        ...baseConfig,
        // Cache list data for 30 minutes
        dedupingInterval: SWR_CACHE_TIMES.LIST_DEDUPE,
        // Disable automatic revalidation on window focus for lists
        revalidateOnFocus: false,
        // Only revalidate stale data when explicitly triggered
        revalidateIfStale: false,
        // Disable revalidation when reconnecting to reduce API calls
        revalidateOnReconnect: false,
      };

    case 'detail':
      return {
        ...baseConfig,
        // Cache detail data for 15 minutes
        dedupingInterval: SWR_CACHE_TIMES.DETAIL_DEDUPE,
        // Disable automatic revalidation on window focus
        revalidateOnFocus: false,
        // Only revalidate stale data when explicitly triggered
        revalidateIfStale: false,
        // Disable revalidation when reconnecting to reduce API calls
        revalidateOnReconnect: false,
      };

    case 'dropdown':
      return {
        ...baseConfig,
        // Cache dropdown data for 60 minutes
        dedupingInterval: SWR_CACHE_TIMES.DROPDOWN_DEDUPE,
        // Disable automatic revalidation on window focus
        revalidateOnFocus: false,
        // Only revalidate stale data when explicitly triggered
        revalidateIfStale: false,
        // Disable revalidation when reconnecting to reduce API calls
        revalidateOnReconnect: false,
      };

    case 'stats':
      return {
        ...baseConfig,
        // Cache stats data for 30 minutes
        dedupingInterval: SWR_CACHE_TIMES.STATS_DEDUPE,
        // Disable automatic revalidation on window focus
        revalidateOnFocus: false,
        // Only revalidate stale data when explicitly triggered
        revalidateIfStale: false,
        // Disable revalidation when reconnecting to reduce API calls
        revalidateOnReconnect: false,
      };

    case 'recurring':
      return {
        ...baseConfig,
        // Cache recurring data for 30 minutes
        dedupingInterval: SWR_CACHE_TIMES.RECURRING_DEDUPE,
        // Disable automatic revalidation on window focus
        revalidateOnFocus: false,
        // Only revalidate stale data when explicitly triggered
        revalidateIfStale: false,
        // Disable revalidation when reconnecting to reduce API calls
        revalidateOnReconnect: false,
      };

    default:
      return baseConfig;
  }
};
