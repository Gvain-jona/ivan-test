'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { PLATFORM_API, apiFetcher, buildKey } from '@/lib/api/client';
import { SWR_CACHE_TIMES } from '@/lib/swr-config';
import { useDebounce } from '@/hooks/useDebounce';
import { useFieldDefinitions } from '@/hooks/fields/useFieldDefinitions';
import { useOrderStatuses } from '@/hooks/orders/useOrderStatuses';
import { buildRollup, money, ROLLUP_ROW_CAP, type Rollup } from '@/lib/api/rollup';
import { todayISO } from '@/lib/orders/dates';
import type { OrderSummary } from '@/hooks/orders/useOrders';

export type OrdersFilter = 'all' | 'unpaid' | 'due';

/** How far out "Due soon" reaches. A week is the horizon a print shop works to. */
const DUE_WITHIN_DAYS = 7;

/** First and last day of the month containing `today`, as ISO dates. */
function monthRange(today: string): { start: string; end: string } {
  const [year, month] = today.split('-').map(Number);
  const last = new Date(year, month, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return { start: `${year}-${pad(month)}-01`, end: `${year}-${pad(month)}-${pad(last)}` };
}

/**
 * The orders list (B1) — its filters, its rows, and the two figures above them.
 *
 * The one thing worth knowing here is what "All" means. Per the delete-archives
 * decision, an order that was cancelled drops out of the default list rather
 * than sitting in it wearing a Cancelled chip. That exclusion is computed from
 * the org's own workflow — every status whose `semantic` is `lost` — never from
 * a hardcoded `'cancelled'`, which is the mistake this codebase has now made
 * three times. A status carrying no semantic stays visible: an order sitting in
 * a stage someone later removed is exactly the kind that needs attention.
 */
export function useOrdersList() {
  const [filter, setFilter] = useState<OrdersFilter>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { statuses } = useOrderStatuses();
  const { fieldDefinitions: orderFields } = useFieldDefinitions('order');

  /** "Due soon" is a filter on a date field; an org without one isn't offered it. */
  const hasDueField = orderFields.some(
    field => field.field_type === 'date' && field.status === 'active',
  );

  const liveStatuses = useMemo(
    () => statuses.filter(option => option.semantic !== 'lost').map(option => option.value),
    [statuses],
  );
  const archivedStatuses = useMemo(
    () => statuses.filter(option => option.semantic === 'lost').map(option => option.value),
    [statuses],
  );

  const statusParam = useMemo(() => {
    if (showArchived) return archivedStatuses.length > 0 ? archivedStatuses.join(',') : undefined;
    // Until the workflow loads, send nothing rather than an empty list — an
    // empty `status` would be indistinguishable from "no orders".
    if (liveStatuses.length === 0 || archivedStatuses.length === 0) return undefined;
    return liveStatuses.join(',');
  }, [showArchived, liveStatuses, archivedStatuses]);

  const params = {
    ...(statusParam ? { status: statusParam } : {}),
    ...(filter === 'unpaid' ? { payment_status: 'unpaid,partial' } : {}),
    ...(filter === 'due' && hasDueField ? { due_within_days: DUE_WITHIN_DAYS } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    limit: 50,
  };

  const { data, error, isLoading, mutate } = useSWR<{ orders: OrderSummary[]; total: number }>(
    buildKey(PLATFORM_API.ORDERS, params),
    apiFetcher,
    { dedupingInterval: SWR_CACHE_TIMES.LIST_DEDUPE },
  );

  const { start, end } = monthRange(todayISO());
  const { data: monthData } = useSWR<{ orders: OrderSummary[]; total: number }>(
    buildKey(PLATFORM_API.ORDERS, {
      start_date: start,
      end_date: end,
      limit: ROLLUP_ROW_CAP,
      ...(statusParam ? { status: statusParam } : {}),
    }),
    apiFetcher,
    { dedupingInterval: SWR_CACHE_TIMES.LIST_DEDUPE },
  );

  /**
   * This month's takings, exact or absent — never quietly partial.
   *
   * The count is always right (PostgREST counts rows rather than sampling), so
   * "12 orders this month" holds even when there are too many to total.
   */
  const summary: Rollup<{ sales: number }> = buildRollup(
    monthData?.orders ?? [],
    monthData?.total ?? 0,
    rows => ({ sales: rows.reduce((sum, row) => sum + money(row.total_amount), 0) }),
  );

  const orders = data?.orders ?? [];

  return {
    orders,
    total: data?.total ?? 0,
    isLoading,
    // Only the main list's error gates the screen; the month rollup degrades to
    // "unavailable" on its own and must not blank the list.
    error,
    refresh: mutate,
    summary,
    filter,
    setFilter,
    showArchived,
    setShowArchived,
    hasArchived: archivedStatuses.length > 0,
    hasDueField,
    search,
    setSearch,
    searching: debouncedSearch.length > 0,
    /**
     * True only for a genuinely empty org — no orders and nothing narrowing the
     * view. That is A2's condition; a filter returning nothing is a different
     * message and must not claim the shop has never taken an order.
     */
    isEmptyOrg:
      !isLoading &&
      orders.length === 0 &&
      filter === 'all' &&
      !showArchived &&
      debouncedSearch.length === 0,
  };
}
