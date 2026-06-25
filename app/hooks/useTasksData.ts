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

export function useTasks(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useLoadingSWR(
    API_ENDPOINTS.TASKS,
    () => dataService.getTasks(),
    'tasks',
    { ...CONFIG, ...config }
  );

  return {
    tasks: data || [],
    isLoading,
    isError: !!error,
    isEmpty: !data || data.length === 0,
    mutate,
  };
}

export function useTask(id?: string, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useLoadingSWR(
    id ? `${API_ENDPOINTS.TASKS}/${id}` : null,
    () => dataService.getTaskById(id!),
    `task-${id}`,
    { ...CONFIG, ...config }
  );

  return {
    task: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}
