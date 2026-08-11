'use client';

import { Package, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-[3px]">
      <span className="text-[15.5px] font-bold text-foreground">{value}</span>
      <span className="text-[10.5px] font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

export function QuickAction({
  icon: Icon,
  label,
  onClick,
  primary,
}: {
  icon: typeof Plus;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-[7px] rounded-full px-[11px] py-2.5 text-[13px] font-semibold',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        primary
          ? 'bg-primary text-primary-foreground'
          : 'border border-border bg-card text-foreground',
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={2} />
      {label}
    </button>
  );
}

export function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </button>
  );
}

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
