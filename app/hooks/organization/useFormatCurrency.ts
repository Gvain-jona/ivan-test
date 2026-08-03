'use client';

import { useCallback } from 'react';
import { useOrganization } from './useOrganization';

/**
 * A currency formatter bound to the org's configured currency
 * (settings.locale.currency). There is no silent 'UGX' default: until the
 * org sets a currency (via the first-run wizard / org settings), amounts
 * render as plain grouped numbers rather than a wrong currency symbol.
 *
 * Grouping and symbol placement follow the *reader's* locale, not a stored
 * one. The DB's locale block defines currency, date_format and timezone —
 * it has no BCP-47 tag, and inventing one would only let the org pick a
 * number format on the reader's behalf. Currency is the part that must be
 * org-authoritative; presentation belongs to whoever is looking.
 *
 * Live v2 surfaces (orders, home, products) use this hook; legacy/dark
 * modules keep the standalone formatCurrency util until their cutover.
 */
export function useFormatCurrency() {
  const { currency } = useOrganization();

  return useCallback(
    (value: number) => {
      const amount = Number.isFinite(value) ? value : 0;
      const base = { minimumFractionDigits: 0, maximumFractionDigits: 0 } as const;
      return new Intl.NumberFormat(
        undefined,
        currency ? { style: 'currency', currency, ...base } : base,
      ).format(amount);
    },
    [currency],
  );
}
