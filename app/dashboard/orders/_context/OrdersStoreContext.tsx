'use client';

import React, { createContext, useContext, ReactNode, useState, useCallback, useMemo } from 'react';
import { useOrders, useOrderMutations } from '@/hooks/orders/useOrders';
import type { OrderSummary } from '@/hooks/orders/useOrders';

/**
 * UI-side filter state for the orders list. Arrays support the
 * multi-select quick filters; they serialize to comma-lists for the
 * API. payment_status values are the v2 generated-column values:
 * 'paid' | 'partial' | 'unpaid'.
 */
export interface OrderListFilters {
  status?: string[];
  paymentStatus?: string[];
  search?: string;
  startDate?: string;
  endDate?: string;
  clientId?: string;
}

interface OrdersStoreContextType {
  orders: OrderSummary[];
  totalCount: number;
  pageCount: number;
  isLoading: boolean;
  filters: OrderListFilters;
  page: number;
  pageSize: number;
  showFilters: boolean;
  setFilters: (f: OrderListFilters) => void;
  setPage: (p: number) => void;
  filterByStatus: (statuses?: string[]) => void;
  toggleFilters: () => void;
  refresh: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: string) => Promise<boolean>;
  /** v2 never hard-deletes: "delete" is a status change to cancelled. */
  cancelOrder: (orderId: string) => Promise<boolean>;
}

const OrdersStoreContext = createContext<OrdersStoreContextType | undefined>(undefined);

const DEFAULT_PAGE_SIZE = 50;

export const OrdersStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filters, setFiltersState] = useState<OrderListFilters>({});
  const [page, setPageState] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = DEFAULT_PAGE_SIZE;

  const params = useMemo(
    () => ({
      status: filters.status?.length ? filters.status.join(',') : undefined,
      payment_status: filters.paymentStatus?.length ? filters.paymentStatus.join(',') : undefined,
      search: filters.search,
      start_date: filters.startDate,
      end_date: filters.endDate,
      client_id: filters.clientId,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    [filters, page, pageSize],
  );

  const { orders, total, isLoading, mutate } = useOrders(params);
  const { updateOrder } = useOrderMutations();

  const setFilters = useCallback((newFilters: OrderListFilters) => {
    setFiltersState(newFilters);
    setPageState(1);
  }, []);

  const setPage = useCallback((newPage: number) => {
    setPageState(newPage);
  }, []);

  const filterByStatus = useCallback((statuses?: string[]) => {
    setFiltersState(prev => ({ ...prev, status: statuses?.length ? statuses : undefined }));
    setPageState(1);
  }, []);

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const updateOrderStatus = useCallback(
    async (orderId: string, status: string) => {
      try {
        await updateOrder(orderId, { status });
        return true;
      } catch {
        return false;
      }
    },
    [updateOrder],
  );

  const cancelOrder = useCallback(
    (orderId: string) => updateOrderStatus(orderId, 'cancelled'),
    [updateOrderStatus],
  );

  return (
    <OrdersStoreContext.Provider
      value={{
        orders,
        totalCount: total,
        pageCount: Math.max(1, Math.ceil(total / pageSize)),
        isLoading,
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
        cancelOrder,
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
