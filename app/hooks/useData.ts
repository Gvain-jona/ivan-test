'use client';

import { useLoadingSWR, useFetch } from './useLoadingSWR';
import { SWRConfiguration } from 'swr';
import { dataService } from '@/lib/supabase';
import { Order, OrderStatus, PaymentStatus } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { useLoading } from '@/components/loading/LoadingProvider';

/**
 * Consolidated data fetching module
 * This module provides a single source of truth for all data fetching in the application
 * It uses SWR for caching and revalidation, and the loading provider for loading states
 */

// API endpoints
export const API_ENDPOINTS = {
  ORDERS: '/api/orders',
  ORDERS_OPTIMIZED: '/api/orders/optimized', // New optimized endpoint
  EXPENSES: '/api/expenses',
  MATERIALS: '/api/materials',
  TASKS: '/api/tasks',
  DASHBOARD: '/api/dashboard',
  CLIENTS: '/api/clients',
  CATEGORIES: '/api/categories',
  ITEMS: '/api/items',
  SIZES: '/api/sizes',
  SUPPLIERS: '/api/suppliers',

  // Dropdown endpoints
  DROPDOWN_CLIENTS: '/api/dropdown/clients',
  DROPDOWN_CATEGORIES: '/api/dropdown/categories',
  DROPDOWN_ITEMS: '/api/dropdown/items',
  DROPDOWN_SIZES: '/api/dropdown/sizes',
  DROPDOWN_SUPPLIERS: '/api/dropdown/suppliers',
};

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
  // Enable revalidation when reconnecting to prevent stale data after connection loss
  revalidateOnReconnect: true,
  // Keep previous data while fetching new data to prevent flashing
  keepPreviousData: true,
  // Cache data for 60 seconds to reduce unnecessary requests
  dedupingInterval: 60000, // 60 seconds
  // Retry failed requests up to 3 times
  errorRetryCount: 3,
  // Set a 10 second timeout for loading states
  loadingTimeout: 10000, // 10 seconds
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
  dedupingInterval: 300000, // 5 minutes
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
  expenses: async () => await dataService.getExpenses(),
  expense: async (id: string) => await dataService.getExpenseById(id),
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
 * Fetches orders directly from Supabase with server-side filtering
 * This function includes robust error handling and fallback mechanisms
 */
async function fetchOrdersFromSupabase(
  filters?: OrdersFilters,
  pagination: PaginationParams = { page: 1, pageSize: 20 }
): Promise<OrdersResponse> {
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
      // Return empty data instead of throwing
      return {
        orders: [],
        totalCount: 0,
        pageCount: 0
      };
    }

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
      query = query.or(`id.ilike.%${filters.search}%,order_number.ilike.%${filters.search}%`);
    }

    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId);
    }

    // Order by date descending (newest first)
    query = query.order('date', { ascending: false });

    // Apply pagination
    query = query.range(offset, offset + pagination.pageSize - 1);

    // Execute the query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      // Return empty data instead of throwing
      return {
        orders: [],
        totalCount: 0,
        pageCount: 0
      };
    }

    // If no data, return empty response
    if (!data || data.length === 0) {
      return {
        orders: [],
        totalCount: 0,
        pageCount: 0
      };
    }

    // Transform the data - use a more efficient approach to fetch related data
    // First, get all order IDs
    const orderIds = data.map(order => order.id);

    // Use Promise.all to fetch items and notes in parallel
    // Wrap in try/catch to handle errors gracefully
    let allItems: any[] = [];
    let allNotes: any[] = [];

    try {
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

      allItems = itemsResult.data || [];
      allNotes = notesResult.data || [];
    } catch (error) {
      console.error('Error fetching related data:', error);
      // Continue with empty related data
    }

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
    const transformedOrders = data.map(order => ({
      id: order.id,
      order_number: order.order_number || `ORD-${order.id.substring(0, 8)}`,
      client_id: order.client_id,
      client_name: order.clients?.name || 'Unknown Client',
      client_type: order.client_type || 'regular',
      date: order.date || new Date().toISOString().split('T')[0],
      status: order.status || 'pending',
      payment_status: order.payment_status || 'unpaid',
      payment_method: order.payment_method || '',
      total_amount: order.total_amount || 0,
      amount_paid: order.amount_paid || 0,
      balance: order.balance || 0,
      created_by: order.created_by || '',
      created_at: order.created_at || new Date().toISOString(),
      updated_at: order.updated_at || new Date().toISOString(),
      items: itemsByOrderId.get(order.id) || [],
      notes: notesByOrderId.get(order.id) || []
    }));

    return {
      orders: transformedOrders,
      totalCount: count || 0,
      pageCount: Math.ceil((count || 0) / pagination.pageSize)
    };
  } catch (error) {
    console.error('Error in fetchOrdersFromSupabase:', error);
    // Return empty data instead of throwing
    return {
      orders: [],
      totalCount: 0,
      pageCount: 0
    };
  }
}

/**
 * Generate a stable cache key for SWR
 */
