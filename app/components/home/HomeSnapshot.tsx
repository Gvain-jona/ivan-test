'use client';

import { Clock, Package } from 'lucide-react';
import { useFormatCurrency } from '@/hooks/organization/useFormatCurrency';
import { Skeleton } from '@/components/ui/skeleton';

interface HomeSnapshotProps {
  /** Sum of order totals for the current calendar month. */
  salesThisMonth: number;
  /** Number of orders in the current month (accurate count, not the bounded fetch). */
  orderCount: number;
  /** Outstanding balance across the loaded order book — "still to collect". */
  toCollect: number;
  /** Open orders past the quotation stage. */
  inProcessCount: number;
  isLoading: boolean;
}

/**
 * The H1 snapshot card: two headline figures — this month's sales and what's
 * still to collect — over two sub-stats (orders this month, orders in process).
 * The figures are approximate over the bounded feed fetch, same basis as the
 * rest of Home; TODO(v2 read layer) when analytics cuts over.
 */
export default function HomeSnapshot({
  salesThisMonth,
  orderCount,
  toCollect,
  inProcessCount,
  isLoading,
}: HomeSnapshotProps) {
  const fmt = useFormatCurrency();

  if (isLoading) {
    return (
      // Ghost-card container (the standard v2 placeholder shell) with the
      // shared Skeleton primitive for the blocks inside — was plain `bg-muted`,
      // the one fill that didn't match the primitive's (LOAD-02).
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-28" />
          </div>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-stretch">
        <Figure label="Sales this month" value={fmt(salesThisMonth)} />
        <div className="mx-4 w-px bg-border" />
        <Figure label="Still to collect" value={fmt(toCollect)} tone="warning" />
      </div>

      <div className="mt-4 flex items-center gap-4 border-t border-border pt-3.5">
        <SubStat icon={Package} text={`${orderCount} ${orderCount === 1 ? 'order' : 'orders'} this month`} />
        <SubStat icon={Clock} text={`${inProcessCount} in process`} />
      </div>
    </div>
  );
}

function Figure({ label, value, tone }: { label: string; value: string; tone?: 'warning' }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-[11.5px] font-medium text-muted-foreground">{label}</p>
      <p
        className={`mt-1 truncate text-[22px] font-bold tracking-tight ${
          tone === 'warning' ? 'text-warning' : 'text-foreground'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function SubStat({ icon: Icon, text }: { icon: typeof Clock; text: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {text}
    </span>
  );
}
