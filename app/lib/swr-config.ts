import { SWRConfiguration } from 'swr';

/**
 * Types of data fetching operations
 * - list: For fetching lists of items (e.g., orders list)
 * - detail: For fetching a single item's details (e.g., order details)
 * - dropdown: For fetching dropdown/select options
 * - dashboard: For fetching dashboard metrics
 * - invoice: For fetching invoice data
 */
export type DataFetchType = 'list' | 'detail' | 'dropdown' | 'dashboard' | 'invoice';

/**
 * Global SWR configuration constants
 * These values are used across the application to ensure consistent caching behavior
 *
 * IMPORTANT: All deduping intervals have been standardized to at least 30 minutes
 * to prevent excessive API calls and improve application performance.
 */
export const SWR_CACHE_TIMES = {
  // How long to dedupe identical requests (ms)
  LIST_DEDUPE: 5 * 60 * 1000,      // 5 minutes for list data (reduced to prevent stale data issues)
  DETAIL_DEDUPE: 15 * 60 * 1000,   // 15 minutes for detail data
  DROPDOWN_DEDUPE: 60 * 60 * 1000, // 60 minutes for dropdown data
  DASHBOARD_DEDUPE: 30 * 60 * 1000, // 30 minutes for dashboard data
  INVOICE_DEDUPE: 60 * 60 * 1000,   // 60 minutes for invoice data
  STATS_DEDUPE: 30 * 60 * 1000,     // 30 minutes for stats data
  RECURRING_DEDUPE: 30 * 60 * 1000, // 30 minutes for recurring data

  // Minimum deduping interval for any data type
  MIN_DEDUPE: 15 * 60 * 1000,      // 15 minutes minimum for any data type

  // How long to keep data in memory cache (ms)
  MEMORY_TTL: 60 * 60 * 1000,      // 60 minutes
};

/**
 * Global SWR retry configuration
 */
export const SWR_RETRY = {
  DEFAULT_COUNT: 3,           // Default number of retries
  LIST_COUNT: 2,              // Number of retries for list data
  DETAIL_COUNT: 3,            // Number of retries for detail data
  INTERVAL: 3000,             // Retry interval in ms
  LONG_INTERVAL: 5000,        // Longer retry interval in ms
};

/**
 * Creates a standardized SWR configuration based on the type of data being fetched
 *
 * @param type The type of data being fetched
 * @param customOptions Additional SWR options to override defaults
 * @returns A standardized SWR configuration
 */

/**
 * Helper function to determine the appropriate SWR config based on the key
 *
 * @param key The SWR key to analyze
 * @returns A standardized SWR configuration for the given key
 */
export function getSWRConfigForKey(key: string | null): SWRConfiguration {
  if (!key) return createSWRConfig('list');

  let type: DataFetchType = 'list';

  if (key.includes('/api/dropdown')) {
    type = 'dropdown';
  } else if (key.includes('/api/dashboard')) {
    type = 'dashboard';
  } else if (key.includes('/api/invoices/generate') || key.includes('/api/orders/') && key.includes('/invoice')) {
    // Invoice generation endpoints
    type = 'invoice';
  } else if (key.includes('/api/orders/') || key.includes('/api/clients/')) {
    // Detail endpoints with IDs
    type = 'detail';
  } else if (key.includes('/api/orders')) {
    // Orders list endpoint
    type = 'list';
  } else if (key.includes('/api/invoices')) {
    // Invoices list endpoint
    type = 'list';
  } else if (key.includes('/api/expenses')) {
    // Expenses list endpoint
    type = 'list';
  } else if (key.includes('/api/material-purchases/') && !key.includes('/payments')) {
    // Material purchase detail endpoint
    type = 'detail';
  } else if (key.includes('/api/material-purchases')) {
    // Material purchases list endpoint
    type = 'list';
  }

  return createSWRConfig(type);
}

