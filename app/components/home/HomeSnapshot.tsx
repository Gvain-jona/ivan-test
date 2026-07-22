'use client';

import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface HomeSnapshotProps {
  /** Sum of outstanding balances across unpaid/partial orders. */
  outstanding: number;
  /** Number of orders awaiting full payment. */
  openCount: number;
  /** Collected / billed across open orders, 0–100. */
  collectionRate: number;
  isLoading: boolean;
}

/**
 * The "momentum" hero card — the print-shop owner's most-wanted number
 * (money owed to them) plus how much of the open-order value is already
 * collected. Analog of the inspiration set's progress card, but every
 * figure is real, derived from the open-orders set.
 */
export default function HomeSnapshot({
  outstanding,
  openCount,
  collectionRate,
  isLoading,
}: HomeSnapshotProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse rounded-3xl border border-border bg-card p-6">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="mt-4 h-9 w-48 rounded bg-muted" />
        <div className="mt-6 h-2.5 w-full rounded-full bg-muted" />
      </div>
    );
  }

  const rate = Math.min(100, Math.max(0, collectionRate));

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          Outstanding balance
        </div>
        <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
          {openCount} {openCount === 1 ? 'order' : 'orders'}
        </span>
      </div>

      <p className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {formatCurrency(outstanding)}
      </p>

      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-muted-foreground">Collected on open orders</span>
          <span className="text-foreground">{rate}%</span>
        </div>
        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={rate}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${rate}%` }}
          />
        </div>
      </div>
    </div>
  );
}
