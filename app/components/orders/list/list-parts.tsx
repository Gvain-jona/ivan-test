'use client';

import { Package, Plus } from 'lucide-react';

// The generic list vocabulary (summary figures, quick-action chips, filter
// chips) now lives in patterns/list so C1/D1 share it with B1 rather than
// forking it. Re-exported here so B1's imports keep resolving from './list-parts'.
export { Figure, QuickAction, Chip } from '@/components/patterns/list';

/**
 * A2 when the org has never taken an order, and a narrower message when a
 * filter or a search simply matched nothing. Conflating the two would tell a
 * shop with 200 orders that it has none.
 */
export function EmptyState({
  emptyOrg,
  searching,
  onCreate,
}: {
  emptyOrg: boolean;
  searching: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center">
      <Package className="mx-auto h-6 w-6 text-muted-foreground" />
      <p className="mt-2 text-sm font-medium text-foreground">
        {emptyOrg ? 'No orders yet' : searching ? 'Nothing matches that search' : 'Nothing here'}
      </p>
      <p className="mt-1 text-[13px] text-muted-foreground">
        {emptyOrg
          ? 'Your first order starts the list — and everything else follows from it.'
          : searching
            ? 'Try a client name or an order number.'
            : 'No orders under this filter right now.'}
      </p>
      {emptyOrg && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-4 inline-flex items-center gap-[7px] rounded-full bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          New order
        </button>
      )}
    </div>
  );
}