export function createSWRConfig(
  type: DataFetchType = 'list',
  customOptions: Partial<SWRConfiguration> = {}
): SWRConfiguration {
  // Base configuration that applies to all types
  const baseConfig: SWRConfiguration = {
    // Don't revalidate on window focus by default to reduce unnecessary API calls
    revalidateOnFocus: false,

    // Don't revalidate when reconnecting to reduce unnecessary API calls
    // This was changed from true to false to prevent excessive API calls
    revalidateOnReconnect: false,

    // Keep previous data while fetching new data to prevent UI flicker
    keepPreviousData: true,

    // Retry failed requests with consistent count
    errorRetryCount: SWR_RETRY.DEFAULT_COUNT,

    // Use a consistent retry interval
    errorRetryInterval: SWR_RETRY.INTERVAL,

    // Don't use suspense mode by default
    suspense: false,

    // Don't refresh automatically
    refreshInterval: 0,

    // Don't revalidate on mount by default
    revalidateOnMount: true,

    // Don't automatically revalidate stale data to reduce API calls
    revalidateIfStale: false,
  };

  // Type-specific configurations
  const typeConfigs: Record<DataFetchType, Partial<SWRConfiguration>> = {
    // List data (e.g., orders table)
    list: {
      // Use consistent deduping interval from constants
      dedupingInterval: SWR_CACHE_TIMES.LIST_DEDUPE,

      // Revalidate stale data to ensure lists are up-to-date
      revalidateIfStale: true,

      // Use a reasonable loading timeout
      loadingTimeout: 8000, // 8 seconds

      // Use consistent retry count
      errorRetryCount: SWR_RETRY.LIST_COUNT,

      // Explicitly set revalidateOnFocus to false for list data
      revalidateOnFocus: false,

      // Explicitly set revalidateOnReconnect to false for list data
      revalidateOnReconnect: false,
    },

    // Detail data (e.g., order details)
    detail: {
      // Use consistent deduping interval from constants
      dedupingInterval: SWR_CACHE_TIMES.DETAIL_DEDUPE,

      // Revalidate stale data to ensure details are up-to-date
      revalidateIfStale: true,

      // Use a reasonable loading timeout
      loadingTimeout: 5000, // 5 seconds

      // Use consistent retry count
      errorRetryCount: SWR_RETRY.DETAIL_COUNT,
    },

    // Dropdown data (e.g., client list for dropdowns)
    dropdown: {
      // Use consistent deduping interval from constants
      dedupingInterval: SWR_CACHE_TIMES.DROPDOWN_DEDUPE,

      // Don't revalidate stale data for dropdowns to reduce API calls
      revalidateIfStale: false,

      // Short loading timeout for dropdowns
      loadingTimeout: 3000, // 3 seconds

      // Use consistent retry count
      errorRetryCount: SWR_RETRY.DEFAULT_COUNT,
    },

    // Dashboard data (e.g., metrics)
    dashboard: {
      // Use consistent deduping interval from constants
      dedupingInterval: SWR_CACHE_TIMES.DASHBOARD_DEDUPE,

      // Revalidate stale data to ensure dashboard is up-to-date
      revalidateIfStale: true,

      // Use a reasonable loading timeout
      loadingTimeout: 10000, // 10 seconds

      // Use consistent retry count
      errorRetryCount: SWR_RETRY.DEFAULT_COUNT,
    },

    // Invoice data (e.g., invoice generation)
    invoice: {
      // Use consistent deduping interval from constants
      dedupingInterval: SWR_CACHE_TIMES.INVOICE_DEDUPE,

      // Don't revalidate stale data for invoices to reduce API calls
      revalidateIfStale: false,

      // Longer loading timeout for invoice generation
      loadingTimeout: 15000, // 15 seconds

      // Use consistent retry count
      errorRetryCount: SWR_RETRY.DEFAULT_COUNT,
    },
  };

  // Combine base config with type-specific config and custom options
  const combinedConfig = {
    ...baseConfig,
    ...typeConfigs[type],
    ...customOptions,
  };

  // Enforce minimum deduping interval to prevent excessive API calls
  if (combinedConfig.dedupingInterval !== undefined &&
      combinedConfig.dedupingInterval < SWR_CACHE_TIMES.MIN_DEDUPE) {
    console.warn(
      `Warning: dedupingInterval of ${combinedConfig.dedupingInterval}ms is below the minimum of ${SWR_CACHE_TIMES.MIN_DEDUPE}ms. ` +
      `Using minimum value instead to prevent excessive API calls.`
    );
    combinedConfig.dedupingInterval = SWR_CACHE_TIMES.MIN_DEDUPE;
  }

  return combinedConfig;
}
