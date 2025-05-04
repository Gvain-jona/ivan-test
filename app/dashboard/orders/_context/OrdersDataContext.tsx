'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo } from 'react';
import { Order, OrderStatus, PaymentStatus } from '@/types/orders';
import { useOrders, OrdersFilters, PaginationParams } from '@/hooks/useData';
import { createSWRConfig } from '@/lib/swr-config';
import { useToast } from '@/components/ui/use-toast';

// Define the context type
interface OrdersDataContextType {
  // Data
  orders: Order[];
  totalCount: number | undefined;
  pageCount: number;

  // Loading states
  initialLoading: boolean;
  loading: boolean;
  isValidating: boolean;

  // Filters and pagination
  currentFilters: OrdersFilters;
  currentPagination: PaginationParams;
  setCurrentFilters: (filters: OrdersFilters) => void;
  setCurrentPagination: (pagination: PaginationParams) => void;

  // Actions
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<boolean>;
  handleLoadMore: (showToast?: boolean) => Promise<void>;
}

// Create the context
const OrdersDataContext = createContext<OrdersDataContextType | undefined>(undefined);

// Provider component
export const OrdersDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();

  // State for initial loading
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // State for filters and pagination
  const [currentFilters, setCurrentFilters] = useState<OrdersFilters>({});
  const [currentPagination, setCurrentPagination] = useState<PaginationParams>({
    page: 1,
    pageSize: 100 // Reduced page size to prevent timeouts while still getting enough data
  });

  // Memoize filters and pagination to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => currentFilters, [
    currentFilters.status?.join(','),
    currentFilters.paymentStatus?.join(','),
    currentFilters.startDate,
    currentFilters.endDate,
    currentFilters.search,
    currentFilters.clientId
  ]);

  const memoizedPagination = useMemo(() => currentPagination, [
    currentPagination.page,
    currentPagination.pageSize
  ]);

  // Use the orders hook to fetch data
  const {
    orders,
    totalCount,
    pageCount,
    isLoading: ordersLoading,
    isValidating,
    mutate: refreshOrders,
    isEmpty,
    updateOrderStatus: apiUpdateOrderStatus
  } = useOrders(
    memoizedFilters || {},
    memoizedPagination || { page: 1, pageSize: 100 },
    createSWRConfig('list', {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      fallbackData: { orders: [], totalCount: 0, pageCount: 0 }
    })
  );

  // Update loading state when orders are loaded
  useEffect(() => {
    if (ordersLoading && !dataLoaded) {
      setInitialLoading(true);
    } else if (!ordersLoading) {
      setInitialLoading(false);
      setLoading(false);
      setDataLoaded(true);
    }
  }, [ordersLoading, dataLoaded]);

  // Handle loading more orders
  const handleLoadMore = async (showToast = true) => {
    setLoading(true);
    try {
      await refreshOrders();
      if (showToast) {
        toast({
          title: "Data Refreshed",
          description: "The latest orders data has been loaded.",
        });
      }
    } catch (error) {
      console.error('Error refreshing orders:', error);
      toast({
        title: "Error",
        description: "Failed to refresh orders data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Wrap the updateOrderStatus function to handle loading state
  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setLoading(true);
    try {
      const result = await apiUpdateOrderStatus(orderId, status);
      return result;
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const contextValue = {
    // Data
    orders: orders || [],
    totalCount,
    pageCount,

    // Loading states
    initialLoading,
    loading,
    isValidating,

    // Filters and pagination
    currentFilters,
    currentPagination,
    setCurrentFilters,
    setCurrentPagination,

    // Actions
    refreshOrders,
    updateOrderStatus,
    handleLoadMore
  };

  return (
    <OrdersDataContext.Provider value={contextValue}>
      {children}
    </OrdersDataContext.Provider>
  );
};

// Hook to use the orders data context
export const useOrdersData = () => {
  const context = useContext(OrdersDataContext);
  if (context === undefined) {
    throw new Error('useOrdersData must be used within an OrdersDataProvider');
  }
  return context;
};
