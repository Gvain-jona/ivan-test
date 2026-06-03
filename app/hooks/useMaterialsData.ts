'use client';

import { useLoadingSWR } from './useLoadingSWR';
import { SWRConfiguration } from 'swr';
import { dataService } from '@/lib/supabase';
import { SWR_CACHE_TIMES, SWR_RETRY } from '@/lib/swr-config';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

const CONFIG: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateIfStale: false,
  revalidateOnReconnect: false,
  keepPreviousData: true,
  dedupingInterval: SWR_CACHE_TIMES.STATS_DEDUPE,
  errorRetryCount: SWR_RETRY.LIST_COUNT,
  loadingTimeout: 5000,
  focusThrottleInterval: 60000,
};

export function useMaterials(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useLoadingSWR(
    API_ENDPOINTS.MATERIALS,
    () => dataService.getMaterials(),
    'materials',
    { ...CONFIG, ...config }
  );

  return {
    materials: data || [],
    isLoading,
    isError: !!error,
    isEmpty: !data || data.length === 0,
    mutate,
  };
}

export function useMaterial(id?: string, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useLoadingSWR(
    id ? `${API_ENDPOINTS.MATERIALS}/${id}` : null,
    () => dataService.getMaterialById(id!),
    `material-${id}`,
    { ...CONFIG, ...config }
  );

  return {
    material: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}
