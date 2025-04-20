'use client';

import useSWR from 'swr';
import { ComboboxOption } from '@/components/ui/combobox';

// Enhanced fetcher with error handling
const fetcher = async (url: string) => {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) return [];
      const errorText = await res.text();
      throw new Error(`API error: ${res.status} ${errorText}`);
    }
    return res.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return [];
  }
};

// Shared SWR configuration
const swrConfig = {
  revalidateOnFocus: false,
  dedupingInterval: 300000, // 5 minutes
  focusThrottleInterval: 300000, // 5 minutes
  revalidateOnReconnect: false
};

export function useReferenceData() {
  // Fetch all reference data in parallel
  const { data: clientsData = [], isLoading: isClientsLoading } = 
    useSWR<ComboboxOption[]>('/api/clients', fetcher, swrConfig);
  
  const { data: categoriesData = [], isLoading: isCategoriesLoading } = 
    useSWR<ComboboxOption[]>('/api/categories', fetcher, swrConfig);
  
  const { data: itemsData = [], isLoading: isItemsLoading } = 
    useSWR<(ComboboxOption & { categoryId?: string })[]>('/api/items', fetcher, swrConfig);
  
  const isLoading = isClientsLoading || isCategoriesLoading || isItemsLoading;
  
  return {
    clients: clientsData,
    categories: categoriesData,
    items: itemsData,
    isLoading
  };
}
