'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Currency } from '@/lib/organization/currencies';

/**
 * The two row forms the currency picker renders: a compact chip for the
 * shortlist and a full-width row for the browsable list. Both are real radios
 * sharing the `currency` group name — they're two presentations of one choice,
 * so selecting in either clears the other.
 */

/** The shortlist's compact form. */
export function CurrencyChip({
  code,
  name,
  selected,
  onSelect,
}: {
  code: string;
  name: string;
  selected: boolean;
  onSelect: (code: string) => void;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-setup-panel',
        selected
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-setup-surface text-muted-foreground hover:border-primary/40',
      )}
    >
      {/* A real radio keeps group semantics and arrow-key navigation; the
          visible box below is the styling. */}
      <input
        type="radio"
        name="currency"
        value={code}
        checked={selected}
        onChange={() => onSelect(code)}
        className="sr-only"
      />
      <span
        aria-hidden
        className={cn(
          'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border',
          selected
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-setup-surface',
        )}
      >
        {selected && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <span>
        {code} · {name}
      </span>
    </label>
  );
}

/** A row in the browsable list: symbol, name, and the code as a quiet aside. */
export function CurrencyListRow({
  currency,
  selected,
  onSelect,
}: {
  currency: Currency;
  selected: boolean;
  onSelect: (code: string) => void;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors',
        'focus-within:bg-primary/10 hover:bg-primary/5',
        selected && 'bg-primary/10',
      )}
    >
      <input
        type="radio"
        name="currency"
        value={currency.code}
        checked={selected}
        onChange={() => onSelect(currency.code)}
        className="sr-only"
      />
      <span
        aria-hidden
        className={cn(
          'flex h-7 w-9 flex-shrink-0 items-center justify-center rounded-md border text-[11px] font-bold',
          selected
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-setup-panel text-muted-foreground',
        )}
      >
        {selected ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : currency.symbol}
      </span>
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-[13px]',
          selected ? 'font-semibold text-primary' : 'text-foreground',
        )}
      >
        {currency.name}
      </span>
      <span className="flex-shrink-0 font-mono text-[11px] tracking-wider text-muted-foreground">
        {currency.code}
      </span>
    </label>
  );
}
