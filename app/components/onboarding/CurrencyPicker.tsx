'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CURRENCY_OPTIONS } from '@/lib/organization/presets';
import { ALL_CURRENCIES, type Currency } from '@/lib/organization/currencies';
import { SectionLabel } from './SetupShell';
import { CurrencyChip, CurrencyListRow } from './currency-picker-parts';

const COMMON_CODES = new Set(CURRENCY_OPTIONS.map(c => c.code));

/**
 * A shortlist of the currencies this shop most likely uses, and a searchable
 * list of every other one underneath.
 *
 * Browsing, never typing. An earlier version asked for an ISO-4217 code in a
 * text box, which is the app asking the user to know a standard's name and
 * recall a three-letter code from memory — a guess with no feedback until it's
 * wrong. Every currency is reachable by the name a person would search for.
 *
 * Was a step of its own until A1 folded currency into the business form; it is
 * now the body of the sheet that form opens, which is why it carries no footer —
 * a choice sets the value and closes the sheet.
 */
export default function CurrencyPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const [query, setQuery] = useState('');

  // A choice made from the long list joins the shortlist, so what's selected
  // is always visible without scrolling back to find it.
  const selectedOutsideCommon = useMemo(
    () => (value && !COMMON_CODES.has(value) ? findCurrency(value) : null),
    [value],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_CURRENCIES;
    return ALL_CURRENCIES.filter(
      c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    // One choice split across two sections, so it's one radio group: a
    // <fieldset> rather than two role="radiogroup" containers that would each
    // claim to be the whole thing.
    <fieldset className="space-y-5 border-0 p-0">
      <legend className="sr-only">Currency</legend>

      <div className="space-y-2">
        <SectionLabel>Common currencies</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {CURRENCY_OPTIONS.map(c => (
            <CurrencyChip
              key={c.code}
              code={c.code}
              name={c.label}
              selected={value === c.code}
              onSelect={onChange}
            />
          ))}
          {selectedOutsideCommon && (
            <CurrencyChip
              code={selectedOutsideCommon.code}
              name={selectedOutsideCommon.name}
              selected
              onSelect={onChange}
            />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <SectionLabel>All currencies</SectionLabel>
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search by country or currency"
            aria-label="Search currencies"
            className="pl-9"
          />
        </div>

        <div className="max-h-64 overflow-y-auto rounded-xl border border-border bg-setup-surface">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-[13px] text-muted-foreground">
              No currency matches &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {results.map(c => (
                <li key={c.code}>
                  <CurrencyListRow currency={c} selected={value === c.code} onSelect={onChange} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </fieldset>
  );
}

export function findCurrency(code: string): Currency {
  return ALL_CURRENCIES.find(c => c.code === code) ?? { code, name: code, symbol: code };
}
