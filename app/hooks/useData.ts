'use client';

import React, { useCallback, useMemo } from 'react';
import { useLoadingSWR, useFetch } from './useLoadingSWR';
import { SWRConfiguration } from 'swr';
import { createSWRConfig, SWR_CACHE_TIMES, SWR_RETRY } from '@/lib/swr-config';
import { dataService } from '@/lib/supabase';
import { Order, OrderStatus, PaymentStatus } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/utils/supabase/client';
import { useLoading } from '@/components/loading/LoadingProvider';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import { getOrdersListKey, getOrderKey } from '@/lib/cache-keys';

/**
 * Consolidated data fetching module
 * This module provides a single source of truth for all data fetching in the application
 * It uses SWR for caching and revalidation, and the loading provider for loading states
 */

// API endpoints are now imported from lib/api-endpoints.ts

/**
 * SWR Configuration
 * These configurations should match the ones in the SWRProvider
 */

// Default SWR configuration
const DEFAULT_CONFIG: SWRConfiguration = {
  // Disable automatic revalidation on window focus to prevent unnecessary requests
  revalidateOnFocus: false,
  // Only revalidate stale data when explicitly triggered
  revalidateIfStale: false,
  // Disable revalidation when reconnecting to reduce API calls
  revalidateOnReconnect: false,
  // Keep previous data while fetching new data to prevent flashing
  keepPreviousData: true,
  dedupingInterval: SWR_CACHE_TIMES.STATS_DEDUPE,
  errorRetryCount: SWR_RETRY.LIST_COUNT,
  // Set a 5 second timeout for loading states
  loadingTimeout: 5000, // 5 seconds
  // Throttle focus events to reduce unnecessary revalidations
  focusThrottleInterval: 60000, // 1 minute
};

// Configuration for dropdown data (longer cache time)
const DROPDOWN_CONFIG: SWRConfiguration = {
  ...DEFAULT_CONFIG,
  dedupingInterval: 120000, // 2 minutes
};

// Configuration for dashboard data (longer cache time)
const DASHBOARD_CONFIG: SWRConfiguration = {
  ...DEFAULT_CONFIG,
  dedupingInterval: SWR_CACHE_TIMES.LIST_DEDUPE,
};

// Define response types
export interface OrdersResponse {
  orders: Order[];
  totalCount: number;
  pageCount: number;
}

// Define filter types
export interface OrdersFilters {
  status?: OrderStatus[];
  paymentStatus?: PaymentStatus[];
  startDate?: string;
  endDate?: string;
  search?: string;
  clientId?: string;
}

// Define pagination types
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// Custom fetchers that use our data service
const fetchers = {
  orders: async () => await dataService.getOrders(),
  order: async (id: string) => await dataService.getOrderById(id),
  // Expense fetchers are now handled in the expenses directory
  materials: async () => await dataService.getMaterials(),
  material: async (id: string) => await dataService.getMaterialById(id),
  tasks: async () => await dataService.getTasks(),
  task: async (id: string) => await dataService.getTaskById(id),
  dashboardStats: async () => await dataService.getDashboardStats(),
  clients: async () => await dataService.getClients(),
  categories: async () => await dataService.getCategories(),
  items: async (categoryId: string) => await dataService.getItems(categoryId),
  sizes: async () => await dataService.getSizes(),
  suppliers: async () => await dataService.getSuppliers(),
};

/**
 * Generate a stable cache key for SWR using our centralized cache key utility
 */
function generateCacheKey(filters?: OrdersFilters, pagination?: PaginationParams): string {
  return getOrdersListKey(filters, pagination);
}

/**
 * Generate a URL with query parameters for the optimized orders API
 * Works in both client and server environments
 */
function generateOrdersUrl(filters?: OrdersFilters, pagination: PaginationParams = { page: 1, pageSize: 50 }): string | null {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const url = new URL(`${API_ENDPOINTS.ORDERS}/optimized`, window.location.origin);

    // Add pagination parameters
    url.searchParams.append('page', pagination.page.toString());
    url.searchParams.append('pageSize', pagination.pageSize.toString());

    // Add filter parameters
    if (filters?.status && filters.status.length > 0) {
      url.searchParams.append('status', filters.status.join(','));
    }

    if (filters?.paymentStatus && filters.paymentStatus.length > 0) {
      url.searchParams.append('paymentStatus', filters.paymentStatus.join(','));
    }

    if (filters?.startDate) {
      url.searchParams.append('startDate', filters.startDate);
    }

    if (filters?.endDate) {
      url.searchParams.append('endDate', filters.endDate);
    }

    if (filters?.search) {
      url.searchParams.append('search', filters.search);
    }

    if (filters?.clientId) {
      url.searchParams.append('clientId', filters.clientId);
    }

    return url.toString();
  } catch (error) {
    console.error('Error generating orders URL:', error);
    return null;
  }
}