function generateCacheKey(filters?: OrdersFilters, pagination?: PaginationParams): string {
  return JSON.stringify({
    endpoint: 'orders-optimized',
    filters,
    pagination
  });
}

/**
 * Generate a URL with query parameters for the optimized orders API
 * Works in both client and server environments
 */
function generateOrdersUrl(filters?: OrdersFilters, pagination: PaginationParams = { page: 1, pageSize: 20 }): string | null {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const url = new URL(API_ENDPOINTS.ORDERS_OPTIMIZED, window.location.origin);

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
export function useOrders(filters?: OrdersFilters, pagination: PaginationParams = { page: 1, pageSize: 20 }, config?: SWRConfiguration) {
  const { toast } = useToast();
  const { startLoading, stopLoading } = useLoading();
  const loadingId = 'orders-data';

  // Generate a stable cache key
  const cacheKey = generateCacheKey(filters, pagination);

  // Temporarily use direct Supabase fetch until optimized API is implemented
  const { data, error, isLoading, isValidating, mutate } = useLoadingSWR<OrdersResponse>(
    cacheKey,
    async () => {
      try {
        // Use direct Supabase fetch with robust error handling
        const result = await fetchOrdersFromSupabase(filters, pagination);
        return result;
      } catch (error) {
        console.error('Error fetching orders:', error);
        // Return empty data instead of throwing
        return {
          orders: [],
          totalCount: 0,
          pageCount: 0
        };
      }
    },
    loadingId,
    {
      ...DEFAULT_CONFIG,
      ...config,
      // Increase retry count for better reliability
      errorRetryCount: 3,
      // Use a more aggressive retry delay
      errorRetryInterval: 2000,
      // Increase dedupingInterval to reduce requests
      dedupingInterval: 120000, // 2 minutes
      // Show toast only for non-network errors
      onError: (err) => {
        // Check if it's a network error
        const isNetworkError = err instanceof Error &&
          (err.message.includes('fetch') || err.message.includes('network'));

        // Log the error but don't spam the console
        if (!isNetworkError) {
          console.error('Error fetching orders:', err);

          // Only show toast for non-network errors and only in production
          if (process.env.NODE_ENV === 'production') {
            toast({
              title: 'Error',
              description: 'Failed to fetch orders. Please try again.',
              variant: 'destructive',
            });
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
 * Fetches a single order by ID
 */
async function fetchOrderById(id: string): Promise<Order> {
  try {
    // Create Supabase client
    const supabase = createClient();

    // Get the order
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        clients:client_id (id, name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      throw new Error(`Failed to fetch order: ${error.message}`);
    }

    if (!data) {
      throw new Error('Order not found');
    }

    // Get order items
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', id);

    // Get order notes
    const { data: notes } = await supabase
      .from('notes')
      .select('*')
      .eq('linked_item_type', 'order')
      .eq('linked_item_id', id);

    // Transform the order
    const order: Order = {
      id: data.id,
      order_number: data.order_number,
      client_id: data.client_id,
      client_name: data.clients?.name || 'Unknown Client',
      client_type: data.client_type || 'regular',
      date: data.date,
      status: data.status,
      payment_status: data.payment_status,
      payment_method: data.payment_method,
      total_amount: data.total_amount || 0,
      amount_paid: data.amount_paid || 0,
      balance: data.balance || 0,
      created_by: data.created_by,
      created_at: data.created_at,
      updated_at: data.updated_at,
      items: items || [],
      notes: notes || []
    };

    return order;
  } catch (error) {
    console.error('Error in fetchOrderById:', error);
    throw error;
  }
}

export function useOrder(id?: string, config?: SWRConfiguration) {
  const { toast } = useToast();
  const loadingId = `order-${id}`;

  const { data, error, isLoading, mutate } = useLoadingSWR<Order>(
    id ? `${API_ENDPOINTS.ORDERS}/${id}` : null,
    () => fetchOrderById(id!),
    loadingId,
    {
      ...DEFAULT_CONFIG,
      ...config,
      onError: (err) => {
        console.error('Error fetching order:', err);
        toast({
          title: 'Error',
          description: 'Failed to fetch order details. Please try again.',
          variant: 'destructive',
        });
      }
    }
  );

  return {
    order: data,
    isLoading,
    isError: !!error,
    isEmpty: !data,
    mutate,
  };
}

// Expenses hooks
export function useExpenses(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useLoadingSWR(
    API_ENDPOINTS.EXPENSES,
    () => fetchers.expenses(),
    'expenses',
    { ...DEFAULT_CONFIG, ...config }
  );

  return {
    expenses: data || [],
    isLoading,
    isError: !!error,
    isEmpty: !data || data.length === 0,
    mutate,
  };
}

export function useExpense(id?: string, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useLoadingSWR(
    id ? `${API_ENDPOINTS.EXPENSES}/${id}` : null,
    () => fetchers.expense(id!),
    `expense-${id}`,
    { ...DEFAULT_CONFIG, ...config }
  );

  return {
    expense: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}

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
