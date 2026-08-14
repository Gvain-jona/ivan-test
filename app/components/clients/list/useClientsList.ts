'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { PLATFORM_API, apiFetcher, buildKey } from '@/lib/api/client';
import { SWR_CACHE_TIMES } from '@/lib/swr-config';
import { useDebounce } from '@/hooks/useDebounce';
import { useClients } from '@/hooks/clients/useClients';
import { useFieldDefinitions, type FieldDefinition } from '@/hooks/fields/useFieldDefinitions';
import { buildRollup, money, ROLLUP_ROW_CAP, type Rollup } from '@/lib/api/rollup';
import { normalizeOptions, type FieldOption } from '@/lib/fields/options';
import { rollupByClient, filterClients } from '@/lib/clients/list';
import type { OrderSummary } from '@/hooks/orders/useOrders';

/**
 * The clients list (C1) — its rows, its two summary figures, and its filters.
 *
 * Mirrors useOrdersList: the org's clients and a bounded fetch of its orders
 * are pulled separately, and the per-client "owes / N orders" is summed from
 * the orders here rather than served by an aggregate the DB doesn't have yet.
 * The single `exact` flag says whether that sum is complete; the screen shows a
 * real figure or none, never a quietly partial one.
 */
export function useClientsList() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [owingOnly, setOwingOnly] = useState(false);

  // The active client book, and a bounded slice of orders to total against it.
  const { clients, total, isLoading } = useClients({ status: 'active', limit: ROLLUP_ROW_CAP });

  const { data: ordersData } = useSWR<{ orders: OrderSummary[]; total: number }>(
    buildKey(PLATFORM_API.ORDERS, { limit: ROLLUP_ROW_CAP }),
    apiFetcher,
    { dedupingInterval: SWR_CACHE_TIMES.LIST_DEDUPE },
  );

  const orders = useMemo(() => ordersData?.orders ?? [], [ordersData]);

  const rollups = useMemo(() => rollupByClient(orders), [orders]);

  /** Total owed to the shop across every order — the "Still to collect" figure. */
  const outstanding: Rollup<{ total: number }> = useMemo(
    () =>
      buildRollup(orders, ordersData?.total ?? 0, rows => ({
        total: rows.reduce((sum, row) => sum + money(row.balance), 0),
      })),
    [orders, ordersData],
  );

  /**
   * Type chips (Regular / Contract / …) come from the org's own `type` field
   * options, never hardcoded — an org that renamed or removed the field gets
   * different chips, or none, for free. Same lesson as order statuses.
   */
  const { fieldDefinitions: clientFields } = useFieldDefinitions('client');
  const typeField: FieldDefinition | null = useMemo(
    () =>
      clientFields.find(
        field => field.field_name === 'type' && field.field_type === 'select',
      ) ?? null,
    [clientFields],
  );
  const typeOptions: FieldOption[] = useMemo(
    () => (typeField ? normalizeOptions(typeField.options) : []),
    [typeField],
  );

  const filtered = useMemo(
    () =>
      filterClients(
        clients,
        { search: debouncedSearch, type: typeFilter, owing: owingOnly },
        rollups,
      ),
    [clients, debouncedSearch, typeFilter, owingOnly, rollups],
  );

  return {
    clients: filtered,
    total,
    isLoading,
    rollups,
    /** Whether per-row owing/counts are trustworthy — see lib/clients/list. */
    exact: outstanding.exact,
    outstanding,
    typeField,
    typeOptions,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    owingOnly,
    setOwingOnly,
    searching: debouncedSearch.trim().length > 0,
    /** A genuinely empty org — no clients and nothing narrowing the view. */
    isEmptyOrg:
      !isLoading &&
      total === 0 &&
      !owingOnly &&
      typeFilter === null &&
      debouncedSearch.trim().length === 0,
  };
}
