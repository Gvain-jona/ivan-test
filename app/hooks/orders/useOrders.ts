'use client';

import { useCallback } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { SWR_CACHE_TIMES } from '@/lib/swr-config';
import { PLATFORM_API, buildKey, keysUnder, apiFetcher, apiRequest } from '@/lib/api/client';
import type { DatabaseV2 } from '@/types/supabase-v2';

type OrderRow = DatabaseV2['v2']['Tables']['orders']['Row'];
type OrderItemRow = DatabaseV2['v2']['Tables']['order_items']['Row'];
type PaymentRow = DatabaseV2['v2']['Tables']['payments']['Row'];

export type OrderSummary = Omit<OrderRow, 'organization_id' | 'source_id' | 'created_by'> & {
  clients: { name: string } | null;
};

export type OrderDetail = Omit<OrderRow, 'organization_id' | 'source_id' | 'created_by'> & {
  clients: { id: string; name: string } | null;
  order_items: OrderItemRow[];
};

export type Payment = Pick<
  PaymentRow,
  'id' | 'amount' | 'payment_date' | 'payment_method' | 'notes' | 'created_at'
>;

export type OrderListParams = {
  status?: string;
  payment_status?: 'paid' | 'partial' | 'unpaid';
  client_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface OrderItemInput {
  product_id?: string | null;
  product_name_raw?: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  custom_data?: Record<string, unknown>;
}

export interface PaymentInput {
  amount: number;
  payment_method?: 'cash' | 'mobile_money' | 'bank' | 'credit';
  payment_date?: string;
  notes?: string;
}

export interface OrderCreateInput {
  client_id: string;
  order_date?: string;
  status?: string;
  custom_data?: Record<string, unknown>;
  items: OrderItemInput[];
  payments?: PaymentInput[];
}

export interface OrderUpdateInput {
  client_id?: string;
  order_date?: string;
  status?: string;
  custom_data?: Record<string, unknown>;
}

export function useOrders(params: OrderListParams = {}) {
  const key = buildKey(PLATFORM_API.ORDERS, params);
  const { data, error, isLoading, mutate } = useSWR<{ orders: OrderSummary[]; total: number }>(
    key,
    apiFetcher,
    { dedupingInterval: SWR_CACHE_TIMES.LIST_DEDUPE },
  );

  return {
    orders: data?.orders ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}

export function useOrder(id: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR<{
    order: OrderDetail;
    payments: Payment[];
  }>(id ? `${PLATFORM_API.ORDERS}/${id}` : null, apiFetcher, {
    dedupingInterval: SWR_CACHE_TIMES.DETAIL_DEDUPE,
  });

  return {
    order: data?.order ?? null,
    payments: data?.payments ?? [],
    isLoading,
    error,
    mutate,
  };
}

export function useOrderMutations() {
  const { mutate } = useSWRConfig();
  const invalidate = useCallback(
    () => mutate(keysUnder(PLATFORM_API.ORDERS)),
    [mutate],
  );

  /** Atomic: order + items (+ payments) in one DB transaction. */
  const createOrder = useCallback(
    async (input: OrderCreateInput) => {
      const { order } = await apiRequest<{ order: OrderSummary }>(
        PLATFORM_API.ORDERS,
        'POST',
        input,
      );
      await invalidate();
      return order;
    },
    [invalidate],
  );

  const updateOrder = useCallback(
    async (id: string, input: OrderUpdateInput) => {
      const { order } = await apiRequest<{ order: OrderSummary }>(
        `${PLATFORM_API.ORDERS}/${id}`,
        'PATCH',
        input,
      );
      await invalidate();
      return order;
    },
    [invalidate],
  );

  /**
   * Records a payment; the DB trigger recomputes the order's money
   * fields, which come back in the response for immediate cache use.
   */
  const addPayment = useCallback(
    async (orderId: string, input: PaymentInput) => {
      const result = await apiRequest<{
        payment: Payment;
        order: Pick<OrderRow, 'id' | 'total_amount' | 'amount_paid' | 'balance' | 'payment_status'>;
      }>(`${PLATFORM_API.ORDERS}/${orderId}/payments`, 'POST', input);
      await invalidate();
      return result;
    },
    [invalidate],
  );

  return { createOrder, updateOrder, addPayment };
}
