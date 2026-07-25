'use client';

import { TrendingUp } from 'lucide-react';
import { useFormatCurrency } from '@/hooks/organization/useFormatCurrency';

interface HomeSnapshotProps {
  /** Sum of order totals for the current calendar month. */
  salesThisMonth: number;
  /** Number of orders in the current month (accurate count, not the bounded fetch). */
  orderCount: number;
  isLoading: boolean;
}

/**
 * The "momentum" hero card — this month's sales, the print-shop owner's
 * headline pulse. Scoped to the current calendar month: the figure sums the
 * month's order totals (bounded fetch, same approach as the rest of the feed)
 * and the badge shows the month's order count.
 */
export default function HomeSnapshot({
  salesThisMonth,
  orderCount,
  isLoading,
}: HomeSnapshotProps) {
  const fmt = useFormatCurrency();
  if (isLoading) {
    return (
      <div className="animate-pulse rounded-3xl border border-border bg-card p-6">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="mt-4 h-9 w-48 rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          Sales this month
        </div>
        <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
          {orderCount} {orderCount === 1 ? 'order' : 'orders'}
        </span>
      </div>

      <p className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {fmt(salesThisMonth)}
      </p>
    </div>
  );
}