// Orders hooks
export function useOrders(filters?: OrdersFilters, pagination: PaginationParams = { page: 1, pageSize: 100 }, config?: SWRConfiguration) {
  const { toast } = useToast();
  const { startLoading, stopLoading } = useLoading();
  const loadingId = 'orders-data';

  const errorToastShownRef = React.useRef(false);

  // Generate a stable cache key
  const cacheKey = generateCacheKey(filters, pagination);

  // Use the optimized API endpoint
  const url = generateOrdersUrl(filters, pagination);

  // Create a standardized SWR config for list data
  const swrConfig = createSWRConfig('list', {
    ...config,
    // Reduce retry count to avoid excessive retries
    errorRetryCount: 1,
    // Use a longer retry delay
    errorRetryInterval: 5000, // 5 seconds
    // Disable automatic revalidation to reduce API calls
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0,
    // Keep previous data to avoid flashing
    keepPreviousData: true,
  });

  const { data, error, isLoading, isValidating, mutate } = useLoadingSWR<OrdersResponse>(
    url || cacheKey,
    async (fetchUrl) => {
      // During SSR of client components window is undefined and url is null;
      // cacheKey is used as the key in that case but can't be fetched.
      if (!fetchUrl || !fetchUrl.startsWith('http')) {
        return { orders: [], totalCount: 0, pageCount: 0 };
      }

      const response = await fetch(fetchUrl, {
        headers: { 'Cache-Control': 'max-age=60' },
      });

      if (!response.ok) {
        throw new Error(`Orders API error ${response.status}: ${response.statusText}`);
      }

      errorToastShownRef.current = false;
      return await response.json();
    },
    loadingId,
    {
      ...swrConfig,
      // Show toast only for non-network errors and only once
      onError: (err) => {
        // Check if it's a network error
        const isNetworkError = err instanceof Error &&
          (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('abort') || err.message.includes('timeout'));

        // Log the error but don't spam the console
        if (!isNetworkError) {
          console.error('Error fetching orders:', err);

          // Only show toast for non-network errors when we have no data at all
          // This prevents showing error toasts when data is actually loaded successfully
          if (!data?.orders?.length && !errorToastShownRef.current) {
            toast({
              title: 'Error',
              description: 'Failed to fetch orders. Please try again.',
              variant: 'destructive',
            });
            errorToastShownRef.current = true;
          }
        }
      }
    }
  );

  // Update order status function
  const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<boolean> => {
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
  };

  return {
    // Data
    orders: data?.orders || [],
    totalCount: data?.totalCount || 0,
    pageCount: data?.pageCount || 0,

    // Status
    isLoading,
    isValidating,
    isError: !!error,
    isEmpty: !data || !data.orders || data.orders.length === 0,

    // Actions
    updateOrderStatus,
    mutate,
  };
}

/**
 * Fetches a single order by ID with all related data in parallel
 * @param id The order ID
 */
