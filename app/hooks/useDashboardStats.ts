'use client';

import { useLoadingSWR } from './useLoadingSWR';
import { SWRConfiguration } from 'swr';
import { dataService } from '@/lib/supabase';
import { SWR_CACHE_TIMES, SWR_RETRY } from '@/lib/swr-config';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

const DASHBOARD_CONFIG: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateIfStale: false,
  revalidateOnReconnect: false,
  keepPreviousData: true,
  dedupingInterval: SWR_CACHE_TIMES.LIST_DEDUPE,
  errorRetryCount: SWR_RETRY.LIST_COUNT,
  loadingTimeout: 5000,
  focusThrottleInterval: 60000,
};

export function useDashboardStats(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useLoadingSWR(
    API_ENDPOINTS.DASHBOARD,
    () => dataService.getDashboardStats(),
    'dashboard-stats',
    { ...DASHBOARD_CONFIG, ...config }
  );

  return {
    stats: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}
