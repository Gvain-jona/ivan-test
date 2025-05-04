'use client';

import { useCallback } from 'react';
import { Order, OrderStatus, PaymentStatus } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { useLoadingSWR } from './useLoadingSWR';
import { useLoading } from '@/components/loading/LoadingProvider';

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
  console.log('Fetching orders from Supabase with filters:', filters);
  try {
    // Create Supabase client
    const supabase = createClient();

    // Check if we have a valid session
    const { data: sessionData } = await supabase.auth.getSession();
    const hasValidSession = !!sessionData?.session;

    // In development mode, we'll allow fetching data without authentication
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!hasValidSession && !isDevelopment) {
      console.error('No valid session found, cannot fetch orders');
      throw new Error('Authentication required');
    }

    console.log(`Fetching orders with ${hasValidSession ? 'valid session' : 'no session'} in ${isDevelopment ? 'development' : 'production'} mode`);

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

    // Order by date descending (newest first)
    query = query.order('date', { ascending: false });

    // First, get the count without applying pagination
    const countQuery = supabase
      .from('orders')
      .select('id', { count: 'exact', head: true });

    // Apply the same filters to the count query
    if (filters?.status && filters.status.length > 0) {
      countQuery.in('status', filters.status);
    }
    if (filters?.paymentStatus && filters.paymentStatus.length > 0) {
      countQuery.in('payment_status', filters.paymentStatus);
    }
    if (filters?.startDate) {
      countQuery.gte('date', filters.startDate);
    }
    if (filters?.endDate) {
      countQuery.lte('date', filters.endDate);
    }
    if (filters?.search) {
      countQuery.or(`id.ilike.%${filters.search}%,order_number.ilike.%${filters.search}%,clients.name.ilike.%${filters.search}%`);
    }
    if (filters?.clientId) {
      countQuery.eq('client_id', filters.clientId);
    }

    // Get the count first
    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error('Error getting count:', countError);
      throw new Error(`Failed to get count: ${countError.message}`);
    }

    // If there are no records, return empty result without trying to fetch
    if (totalCount === 0) {
      console.log('No orders found matching the filters');
      return {
        orders: [],
        totalCount: 0,
        pageCount: 0
      };
    }

    // Calculate the correct page number based on total count
    const maxPage = Math.max(1, Math.ceil(totalCount / pagination.pageSize));
    const safePage = Math.min(pagination.page, maxPage);
    const safeOffset = (safePage - 1) * pagination.pageSize;

    // Apply pagination with safe values
    query = query.range(safeOffset, safeOffset + pagination.pageSize - 1);

    // Execute the query
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    // Transform the data - use a more efficient approach to fetch related data
    // First, get all order IDs
    const orderIds = (data || []).map(order => order.id);

    // Use Promise.all to fetch items and notes in parallel
    const [itemsResult, notesResult] = await Promise.all([
      // Batch fetch items for all orders in a single query
      supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds),

      // Batch fetch notes for all orders in a single query
      supabase
        .from('notes')
        .select('*')
        .eq('linked_item_type', 'order')
        .in('linked_item_id', orderIds)
    ]);

    const allItems = itemsResult.data || [];
    const allNotes = notesResult.data || [];

    // Group items and notes by order_id for quick lookup - use Map for better performance
    const itemsByOrderId = new Map();
    allItems.forEach(item => {
      if (!itemsByOrderId.has(item.order_id)) {
        itemsByOrderId.set(item.order_id, []);
      }
      itemsByOrderId.get(item.order_id).push(item);
    });

    const notesByOrderId = new Map();
    allNotes.forEach(note => {
      if (!notesByOrderId.has(note.linked_item_id)) {
        notesByOrderId.set(note.linked_item_id, []);
      }
      notesByOrderId.get(note.linked_item_id).push(note);
    });

    // Map the orders with their related data
    const transformedOrders = (data || []).map(order => ({
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
      items: itemsByOrderId.get(order.id) || [],
      notes: notesByOrderId.get(order.id) || []
    }));

    return {
      orders: transformedOrders,
      totalCount: totalCount || 0,
      pageCount: Math.ceil((totalCount || 0) / pagination.pageSize)
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
 * Uses our new loading system
 */
export function useOrdersDataNew(
  filters?: OrdersFilters,
  pagination: PaginationParams = { page: 1, pageSize: 20 }
) {
  const { toast } = useToast();
  const { startLoading, stopLoading } = useLoading();

  // Generate a stable cache key
  const cacheKey = generateCacheKey(filters, pagination);
  const loadingId = 'orders-data';

  // Use our custom SWR hook with loading state management
  const { data, error, isLoading, isValidating, mutate } = useLoadingSWR<OrdersResponse>(
    cacheKey,
    () => fetchOrdersFromSupabase(filters, pagination),
    loadingId,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30 * 60 * 1000, // 30 minutes - increased to reduce API calls
      keepPreviousData: true,
      refreshInterval: 0,
      revalidateIfStale: false,
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
      startLoading(`order-status-${orderId}`);

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
      stopLoading(`order-status-${orderId}`);
    }
  }, [mutate, toast, startLoading, stopLoading]);

  // Determine if we have actual data loaded
  const hasData = !!data && Array.isArray(data.orders);

  return {
    // Data
    orders: hasData ? data.orders : [],
    totalCount: hasData ? data.totalCount : 0,
    pageCount: hasData ? data.pageCount : 0,

    // Status
    isLoading,
    isValidating,
    isError: !!error,
    isEmpty: !hasData || data.orders.length === 0,

    // Actions
    updateOrderStatus,
    mutate
  };
}
