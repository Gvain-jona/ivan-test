'use client';

import { useState, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { Order, OrderStatus, PaymentStatus } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';

// Define the response type
interface OrdersResponse {
  orders: Order[];
  totalCount: number;
  pageCount: number;
}

// Define the filter type
export interface OrdersFilters {
  status?: OrderStatus[];
  paymentStatus?: PaymentStatus[];
  startDate?: string;
  endDate?: string;
  search?: string;
  clientId?: string;
}

// Define the pagination type
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Fetches orders directly from Supabase with server-side filtering
 */
async function fetchOrdersFromSupabase(
  filters?: OrdersFilters,
  pagination: PaginationParams = { page: 1, pageSize: 20 }
): Promise<OrdersResponse> {
  try {
    // Create Supabase client
    const supabase = createClient();

    // Calculate offset
    const offset = (pagination.page - 1) * pagination.pageSize;

    // Start building the query
    let query = supabase
      .from('orders')
      .select(`
        *,
        clients:client_id (id, name)
      `, { count: 'exact' });

    // Apply filters
    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }

    if (filters?.paymentStatus && filters.paymentStatus.length > 0) {
      query = query.in('payment_status', filters.paymentStatus);
    }

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }

    if (filters?.search) {
      // Search in order ID, order number, or client name
      query = query.or(`id.ilike.%${filters.search}%,order_number.ilike.%${filters.search}%,clients.name.ilike.%${filters.search}%`);
    }

    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId);
    }

    // Apply pagination
    query = query.range(offset, offset + pagination.pageSize - 1);

    // Order by date descending (newest first)
    query = query.order('date', { ascending: false });

    // Execute the query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    // Transform the data
    const transformedOrders = await Promise.all((data || []).map(async (order) => {
      // Fetch items for this order
      const { data: items } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      // Fetch notes for this order
      const { data: notes } = await supabase
        .from('notes')
        .select('*')
        .eq('linked_item_type', 'order')
        .eq('linked_item_id', order.id);

      return {
        id: order.id,
        order_number: order.order_number,
        client_id: order.client_id,
        client_name: order.clients?.name || 'Unknown Client',
        client_type: order.client_type || 'regular',
        date: order.date,
        status: order.status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        total_amount: order.total_amount || 0,
        amount_paid: order.amount_paid || 0,
        balance: order.balance || 0,
        created_by: order.created_by,
        created_at: order.created_at,
        updated_at: order.updated_at,
        items: items || [],
        notes: notes || []
      };
    }));

    return {
      orders: transformedOrders,
      totalCount: count || 0,
      pageCount: Math.ceil((count || 0) / pagination.pageSize)
    };
  } catch (error) {
    console.error('Error in fetchOrdersFromSupabase:', error);
    throw error;
  }
}

/**
 * Generate a stable cache key for SWR
 */
function generateCacheKey(filters?: OrdersFilters, pagination?: PaginationParams): string {
  return JSON.stringify({
    endpoint: 'orders',
    filters,
    pagination
  });
}

/**
 * Hook for fetching orders with filtering and pagination
 * Uses SWR for caching and revalidation
 */
export function useOrdersData(
  filters?: OrdersFilters,
  pagination: PaginationParams = { page: 1, pageSize: 20 }
) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Generate a stable cache key
  const cacheKey = useMemo(() =>
    generateCacheKey(filters, pagination),
    [filters, pagination]
  );

  // Use SWR for data fetching with optimized settings
  const { data, error, isLoading, isValidating, mutate } = useSWR<OrdersResponse>(
    cacheKey,
    () => fetchOrdersFromSupabase(filters, pagination),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // 30 seconds
      keepPreviousData: true,
      refreshInterval: 60000, // Only refresh every minute
      errorRetryCount: 3, // Limit retries
      onError: (err) => {
        console.error('Error fetching orders:', err);
        toast({
          title: 'Error',
          description: 'Failed to fetch orders. Please try again.',
          variant: 'destructive',
        });
      }
    }
  );

  /**
   * Update an order's status
   */
  const updateOrderStatus = useCallback(async (
    orderId: string,
    status: OrderStatus
  ): Promise<boolean> => {
    try {
      setLoading(true);

      // Create Supabase client
      const supabase = createClient();

      // Update the order status
      const { error } = await supabase
        .from('orders')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        toast({
          title: 'Error',
          description: 'Failed to update order status',
          variant: 'destructive',
        });
        return false;
      }

      // Optimistically update the local data
      mutate(
        (currentData) => {
          if (!currentData) return currentData;

          return {
            ...currentData,
            orders: currentData.orders.map(order =>
              order.id === orderId
                ? { ...order, status }
                : order
            )
          };
        },
        { revalidate: false } // Don't revalidate immediately
      );

      // Show success toast
      toast({
        title: 'Status Updated',
        description: `Order status has been updated to ${status}`,
      });

      // Revalidate after a short delay
      setTimeout(() => {
        mutate();
      }, 2000);

      return true;
    } catch (error) {
      console.error('Error in updateOrderStatus:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [mutate, toast]);

  /**
   * Refresh the orders data
   */
  const refreshOrders = useCallback(async () => {
    try {
      setLoading(true);
      await mutate();
      return true;
    } catch (error) {
      console.error('Error refreshing orders:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [mutate]);

  return {
    // Data
    orders: data?.orders || [],
    totalCount: data?.totalCount || 0,
    pageCount: data?.pageCount || 0,

    // Status
    isLoading: isLoading || loading,
    isValidating,
    isError: !!error,

    // Actions
    updateOrderStatus,
    refreshOrders,
    mutate
  };
}
