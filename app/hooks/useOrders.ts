'use client';

import { useMemo, useState } from 'react';
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

// Fetch orders from the API with debounce and caching
async function fetchOrders(
  filters?: OrdersFilters,
  pagination: PaginationParams = { page: 1, pageSize: 20 }
): Promise<OrdersResponse> {
  // Build query string
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

  if (filters?.clientId) {
    queryParams.append('clientId', filters.clientId);
  }

  // Add pagination
  if (pagination) {
    queryParams.append('limit', pagination.pageSize.toString());
    queryParams.append('offset', ((pagination.page - 1) * pagination.pageSize).toString());
  }

  try {
    // Make the request with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(`/api/orders?${queryParams.toString()}`, {
      signal: controller.signal,
      // Add cache control headers
      headers: {
        'Cache-Control': 'max-age=60' // Cache for 60 seconds
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  }
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

  // Use SWR for data fetching with optimized config
  const { data, error, isLoading, isValidating, mutate } = useSWR<OrdersResponse>(
    cacheKey,
    () => fetchOrders(filters, pagination),
    {
      revalidateOnFocus: false, // Don't revalidate on focus to reduce requests
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 seconds - increased to reduce requests
      keepPreviousData: true, // Keep previous data while fetching new data
      errorRetryCount: 2, // Limit retries
      errorRetryInterval: 5000, // 5 seconds between retries
      loadingTimeout: 15000, // 15 seconds timeout
      focusThrottleInterval: 30000, // Throttle focus events
      revalidateIfStale: true, // Revalidate if data is stale
      revalidateOnMount: true, // Always revalidate on mount
      suspense: false, // Don't use suspense
      onSuccess: (data) => {
        // Log success but don't show toast to avoid UI noise
        console.log(`Successfully fetched ${data?.orders?.length || 0} orders`);
      },
      onError: (err) => {
        console.error('Error fetching orders:', err);
        toast({
          title: 'Error',
          description: 'Failed to fetch orders. Please try again later.',
          variant: 'destructive',
        });
      }
    }
  );

  // Get CRUD operations
  const operations = useOrderOperations();

  // Update order status with optimistic updates
  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    // Find the order to update in the current state
    if (!data?.orders) return false;

    const orderIndex = data.orders.findIndex(o => o.id === orderId);

    if (orderIndex !== -1) {
      // Only update if the status is actually different
      const currentOrder = data.orders[orderIndex];
      if (currentOrder.status !== status) {
        // Create a copy of the current orders
        const updatedOrders = [...data.orders];

        // Update the order status optimistically
        updatedOrders[orderIndex] = {
          ...updatedOrders[orderIndex],
          status,
          updated_at: new Date().toISOString()
        };

        // Update the state immediately for better UX
        mutate({
          ...data,
          orders: updatedOrders
        }, false);
      }
    }

    try {
      // Make API request to update order status
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order status');
      }

      // Revalidate to ensure data consistency
      await mutate();

      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive'
      });

      // Revalidate to revert the optimistic update
      await mutate();

      return false;
    }
  };

  return {
    // SWR data
    orders: data?.orders || [],
    totalCount: data?.totalCount || 0,
    pageCount: data?.pageCount || 0,
    isLoading,
    isValidating,
    isError: !!error,
    isEmpty: data?.orders?.length === 0,
    mutate,

    // CRUD operations
    createOrder: operations.createOrder,
    updateOrder: operations.updateOrder,
    deleteOrder: operations.deleteOrder,
    getOrderById: operations.getOrderById,

    // Enhanced operations
    updateOrderStatus,

    // Loading state for operations
    operationsLoading: operations.loading
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
 * Hook for CRUD operations on orders
 */
export function useOrderOperations() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  /**
   * Create a new order
   */
  const createOrder = async (orderData: Partial<Order>) => {
    try {
      setLoading(true);

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const data = await response.json();

      toast({
        title: 'Success',
        description: 'Order created successfully'
      });

      return data.id;
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to create order',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update an existing order
   */
  const updateOrder = async (orderId: string, orderData: Partial<Order>) => {
    try {
      setLoading(true);

      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: orderId,
          ...orderData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      await response.json(); // Process response but we don't need the data

      toast({
        title: 'Success',
        description: 'Order updated successfully'
      });

      return true;
    } catch (error) {
      console.error(`Error updating order ${orderId}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to update order',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update order status with optimistic updates
   */
  const updateOrderStatus = async (orderId: string, status: OrderStatus, orders: Order[], setOrders: (orders: Order[]) => void) => {
    try {
      // Find the order to update in the current state
      const orderIndex = orders.findIndex(o => o.id === orderId);

      if (orderIndex !== -1) {
        // Only update if the status is actually different
        const currentOrder = orders[orderIndex];
        if (currentOrder.status !== status) {
          // Create a copy of the current orders
          const updatedOrders = [...orders];

          // Update the order status optimistically
          updatedOrders[orderIndex] = {
            ...updatedOrders[orderIndex],
            status,
            updated_at: new Date().toISOString()
          };

          // Update the state immediately for better UX
          setOrders(updatedOrders);
        }
      }

      // Set loading state for UI feedback
      setLoading(true);

      // Make API request to update order status
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order status');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete an order
   */
  const deleteOrder = async (orderId: string) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/orders?id=${orderId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete order');
      }

      toast({
        title: 'Success',
        description: 'Order deleted successfully'
      });

      return true;
    } catch (error) {
      console.error(`Error deleting order ${orderId}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to delete order',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch orders with pagination and filtering
   */
  const fetchOrders = async (filters?: OrdersFilters, pagination: PaginationParams = { page: 1, pageSize: 20 }) => {
    try {
      setLoading(true);

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

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch orders',
        variant: 'destructive'
      });
      return { orders: [], totalCount: 0, pageCount: 0 };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get a single order by ID
   */
  const getOrderById = async (orderId: string) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/orders/${orderId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to fetch order details',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetchOrders,
    createOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    getOrderById
  };
}
