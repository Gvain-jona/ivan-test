'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import { Order, OrderStatus, OrdersTableFilters, PaginationParams, OrdersResponse } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';

const DEFAULT_PAGE_SIZE = 50;

function buildOrdersUrl(filters?: OrdersTableFilters, pagination?: PaginationParams): string {
  const params = new URLSearchParams();

  if (pagination) {
    params.set('limit', String(pagination.pageSize ?? DEFAULT_PAGE_SIZE));
    params.set('offset', String(((pagination.page ?? 1) - 1) * (pagination.pageSize ?? DEFAULT_PAGE_SIZE)));
  }

  if (filters?.status?.length) {
    filters.status.forEach(s => params.append('status', s));
  }
  if (filters?.paymentStatus?.length) {
    filters.paymentStatus.forEach(s => params.append('paymentStatus', s));
  }
  if (filters?.startDate) params.set('startDate', filters.startDate);
  if (filters?.endDate) params.set('endDate', filters.endDate);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.clientName) params.set('search', filters.clientName);

  return `/api/orders?${params.toString()}`;
}

async function fetchOrders(url: string): Promise<OrdersResponse> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export function useOrders(
  filters?: OrdersTableFilters,
  pagination: PaginationParams = { page: 1, pageSize: DEFAULT_PAGE_SIZE },
) {
  const { toast } = useToast();

  const url = useMemo(
    () => buildOrdersUrl(filters, pagination),
    [filters, pagination],
  );

  const { data, error, isLoading, isValidating, mutate } = useSWR<OrdersResponse>(
    url,
    fetchOrders,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5 * 60 * 1000,
      keepPreviousData: true,
      errorRetryCount: 2,
      errorRetryInterval: 3000,
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to fetch orders. Please try again.',
          variant: 'destructive',
        });
      },
    },
  );

  const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<boolean> => {
    if (!data?.orders) return false;

    const prev = data;
    mutate(
      {
        ...data,
        orders: data.orders.map(o =>
          o.id === orderId ? { ...o, status, updated_at: new Date().toISOString() } : o,
        ),
      },
      false,
    );

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? 'Failed to update status');
      }

      await mutate();
      return true;
    } catch (err) {
      mutate(prev, false);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update order status',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteOrder = async (orderId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/orders?id=${orderId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete order');
      await mutate();
      toast({ title: 'Success', description: 'Order deleted successfully' });
      return true;
    } catch {
      toast({ title: 'Error', description: 'Failed to delete order', variant: 'destructive' });
      return false;
    }
  };

  return {
    orders: data?.orders ?? [],
    totalCount: data?.totalCount ?? 0,
    pageCount: data?.pageCount ?? 0,
    isLoading,
    isValidating,
    isError: !!error,
    mutate,
    updateOrderStatus,
    deleteOrder,
  };
}

export function useOrder(id?: string) {
  const { toast } = useToast();

  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/orders/${id}` : null,
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch order');
      return res.json() as Promise<{ order: Order }>;
    },
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to fetch order details',
          variant: 'destructive',
        });
      },
    },
  );

  return {
    order: data?.order ?? null,
    isLoading,
    isError: !!error,
    mutate,
  };
}
