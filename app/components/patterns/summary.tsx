'use client';

import { cn } from '@/lib/utils';

/**
 * The money summary block that closes B2, B4, C2 and D2 — a soft panel with no
 * border, rows at 9px, a rule before the figure that matters, and that figure
 * set larger than the rest.
 *
 * `emphasis` is what separates a running total from the number someone is
 * actually looking for; `tone="warning"` marks money still owed.
 */
export function SummaryPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-[9px] rounded-xl bg-muted/40 p-3.5">{children}</div>
  );
}

export function SummaryRow({
  label,
  value,
  emphasis,
  tone,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  tone?: 'warning';
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span
        className={cn(
          'text-[12.5px]',
          emphasis ? 'font-semibold text-foreground' : 'text-muted-foreground',
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'font-semibold',
          emphasis ? 'text-[15.5px]' : 'text-[12.5px] font-medium',
          tone === 'warning' ? 'text-warning' : 'text-foreground',
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function SummaryRule() {
  return <div className="h-px bg-border" />;
}

/**
 * Shown in place of a summary when the figures would only be partly right.
 *
 * A record with more rows than the rollup cap can still be counted exactly but
 * not summed, and a money total that is quietly missing some orders is worse
 * than no total at all — it looks authoritative.
 */
export function SummaryUnavailable({ count, noun }: { count: number; noun: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3.5">
      <p className="text-[12.5px] text-muted-foreground">
        {count.toLocaleString()} {noun} — too many to total here yet. The figures arrive with
        the reporting layer.
      </p>
    </div>
  );
}
