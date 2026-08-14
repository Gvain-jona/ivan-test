import { money } from '@/lib/api/rollup';

/**
 * The C1 clients list — its per-row rollups and its client-side filtering,
 * kept pure so they can be unit-tested without SWR or the DOM.
 *
 * v2 has no aggregate read layer, so "Owes 180,000 · 12 orders" per client is
 * summed from a bounded fetch of the org's orders, exactly like B1's takings
 * (see lib/api/rollup). Whether those per-row figures are trustworthy is a
 * single `exact` flag the caller carries: if the bounded fetch covered every
 * order the sums are complete, and if it hit the cap they are not — in which
 * case the screen shows neither owing nor count rather than a quietly partial
 * number. The client *count* stays exact regardless (PostgREST counts rows).
 */

export interface ClientRollup {
  /** Sum of the client's order balances. Trustworthy only when the fetch is exact. */
  owing: number;
  orders: number;
}

/** An order as it reaches the rollup — only the two fields the sum needs. */
interface RollupOrder {
  client_id: string | null;
  balance: unknown;
}

/**
 * Group a flat list of orders into per-client owing + order count, keyed by
 * client id. Orders with no client_id are ignored — they can't attach to a row.
 */
export function rollupByClient(orders: RollupOrder[]): Record<string, ClientRollup> {
  const map: Record<string, ClientRollup> = {};
  for (const order of orders) {
    if (!order.client_id) continue;
    const row = map[order.client_id] ?? (map[order.client_id] = { owing: 0, orders: 0 });
    row.owing += money(order.balance);
    row.orders += 1;
  }
  return map;
}

/**
 * The client shape the filter needs — id, name, and the custom_data it reads.
 * `custom_data` is `unknown` because the DB types it as `Json` (a value that
 * could be a string or array, not only an object); customText narrows it.
 */
interface FilterableClient {
  id: string;
  name: string;
  custom_data: unknown;
}

export interface ClientFilters {
  /** Matched against name and the `phone` field; case-insensitive substring. */
  search: string;
  /** A `type` field option value, or null for "any". */
  type: string | null;
  /** Only clients with a positive balance. Meaningful only when the rollup is exact. */
  owing: boolean;
}

function customText(client: FilterableClient, key: string): string {
  const data = client.custom_data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return '';
  const value = (data as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : '';
}

/**
 * Filter the loaded page of clients by the active chip and search box. All
 * three run client-side over the fetched clients: an org's book is small enough
 * to hold, and none of these — an owing test, a custom_data equality, a phone
 * substring — is a column PostgREST could filter without a jsonb path built
 * from a value the client controls. Consistent with the bounded-fetch rollup
 * above; both go away with the metrics layer.
 */
export function filterClients<T extends FilterableClient>(
  clients: T[],
  filters: ClientFilters,
  rollups: Record<string, ClientRollup>,
): T[] {
  const term = filters.search.trim().toLowerCase();
  return clients.filter(client => {
    if (filters.owing && !((rollups[client.id]?.owing ?? 0) > 0)) return false;
    if (filters.type && customText(client, 'type') !== filters.type) return false;
    if (term) {
      const name = client.name.toLowerCase();
      const phone = customText(client, 'phone').toLowerCase();
      if (!name.includes(term) && !phone.includes(term)) return false;
    }
    return true;
  });
}
