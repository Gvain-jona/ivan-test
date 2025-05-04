'use client';

import useSWR from 'swr';
import { OrdersFilters } from './useData';
import { createSWRConfig } from '@/lib/swr-config';

export interface OrderMetrics {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  activeClients: number;
  completedOrders: number;
  unpaidOrders: number;
  unpaidTotal: number;
}

/**
 * Custom hook to fetch order metrics from the API
 * This uses server-side calculations for accurate metrics based on the complete dataset
 */
export function useOrderMetrics(filters?: OrdersFilters) {
  // Build query string for filters
  const queryParams = new URLSearchParams();

  // Add filters - only add non-empty values
  if (filters?.status?.length) {
    filters.status.forEach(status => {
      queryParams.append('status', status);
    });
  }

  if (filters?.paymentStatus?.length) {
    filters.paymentStatus.forEach(status => {
      queryParams.append('paymentStatus', status);
    });
  }

  if (filters?.startDate) {
    queryParams.append('startDate', filters.startDate);
  }

  if (filters?.endDate) {
    queryParams.append('endDate', filters.endDate);
  }

  if (filters?.search) {
    queryParams.append('search', filters.search);
  }

  // Create the API URL with query parameters
  const apiUrl = `/api/orders/metrics?${queryParams.toString()}`;

  // Use SWR to fetch the metrics
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    apiUrl,
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch order metrics');
      }
      const data = await response.json();
      return data.metrics as OrderMetrics;
    },
    createSWRConfig('metrics', {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      dedupingInterval: 60000, // 1 minute
      fallbackData: {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        activeClients: 0,
        completedOrders: 0,
        unpaidOrders: 0,
        unpaidTotal: 0
      }
    })
  );

  return {
    metrics: data,
    isLoading,
    isValidating,
    isError: !!error,
    error,
    refreshMetrics: mutate
  };
}
