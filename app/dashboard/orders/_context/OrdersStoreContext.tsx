'use client';

import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { Order, OrderStatus, OrdersTableFilters } from '@/types/orders';
import { useOrders } from '@/hooks/useOrders';
import { useOrderMetrics, OrderMetrics } from '@/hooks/useOrderMetrics';

interface OrdersStoreContextType {
  orders: Order[];
  totalCount: number;
  pageCount: number;
  metrics: OrderMetrics | undefined;
  isLoading: boolean;
  isValidating: boolean;
  isMetricsLoading: boolean;
  filters: OrdersTableFilters;
  page: number;
  pageSize: number;
  showFilters: boolean;
  setFilters: (f: OrdersTableFilters) => void;
  setPage: (p: number) => void;
  filterByStatus: (statuses?: OrderStatus[]) => void;
  toggleFilters: () => void;
  refresh: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<boolean>;
  deleteOrder: (orderId: string) => Promise<boolean>;
}

const OrdersStoreContext = createContext<OrdersStoreContextType | undefined>(undefined);

const DEFAULT_PAGE_SIZE = 50;

export const OrdersStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filters, setFiltersState] = useState<OrdersTableFilters>({});
  const [page, setPageState] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = DEFAULT_PAGE_SIZE;

  const {
    orders,
    totalCount,
    pageCount,
    isLoading,
    isValidating,
    mutate,
    updateOrderStatus,
    deleteOrder,
  } = useOrders(filters, { page, pageSize });

  const { metrics, isLoading: isMetricsLoading } = useOrderMetrics(filters);

  const setFilters = useCallback((newFilters: OrdersTableFilters) => {
    setFiltersState(newFilters);
    setPageState(1);
  }, []);

  const setPage = useCallback((newPage: number) => {
    setPageState(newPage);
  }, []);

  const filterByStatus = useCallback((statuses?: OrderStatus[]) => {
    setFiltersState(prev => ({
      ...prev,
      status: statuses?.length ? statuses : undefined,
    }));
    setPageState(1);
  }, []);

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return (
    <OrdersStoreContext.Provider
      value={{
        orders,
        totalCount,
        pageCount,
        metrics,
        isLoading,
        isValidating,
        isMetricsLoading,
        filters,
        page,
        pageSize,
        showFilters,
        setFilters,
        setPage,
        filterByStatus,
        toggleFilters,
        refresh,
        updateOrderStatus,
        deleteOrder,
      }}
    >
      {children}
    </OrdersStoreContext.Provider>
  );
};

export const useOrdersStore = (): OrdersStoreContextType => {
  const ctx = useContext(OrdersStoreContext);
  if (!ctx) throw new Error('useOrdersStore must be used within an OrdersStoreProvider');
  return ctx;
};
