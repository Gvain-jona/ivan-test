'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The list-screen vocabulary shared by B1 (orders) and C1 (clients) — and D1
 * (products) next. Promoted out of `orders/list/list-parts` at C1 so the two
 * lists speak one language rather than forking it, the same move `screen-parts`
 * made into `patterns/screen` before B2. Entity-specific pieces (each list's
 * empty state) stay local to their feature.
 */

/**
 * One half of a summary card. `tone="warning"` colours the value for a
 * money-owed figure (C1's "Still to collect"); the default is plain foreground
 * (B1's counts and sales).
 */
export function Figure({
  value,
  label,
  tone = 'default',
}: {
  value: string;
  label: string;
  tone?: 'default' | 'warning';
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-[3px]">
      <span
        className={cn(
          'text-[15.5px] font-bold',
          tone === 'warning' ? 'text-warning' : 'text-foreground',
        )}
      >
        {value}
      </span>
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
  icon: LucideIcon;
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
