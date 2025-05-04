/**
 * Standardized SWR configuration for expense-related hooks
 * This ensures consistent caching behavior across the application
 */

import { SWRConfiguration } from 'swr';

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
    // Keep previous data while fetching new data to prevent UI flashing
    keepPreviousData: true,

    // Retry failed requests up to 3 times
    errorRetryCount: 3,

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
        // Cache list data for 30 minutes - increased to reduce API calls
        dedupingInterval: 30 * 60 * 1000,
        // Disable automatic revalidation on window focus for lists
        // to prevent unnecessary API calls when switching tabs
        revalidateOnFocus: false,
        // Only revalidate stale data when explicitly triggered
        revalidateIfStale: false,
        // Disable revalidation when reconnecting to reduce API calls
        revalidateOnReconnect: false,
      };

    case 'detail':
      return {
        ...baseConfig,
        // Cache detail data for 15 minutes - increased to reduce API calls
        dedupingInterval: 15 * 60 * 1000,
        // Disable revalidation on focus to reduce API calls
        revalidateOnFocus: false,
        // Don't revalidate stale data automatically
        revalidateIfStale: false,
        // Disable revalidation when reconnecting to reduce API calls
        revalidateOnReconnect: false,
      };

    case 'stats':
      return {
        ...baseConfig,
        // Cache stats data for 30 minutes - increased to reduce API calls
        dedupingInterval: 30 * 60 * 1000,
        // Disable automatic revalidation on window focus for stats
        revalidateOnFocus: false,
        // Only revalidate stale data when explicitly triggered
        revalidateIfStale: false,
        // Disable revalidation when reconnecting to reduce API calls
        revalidateOnReconnect: false,
      };

    case 'recurring':
      return {
        ...baseConfig,
        // Cache recurring data for 30 minutes - increased to reduce API calls
        dedupingInterval: 30 * 60 * 1000,
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
