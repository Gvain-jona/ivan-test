'use client';

import { useMemo } from 'react';
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
  clientId?: string;
}

interface PaginationParams {
  page: number;
  pageSize: number;
}

// Generate a stable cache key for SWR
function generateCacheKey(filters?: OrdersFilters, pagination?: PaginationParams) {
  return JSON.stringify({
    endpoint: '/api/orders',
    filters,
    pagination
  });
}

// Fetch orders from the API
async function fetchOrders(
  filters?: OrdersFilters,
  pagination: PaginationParams = { page: 1, pageSize: 20 }
): Promise<OrdersResponse> {
  // Build query string
  const queryParams = new URLSearchParams();
  
  // Add filters
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
  
  if (filters?.clientId) {
    queryParams.append('clientId', filters.clientId);
  }
  
  // Add pagination
  if (pagination) {
    queryParams.append('limit', pagination.pageSize.toString());
    queryParams.append('offset', ((pagination.page - 1) * pagination.pageSize).toString());
  }
  
  // Make the request
  const response = await fetch(`/api/orders?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }
  
  return response.json();
}

/**
 * Hook for fetching orders with filtering and pagination
 */
export function useOrders(
  filters?: OrdersFilters,
  pagination: PaginationParams = { page: 1, pageSize: 20 }
) {
  const { toast } = useToast();
  
  // Generate a stable cache key
  const cacheKey = useMemo(() => 
    generateCacheKey(filters, pagination), 
    [filters, pagination]
  );
  
  // Use SWR for data fetching
  const { data, error, isLoading, isValidating, mutate } = useSWR<OrdersResponse>(
    cacheKey,
    () => fetchOrders(filters, pagination),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // 5 seconds
      keepPreviousData: true,
      onError: (err) => {
        console.error('Error fetching orders:', err);
        toast({
          title: 'Error',
          description: 'Failed to fetch orders',
          variant: 'destructive',
        });
      }
    }
  );
  
  return {
    orders: data?.orders || [],
    totalCount: data?.totalCount || 0,
    pageCount: data?.pageCount || 0,
    isLoading,
    isValidating,
    isError: !!error,
    isEmpty: data?.orders?.length === 0,
    mutate,
  };
}

/**
 * Hook for fetching a single order by ID
 */
export function useOrder(id?: string) {
  const { toast } = useToast();
  
  // Use SWR for data fetching
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/orders/${id}` : null,
    async () => {
      if (!id) return null;
      
      const response = await fetch(`/api/orders/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }
      
      return response.json();
    },
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000, // 5 seconds
      onError: (err) => {
        console.error(`Error fetching order ${id}:`, err);
        toast({
          title: 'Error',
          description: 'Failed to fetch order details',
          variant: 'destructive',
        });
      }
    }
  );
  
  return {
    order: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}

/**
 * Function to update order status with optimistic updates
 */
export async function updateOrderStatus(
  orderId: string, 
  status: OrderStatus,
  mutateOrders: () => Promise<any>
) {
  try {
    // Make the API request
    const response = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update order status');
    }
    
    // Revalidate to ensure data consistency
    await mutateOrders();
    
    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    
    // Revalidate to revert any optimistic update
    await mutateOrders();
    
    return false;
  }
}
