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
  /** `products` is the embedded catalogue name; null for a one-off line. */
  order_items: (OrderItemRow & { products: { name: string } | null })[];
};

export type Payment = Pick<
  PaymentRow,
  'id' | 'amount' | 'payment_date' | 'payment_method' | 'reference' | 'notes' | 'created_at'
>;

export type OrderItem = Omit<OrderItemRow, 'organization_id' | 'source_id' | 'updated_at'>;

/** What a line write hands back: the order's money, recomputed by the trigger. */
export type OrderMoney = Pick<
  OrderRow,
  'id' | 'total_amount' | 'amount_paid' | 'balance' | 'payment_status'
>;

export type OrderListParams = {
  /** Single value or comma-separated list (multi-select filters). */
  status?: string;
  /** 'paid' | 'partial' | 'unpaid' — single or comma-separated. */
  payment_status?: string;
  client_id?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
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
  /** Mobile money transaction id, cheque number, bank slip. */
  reference?: string;
  notes?: string;
}

/**
 * The order-level discount: the figure the user typed, not the money it comes
 * to. The DB derives the amount (`v2.order_discount_amount`) and the totals
 * trigger applies it, so nothing here ever states a total.
 *
 * Distinct from `OrderItemInput.discount`, which is an absolute amount off a
 * single line. This one is off the whole order and can be a percentage.
 *
 * `null` clears it; omitting the key leaves whatever is there.
 */
interface OrderDiscountInput {
  discount_type?: 'amount' | 'percent' | null;
  /** ≤ 100 when the type is 'percent' — enforced by schema and DB CHECK. */
  discount_value?: number;
}

export interface OrderCreateInput extends OrderDiscountInput {
  client_id: string;
  order_date?: string;
  status?: string;
  custom_data?: Record<string, unknown>;
  items: OrderItemInput[];
  payments?: PaymentInput[];
}

export interface OrderUpdateInput extends OrderDiscountInput {
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

  /**
   * Lines on an order that already exists. Creation puts them inside
   * `create_order`; afterwards they are their own rows.
   *
   * No client-side total arithmetic anywhere here: `trg_items_totals` fires on
   * insert/update/delete and `recompute_order_totals()` decides what the order
   * comes to, so each call returns the order's money and the cache takes it.
   */
  const addItem = useCallback(
    async (orderId: string, input: OrderItemInput) => {
      const result = await apiRequest<{ item: OrderItem; order: OrderMoney }>(
        `${PLATFORM_API.ORDERS}/${orderId}/items`,
        'POST',
        input,
      );
      await invalidate();
      return result;
    },
    [invalidate],
  );

  const updateItem = useCallback(
    async (orderId: string, itemId: string, input: Partial<OrderItemInput>) => {
      const result = await apiRequest<{ item: OrderItem; order: OrderMoney }>(
        `${PLATFORM_API.ORDERS}/${orderId}/items/${itemId}`,
        'PATCH',
        input,
      );
      await invalidate();
      return result;
    },
    [invalidate],
  );

  const removeItem = useCallback(
    async (orderId: string, itemId: string) => {
      const result = await apiRequest<{ order: OrderMoney }>(
        `${PLATFORM_API.ORDERS}/${orderId}/items/${itemId}`,
        'DELETE',
      );
      await invalidate();
      return result;
    },
    [invalidate],
  );

  return { createOrder, updateOrder, addPayment, addItem, updateItem, removeItem };
}
