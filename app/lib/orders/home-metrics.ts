import type { FieldOption } from '@/lib/fields/options';
import { semanticIndex } from './segment-orders';

/** The minimum a Home metric needs from an order. */
export interface HomeMetricOrder {
  status: string;
  balance: number | null;
}

export interface HomeMetrics<T extends HomeMetricOrder> {
  /** Sum of outstanding balances — "still to collect". */
  toCollect: number;
  /** Open orders that are past the quotation stage — "in process". */
  inProcessCount: number;
  /** Orders still sitting in the quotation stage — the Active quotations feed. */
  quotations: T[];
}

/**
 * The Home feed's headline numbers, derived from the loaded order set.
 *
 * The "quotation" stage is found from the workflow's own default status option
 * (`is_default`, falling back to the first), never a hardcoded `'quotation'`
 * string — an org renames its stages, and the canvas separates ACTIVE
 * QUOTATIONS from ORDERS on exactly that split. `in process` is the remaining
 * open work; `to collect` sums outstanding balances. Pure, so the split and
 * the sums are unit-tested without a fetch. Approximate over a bounded fetch,
 * same basis as the sales figure — TODO(v2 read layer): back with a metrics
 * accessor when analytics cuts over.
 */
export function homeMetrics<T extends HomeMetricOrder>(
  orders: readonly T[],
  statuses: readonly FieldOption[],
): HomeMetrics<T> {
  const quotationValue = statuses.find(s => s.is_default)?.value ?? statuses[0]?.value ?? null;
  const semantics = semanticIndex(statuses);

  const quotations: T[] = [];
  let inProcessCount = 0;
  let toCollect = 0;

  for (const order of orders) {
    toCollect += Math.max(0, order.balance ?? 0);

    if (quotationValue !== null && order.status === quotationValue) {
      quotations.push(order);
    } else if (semantics.get(order.status) === 'open') {
      inProcessCount += 1;
    }
  }

  return { toCollect, inProcessCount, quotations };
}