async function fetchOrderById(id: string): Promise<Order> {
  try {
    // Create Supabase client
    const supabase = createClient();

    // Fetch all data in parallel for better performance
    const [
      orderResult,
      itemsResult,
      paymentsResult,
      notesResult
    ] = await Promise.all([
      // Get the order
      supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single(),

      // Get order items
      supabase
        .from('order_items')
        .select('*')
        .eq('order_id', id),

      // Get order payments
      supabase
        .from('order_payments')
        .select('*')
        .eq('order_id', id)
        .order('date', { ascending: false }),

      // Get order notes
      supabase
        .from('notes')
        .select('*')
        .eq('linked_item_type', 'order')
        .eq('linked_item_id', id)
    ]);

    // Handle order data errors
    if (orderResult.error) {
      console.error('Error fetching order:', orderResult.error);
      throw new Error(`Failed to fetch order: ${orderResult.error.message}`);
    }

    if (!orderResult.data) {
      throw new Error('Order not found');
    }

    // Log any errors for related data but don't fail the request
    if (itemsResult.error) {
      console.error('Error fetching order items:', itemsResult.error);
    }

    if (paymentsResult.error) {
      console.error('Error fetching order payments:', paymentsResult.error);
    }

    if (notesResult.error) {
      console.error('Error fetching order notes:', notesResult.error);
    }

    // Process payments data
    const payments = (paymentsResult.data || []).map(payment => ({
      id: payment.id,
      order_id: payment.order_id,
      amount: payment.amount,
      // Map both naming conventions for compatibility
      payment_date: payment.payment_date || payment.date,
      date: payment.date || payment.payment_date,
      payment_method: payment.payment_method || payment.payment_type,
      payment_type: payment.payment_type || payment.payment_method,
      created_at: payment.created_at,
      updated_at: payment.updated_at
    }));

    // Process notes data
    const notes = (notesResult.data || []).map(note => ({
      id: note.id,
      type: note.type || 'info',
      text: note.text || '',
      linked_item_type: note.linked_item_type || 'order',
      linked_item_id: note.linked_item_id,
      created_by: note.created_by,
      created_by_name: 'User', // We don't have profiles data anymore
      created_at: note.created_at,
      updated_at: note.updated_at
    }));

    // Transform the order
    const order: Order = {
      id: orderResult.data.id,
      order_number: orderResult.data.order_number,
      client_id: orderResult.data.client_id,
      client_name: orderResult.data.client_name || 'Unknown Client',
      client_type: orderResult.data.client_type || 'regular',
      date: orderResult.data.date,
      status: orderResult.data.status,
      payment_status: orderResult.data.payment_status,
      delivery_date: orderResult.data.delivery_date,
      is_delivered: orderResult.data.is_delivered || false,
      total_amount: orderResult.data.total_amount || 0,
      amount_paid: orderResult.data.amount_paid || 0,
      balance: orderResult.data.balance || 0,
      created_by: orderResult.data.created_by,
      created_at: orderResult.data.created_at,
      updated_at: orderResult.data.updated_at,
      items: itemsResult.data || [],
      payments: payments,
      notes: notes
    };

    return order;
  } catch (error) {
    console.error('Error in fetchOrderById:', error);
    throw error;
  }
}

export function useOrder(
  keyOrId: string | null,
  config?: SWRConfiguration & {
    fallbackData?: Order
  }
) {
  // Convert orderId to a consistent cache key if it's not already a full key
  const key = useMemo(() => {
    if (!keyOrId) return null;
    // If it's already a full URL or API path, use it as is
    if (keyOrId.includes('/api/') || keyOrId.includes('http')) {
      return keyOrId;
    }
    // Otherwise, assume it's an order ID and generate a consistent key
    return getOrderKey(keyOrId);
  }, [keyOrId]);
  const { toast } = useToast();
  // Extract the ID from the key if it exists
  const id = key ? key.split('/').pop() : undefined;
  const loadingId = `order-${id}`;

  // Extract fallbackData from config
  const { fallbackData, ...restConfig } = config || {};

  // Create a standardized SWR config for order details
  const swrConfig = createSWRConfig('detail', restConfig);

  // Use a stable fetcher function to avoid unnecessary rerenders
  const fetcher = useCallback(async () => {
    if (!id) return null;
    return fetchOrderById(id);
  }, [id]);

  const { data, error, isLoading, mutate } = useLoadingSWR<Order>(
    key,
    fetcher,
    loadingId,
    {
      // Use our standardized config as the base
      ...swrConfig,
      // Use fallbackData if provided to avoid loading state
      fallbackData,
      onError: (err) => {
        // Only log and show errors that aren't network-related
        const isNetworkError = err instanceof Error &&
          (err.message.includes('fetch') || err.message.includes('network'));

        if (!isNetworkError) {
          console.error('Error fetching order:', err);
          toast({
            title: 'Error',
            description: 'Failed to fetch order details. Please try again.',
            variant: 'destructive',
          });
        }
      }
    }
  );

  // Enhanced mutate function that handles optimistic updates better
  const refreshOrder = useCallback(async (optimisticData?: any, shouldRevalidate: boolean = true) => {
    try {
      // If optimistic data is provided, update the cache immediately
      if (optimisticData) {
        // Update the cache with the optimistic data
        await mutate(optimisticData, false);

        // If we should revalidate, do it after a short delay
        if (shouldRevalidate) {
          // Use a longer delay to allow multiple optimistic updates to batch
          setTimeout(() => mutate(), 1000);
        }
      } else {
        // Just do a normal revalidation
        return mutate();
      }
    } catch (error) {
      console.error('Error in refreshOrder:', error);
      // Revalidate to ensure data consistency
      return mutate();
    }
  }, [mutate]);

  return {
    order: data,
    isLoading,
    isError: !!error,
    isEmpty: !data,
    mutate: refreshOrder,
  };
}

