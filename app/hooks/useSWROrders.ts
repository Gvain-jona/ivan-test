'use client';

import useSWR from 'swr';
import { Order, OrderStatus, PaymentStatus } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';

interface OrdersResponse {
  orders: Order[];
  totalCount: number;
  pageCount: number;
}

interface OrdersFilters {
  status?: OrderStatus[];
  paymentStatus?: PaymentStatus[];
  startDate?: string;
  endDate?: string;
  search?: string;
}

interface PaginationParams {
  page: number;
  pageSize: number;
}

// Fetcher function for SWR with cache-busting
const fetcher = async (url: string) => {
  // Add cache-busting parameter if not already present
  const urlWithCacheBusting = url.includes('_t=')
    ? url
    : `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;

  console.log('Fetching orders with URL:', urlWithCacheBusting);

  // Use cache: 'no-cache' to bypass browser cache
  const response = await fetch(urlWithCacheBusting, {
    cache: 'no-cache',
    headers: {
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }

  return response.json();
};

/**
 * Custom hook to fetch and manage orders using SWR
 */
export function useSWROrders(
  filters?: OrdersFilters,
  pagination: PaginationParams = { page: 1, pageSize: 50 }
) {
  const { toast } = useToast();

  // Build query string for API request
  const queryParams = new URLSearchParams();

  // Add filters
  if (filters) {
    if (filters.status?.length) {
      filters.status.forEach(status => queryParams.append('status', status));
    }

    if (filters.paymentStatus?.length) {
      filters.paymentStatus.forEach(status => queryParams.append('paymentStatus', status));
    }

    if (filters.startDate) {
      queryParams.append('startDate', filters.startDate);
    }

    if (filters.endDate) {
      queryParams.append('endDate', filters.endDate);
    }

    if (filters.search) {
      queryParams.append('search', filters.search);
    }
  }

  // Add pagination
  const limit = pagination.pageSize;
  const offset = (pagination.page - 1) * pagination.pageSize;
  queryParams.append('limit', limit.toString());
  queryParams.append('offset', offset.toString());

  // Create the API URL
  const apiUrl = `/api/orders?${queryParams.toString()}`;

  // Use SWR to fetch data with a stable key
  const stableKey = JSON.stringify({ url: apiUrl });

  const { data, error, isLoading, isValidating, mutate } = useSWR<OrdersResponse>(
    stableKey,
    () => fetcher(apiUrl),
    {
      revalidateOnFocus: true, // Revalidate when window gets focus
      revalidateOnReconnect: true, // Revalidate when browser regains connection
      refreshInterval: 0, // Don't poll for new data
      dedupingInterval: 2000, // Dedupe requests within 2 seconds only
      shouldRetryOnError: true, // Retry on error
      errorRetryCount: 3, // Retry 3 times on error
      keepPreviousData: true, // Keep previous data while fetching new data
      revalidateIfStale: true, // Always revalidate if data is stale
      revalidateOnMount: true, // Always revalidate on component mount
      // Add a custom compare function to always trigger revalidation for the refresh button
      compare: (a, b) => {
        // If this is a manual refresh (indicated by a timestamp in the URL), always return false
        if (apiUrl.includes('_t=')) return false;
        // Otherwise, do a deep comparison
        return JSON.stringify(a) === JSON.stringify(b);
      }
    }
  );

  // Handle error
  if (error) {
    console.error('Error fetching orders:', error);
    toast({
      title: 'Error',
      description: 'Failed to fetch orders',
      variant: 'destructive',
    });
  }

  return {
    orders: data?.orders || [],
    totalCount: data?.totalCount || 0,
    pageCount: data?.pageCount || 0,
    loading: isLoading,
    validating: isValidating,
    error,
    mutate, // Function to manually revalidate data
  };
}
