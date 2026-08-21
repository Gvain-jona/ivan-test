'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { Search } from 'lucide-react';
import { useClients } from '@/hooks/clients/useClients';
import { useDebounce } from '@/hooks/useDebounce';
import { PLATFORM_API, apiFetcher, buildKey } from '@/lib/api/client';
import { SWR_CACHE_TIMES } from '@/lib/swr-config';
import { ROLLUP_ROW_CAP } from '@/lib/api/rollup';
import { rollupByClient } from '@/lib/clients/list';
import { useFormatCurrency } from '@/hooks/organization/useFormatCurrency';
import { Card, RowDivider, SectionLabel } from '@/components/patterns/screen';
import { FieldBox } from '@/components/patterns/controls';
import type { OrderSummary } from '@/hooks/orders/useOrders';

interface ClientFieldProps {
  clientId: string | null;
  clientName: string | null;
  onSelect: (client: { id: string; name: string }) => void;
  onClear: () => void;
  /** Opens client creation for a name that matched nothing. */
  onCreate: (name: string) => void;
}

/**
 * The order's client, which is a hard FK — an order cannot exist without one.
 *
 * Searching happens **in place**: the field becomes a search box with results
 * beneath it, on the same screen, rather than opening a picker over the form.
 * That is the B2d state of the B2 frame, and it is the rule for every relation
 * on these screens — choosing a value must never cost a second surface, because
 * the surface you'd stack it on is already a sheet on mobile.
 */
export default function ClientField({
  clientId,
  clientName,
  onSelect,
  onClear,
  onCreate,
}: ClientFieldProps) {
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 250);
  const fmt = useFormatCurrency();

  const { clients, isLoading } = useClients({
    status: 'active',
    search: debounced || undefined,
    limit: 8,
  });

  // The "Owes" figure per result — the same bounded, cached order rollup C1
  // uses, on the same query-independent SWR key, so it's fetched once (shared
  // with the clients list's cache) and a keystroke never re-runs it: the search
  // path stays unburdened while the frame's owing figure is honoured. Shown
  // only when the fetch covered every order, exactly like C1 — a partial owing
  // is worse than none.
  const { data: ordersData } = useSWR<{ orders: OrderSummary[]; total: number }>(
    buildKey(PLATFORM_API.ORDERS, { limit: ROLLUP_ROW_CAP }),
    apiFetcher,
    { dedupingInterval: SWR_CACHE_TIMES.LIST_DEDUPE },
  );
  const rollups = useMemo(() => rollupByClient(ordersData?.orders ?? []), [ordersData]);
  const rollupExact = ordersData ? ordersData.orders.length >= ordersData.total : false;

  if (clientId && !searching) {
    return (
      <FieldBox
        label="CLIENT"
        value={clientName}
        onClear={() => {
          onClear();
          setQuery('');
          setSearching(true);
        }}
      />
    );
  }

  return (
    <div className="flex w-full flex-col gap-1.5">
      <SectionLabel>CLIENT</SectionLabel>
      <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-border bg-background px-3">
        <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <input
          autoFocus={searching}
          value={query}
          onChange={event => setQuery(event.target.value)}
          onFocus={() => setSearching(true)}
          placeholder="Search clients"
          aria-label="Search clients"
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
        />
      </div>

      {searching && (
        <div className="mt-1">
          <Card>
            {clients.map((client, index) => (
              <div key={client.id}>
                {index > 0 && <RowDivider />}
                <button
                  type="button"
                  onClick={() => {
                    onSelect({ id: client.id, name: client.name });
                    setSearching(false);
                    setQuery('');
                  }}
                  className="flex w-full items-start justify-between gap-2 px-3.5 py-[11px] text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {client.name}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {clientMeta(client.custom_data)}
                    </span>
                  </span>
                  {/* What the client owes, as the frame draws it — from the same
                      bounded rollup as C1, and only when it's exact. */}
                  {rollupExact && (rollups[client.id]?.owing ?? 0) > 0 && (
                    <span className="flex-shrink-0 text-[12.5px] font-semibold text-warning">
                      Owes {fmt(rollups[client.id].owing)}
                    </span>
                  )}
                </button>
              </div>
            ))}

            {!isLoading && query.trim() !== '' && (
              <>
                {clients.length > 0 && <RowDivider />}
                <button
                  type="button"
                  onClick={() => {
                    // Collapse the in-place search now: the created client is
                    // selected back through onCreate's own path, and with
                    // searching off the field then shows it as the chosen value
                    // rather than staying in the search state over a set client.
                    onCreate(query.trim());
                    setSearching(false);
                    setQuery('');
                  }}
                  className="w-full px-3.5 py-[11px] text-left text-sm font-medium text-primary"
                >
                  New client &ldquo;{query.trim()}&rdquo;
                </button>
              </>
            )}

            {!isLoading && clients.length === 0 && query.trim() === '' && (
              <p className="px-3.5 py-[11px] text-[13px] text-muted-foreground">
                Start typing to find a client.
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

/** Phone and type, when the org happens to track them. */
function clientMeta(customData: unknown): string {
  const data = (customData ?? {}) as Record<string, unknown>;
  const parts = [data.phone, data.type]
    .filter((value): value is string => typeof value === 'string' && value !== '')
    .map(value => value.replace(/_/g, ' '));
  return parts.join(' · ');
}
