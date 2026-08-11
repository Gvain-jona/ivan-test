'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useClients } from '@/hooks/clients/useClients';
import { useDebounce } from '@/hooks/useDebounce';
import { Card, RowDivider, SectionLabel } from '@/components/patterns/screen';
import { FieldBox } from '@/components/patterns/controls';

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

  const { clients, isLoading } = useClients({
    status: 'active',
    search: debounced || undefined,
    limit: 8,
  });

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
                  {/* The frame also shows what each client owes on this row.
                      Omitted rather than faked: `clients` has no balance
                      column, and the figure is a sum over that client's order
                      balances — a scoped aggregate the read layer doesn't have
                      yet. TODO(v2 read layer), tracked in APP_REDESIGN.md. */}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {client.name}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {clientMeta(client.custom_data)}
                    </span>
                  </span>
                </button>
              </div>
            ))}

            {!isLoading && query.trim() !== '' && (
              <>
                {clients.length > 0 && <RowDivider />}
                <button
                  type="button"
                  onClick={() => onCreate(query.trim())}
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