// Expenses hooks are now imported from './expenses' directory
// See app/hooks/useExpenses.ts for the re-exports

// Materials hooks
export function useMaterials(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useLoadingSWR(
    API_ENDPOINTS.MATERIALS,
    () => fetchers.materials(),
    'materials',
    { ...DEFAULT_CONFIG, ...config }
  );

  return {
    materials: data || [],
    isLoading,
    isError: !!error,
    isEmpty: !data || data.length === 0,
    mutate,
  };
}

export function useMaterial(id?: string, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useLoadingSWR(
    id ? `${API_ENDPOINTS.MATERIALS}/${id}` : null,
    () => fetchers.material(id!),
    `material-${id}`,
    { ...DEFAULT_CONFIG, ...config }
  );

  return {
    material: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}

// Tasks hooks
export function useTasks(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useLoadingSWR(
    API_ENDPOINTS.TASKS,
    () => fetchers.tasks(),
    'tasks',
    { ...DEFAULT_CONFIG, ...config }
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
    () => fetchers.task(id!),
    `task-${id}`,
    { ...DEFAULT_CONFIG, ...config }
  );

  return {
    task: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}

// Dashboard hooks
export function useDashboardStats(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useLoadingSWR(
    API_ENDPOINTS.DASHBOARD,
    () => fetchers.dashboardStats(),
    'dashboard-stats',
    { ...DASHBOARD_CONFIG, ...config }
  );

  return {
    stats: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}

// Dropdown data hooks
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

// Generic data fetching hook
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

// Types for dropdown options
export interface DropdownOption {
  value: string;
  label: string;
  [key: string]: any; // Additional metadata
}

// Dropdown hooks
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
    async (url) => {
      const res = await fetch(url);
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

/**
 * Hook to fetch only the payments for an order
 * This is used to lazy-load payments data when viewing an order
 */
export function useOrderPayments(orderId?: string, config?: SWRConfiguration) {
  const { toast } = useToast();
  const loadingId = `order-payments-${orderId}`;

  // Create the URL
  const url = orderId ? `/api/orders/${orderId}/payments` : null;

  // Only log in development
  const logDebug = (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[useOrderPayments] ${message}`, data);
    }
  };

  logDebug('URL:', url);

  // Create a standardized SWR config for detail data
  const swrConfig = createSWRConfig('detail', {
    ...config,
  });

  const { data, error, isLoading, mutate } = useLoadingSWR<OrderPayment[]>(
    url,
    async () => {
      try {
        // Fetch from the API endpoint
        const response = await fetch(url!);
        if (!response.ok) {
          throw new Error(`Failed to fetch payments: ${response.statusText}`);
        }

        const data = await response.json();

        logDebug('API response received');

        // The API returns { payments: [...] }
        if (data && Array.isArray(data.payments)) {
          return data.payments;
        } else if (data && typeof data === 'object') {
          // If the API returns the payments directly
          return Array.isArray(data) ? data : [];
        }

        return [];
      } catch (error) {
        console.error('Error in fetchOrderPayments:', error);
        throw error;
      }
    },
    loadingId,
    {
      ...swrConfig,
      onError: (err) => {
        console.error('Error fetching order payments:', err);
        toast({
          title: 'Error',
          description: 'Failed to fetch payment details. Please try again.',
          variant: 'destructive',
        });
      }
    }
  );

  return {
    payments: data || [],
    isLoading,
    isError: !!error,
    isEmpty: !data || data.length === 0,
    mutate,
  };
}
