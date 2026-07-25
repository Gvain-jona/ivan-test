'use client';

import { useCallback } from 'react';
import { useOrganization } from './useOrganization';

/**
 * A currency formatter bound to the org's configured currency
 * (settings.currency) and locale. There is no silent 'UGX' default: until
 * the org sets a currency (via the first-run wizard / org settings), amounts
 * render as plain grouped numbers rather than a wrong currency symbol.
 *
 * Live v2 surfaces (orders, home, products) use this hook; legacy/dark
 * modules keep the standalone formatCurrency util until their cutover.
 */
export function useFormatCurrency() {
  const { currency, locale } = useOrganization();

  return useCallback(
    (value: number) => {
      const amount = Number.isFinite(value) ? value : 0;
      const base = { minimumFractionDigits: 0, maximumFractionDigits: 0 } as const;
      return new Intl.NumberFormat(
        locale ?? undefined,
        currency ? { style: 'currency', currency, ...base } : base,
      ).format(amount);
    },
    [currency, locale],
  );
}
