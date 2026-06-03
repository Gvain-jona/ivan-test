'use client';

import { useLoadingSWR, useFetch } from './useLoadingSWR';
import { SWRConfiguration } from 'swr';
import { SWR_CACHE_TIMES, SWR_RETRY } from '@/lib/swr-config';
import { dataService } from '@/lib/supabase';
import { Order, OrderStatus, PaymentStatus } from '@/types/orders';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

const DEFAULT_CONFIG: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateIfStale: false,
  revalidateOnReconnect: false,
  keepPreviousData: true,
  dedupingInterval: SWR_CACHE_TIMES.STATS_DEDUPE,
  errorRetryCount: SWR_RETRY.LIST_COUNT,
  loadingTimeout: 5000,
  focusThrottleInterval: 60000,
};

const DROPDOWN_CONFIG: SWRConfiguration = {
  ...DEFAULT_CONFIG,
  dedupingInterval: 120000,
};

// Exported so consumers can import types from here or from @/types/orders directly
export interface OrdersResponse {
  orders: Order[];
  totalCount: number;
  pageCount: number;
}

export interface OrdersFilters {
  status?: OrderStatus[];
  paymentStatus?: PaymentStatus[];
  startDate?: string;
  endDate?: string;
  search?: string;
  clientId?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

// Reference data fetchers
const fetchers = {
  clients: async () => await dataService.getClients(),
  categories: async () => await dataService.getCategories(),
  items: async (categoryId: string) => await dataService.getItems(categoryId),
  sizes: async () => await dataService.getSizes(),
  suppliers: async () => await dataService.getSuppliers(),
};

export function useClients(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useLoadingSWR(
    API_ENDPOINTS.CLIENTS,
    () => fetchers.clients(),
    'clients',
    { ...DROPDOWN_CONFIG, ...config }
  );

  return {
    clients: data || [],
    isLoading,
    isError: !!error,
    isEmpty: !data || data.length === 0,
    mutate,
  };
}

export function useCategories(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useLoadingSWR(
    API_ENDPOINTS.CATEGORIES,
    () => fetchers.categories(),
    'categories',
    { ...DROPDOWN_CONFIG, ...config }
  );

  return {
    categories: data || [],
    isLoading,
    isError: !!error,
    isEmpty: !data || data.length === 0,
    mutate,
  };
}

export function useItems(categoryId?: string, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useLoadingSWR(
    categoryId ? `${API_ENDPOINTS.ITEMS}?categoryId=${categoryId}` : null,
    () => fetchers.items(categoryId!),
    `items-${categoryId}`,
    { ...DROPDOWN_CONFIG, ...config }
  );

  return {
    items: data || [],
    isLoading,
    isError: !!error,
    isEmpty: !data || data.length === 0,
    mutate,
  };
}

export function useSizes(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useLoadingSWR(
    API_ENDPOINTS.SIZES,
    () => fetchers.sizes(),
    'sizes',
    { ...DROPDOWN_CONFIG, ...config }
  );

  return {
    sizes: data || [],
    isLoading,
    isError: !!error,
    isEmpty: !data || data.length === 0,
    mutate,
  };
}

export function useSuppliers(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useLoadingSWR(
    API_ENDPOINTS.SUPPLIERS,
    () => fetchers.suppliers(),
    'suppliers',
    { ...DROPDOWN_CONFIG, ...config }
  );

  return {
    suppliers: data || [],
    isLoading,
    isError: !!error,
    isEmpty: !data || data.length === 0,
    mutate,
  };
}

export function useApiData<T>(
  url: string | null,
  loadingId?: string,
  config?: SWRConfiguration
) {
  return useFetch<T>(
    url,
    loadingId,
    { ...DEFAULT_CONFIG, ...config }
  );
}
