'use client';

import { formatFieldValue } from '@/lib/fields/format';
import type { Client } from '@/hooks/clients/useClients';
import type { FieldDefinition } from '@/hooks/fields/useFieldDefinitions';
import type { ClientRollup } from '@/lib/clients/list';

/**
 * One client on C1: who they are, and — when the rollup is exact — what they
 * owe and how many orders they've placed.
 *
 * A settled client shows just their order count; only a client with money on
 * them carries the "Owes" line, in the same `warning` tone C2 uses for an
 * outstanding balance. When the orders fetch didn't cover everything (`exact`
 * false), the figures are dropped entirely rather than shown partial.
 */
export default function ClientListRow({
  client,
  rollup,
  exact,
  typeField,
  fmt,
  onOpen,
}: {
  client: Client;
  rollup: ClientRollup | undefined;
  exact: boolean;
  typeField: FieldDefinition | null;
  fmt: (value: number) => string;
  onOpen: () => void;
}) {
  const custom = (client.custom_data ?? {}) as Record<string, unknown>;
  const phone = typeof custom.phone === 'string' && custom.phone.trim() !== '' ? custom.phone : null;
  const typeLabel = typeField ? formatFieldValue(custom.type, typeField) : null;
  const subtitle = [phone, typeLabel].filter(Boolean).join(' · ');

  const owing = rollup?.owing ?? 0;
  const orders = rollup?.orders ?? 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 px-3.5 py-[13px] text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold text-foreground">{client.name}</div>
        {subtitle && (
          <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{subtitle}</div>
        )}
      </div>

      {exact && (
        <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
          {owing > 0 && (
            <span className="text-[13.5px] font-semibold text-warning">Owes {fmt(owing)}</span>
          )}
          <span className="text-[11.5px] text-muted-foreground">
            {orders} {orders === 1 ? 'order' : 'orders'}
          </span>
        </div>
      )}
    </button>
  );
}
