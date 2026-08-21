'use client';

import { Button } from '@/components/ui/button';

/**
 * The error state for a list screen (orders, clients, products, documents).
 *
 * Without it a failed fetch resolves to an empty array and the screen shows its
 * empty state — "No orders yet", sometimes with a first-run CTA — telling a
 * shop whose data just failed to load that it has none. This is the honest
 * alternative: a dashed panel, in the same slot as the empty state, that says
 * the load failed and offers a retry. Mirrors the notifications inbox, which
 * already handles this.
 */
export function ListError({ noun, onRetry }: { noun: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center">
      <p className="text-[13px] font-medium text-foreground">Couldn’t load {noun}</p>
      <p className="mt-1 text-[12px] text-muted-foreground">
        Check your connection and try again.
      </p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
