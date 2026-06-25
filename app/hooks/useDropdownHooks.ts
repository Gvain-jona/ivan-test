'use client';

import { useLoadingSWR } from './useLoadingSWR';
import { SWRConfiguration } from 'swr';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export interface DropdownOption {
  value: string;
  label: string;
  [key: string]: unknown;
}

const DROPDOWN_CONFIG: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateIfStale: false,
  revalidateOnReconnect: false,
  keepPreviousData: true,
  dedupingInterval: 120000,
  errorRetryCount: 1,
  focusThrottleInterval: 60000,
};

export function useDropdownClients(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useLoadingSWR<DropdownOption[]>(
    API_ENDPOINTS.DROPDOWN_CLIENTS,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch clients');
      return res.json();
    },
    'dropdown-clients',
    { ...DROPDOWN_CONFIG, ...config }
  );

  return {
    options: data || [],
    isLoading,
    isError: !!error,
    isEmpty: !data || data.length === 0,
    mutate,
  };
}

export function useDropdownCategories(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useLoadingSWR<DropdownOption[]>(
    API_ENDPOINTS.DROPDOWN_CATEGORIES,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
    'dropdown-categories',
    { ...DROPDOWN_CONFIG, ...config }
  );

  return {
    options: data || [],
    isLoading,
    isError: !!error,
    isEmpty: !data || data.length === 0,
    mutate,
  };
}

export function useDropdownItems(categoryId?: string, config?: SWRConfiguration) {
  const url = categoryId ? `${API_ENDPOINTS.DROPDOWN_ITEMS}?categoryId=${categoryId}` : null;

  const { data, error, isLoading, mutate } = useLoadingSWR<DropdownOption[]>(
    url,
    async (fetchUrl) => {
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error('Failed to fetch items');
      return res.json();
    },
    `dropdown-items-${categoryId || 'all'}`,
    { ...DROPDOWN_CONFIG, ...config }
  );

  return {
    options: data || [],
    isLoading,
    isError: !!error,
    isEmpty: !data || data.length === 0,
    mutate,
  };
}

export function useDropdownSizes(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useLoadingSWR<DropdownOption[]>(
    API_ENDPOINTS.DROPDOWN_SIZES,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch sizes');
      return res.json();
    },
    'dropdown-sizes',
    { ...DROPDOWN_CONFIG, ...config }
  );

  return {
    options: data || [],
    isLoading,
    isError: !!error,
    isEmpty: !data || data.length === 0,
    mutate,
  };
}

export function useDropdownSuppliers(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useLoadingSWR<DropdownOption[]>(
    API_ENDPOINTS.DROPDOWN_SUPPLIERS,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch suppliers');
      return res.json();
    },
    'dropdown-suppliers',
    { ...DROPDOWN_CONFIG, ...config }
  );

  return {
    options: data || [],
    isLoading,
    isError: !!error,
    isEmpty: !data || data.length === 0,
    mutate,
  };
}
