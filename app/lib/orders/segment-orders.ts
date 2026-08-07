import type { FieldOption } from '@/lib/fields/options';

/**
 * Grouping orders by the state someone acts on.
 *
 * Keyed on the status option's `semantic` (open | won | lost), never on the
 * status value itself. Status values are org-defined — a print shop's are
 * design/printing/finishing, a sign shop's are something else entirely — so
 * matching literal strings only works for whoever's workflow got hardcoded.
 *
 * That is not hypothetical: this list previously matched `pending`,
 * `in_progress`, `paused` and `completed`, none of which exist in the shipped
 * print-shop workflow, so every order between quotation and delivered landed
 * in a catch-all bucket labelled "Other".
 *
 * `semantic` is the system's classification; the labels here are the user's
 * words for it. That split is the whole point — an org renaming "Printing" to
 * "On the press" changes nothing below.
 */

export type OrderSemantic = NonNullable<FieldOption['semantic']>;

/** The minimum an order needs for segmenting. */
export interface SegmentableOrder {
  status: string;
  payment_status: string | null;
}

export interface OrderGroup<T> {
  key: string;
  label: string;
  items: T[];
}

const SEGMENTS: {
  key: string;
  label: string;
  match: (order: SegmentableOrder, semantic: OrderSemantic) => boolean;
}[] = [
  {
    key: 'in_progress',
    label: 'In progress',
    match: (_order, semantic) => semantic === 'open',
  },
  {
    key: 'awaiting',
    label: 'Awaiting payment',
    match: (order, semantic) => semantic === 'won' && order.payment_status !== 'paid',
  },
  {
    key: 'completed',
    label: 'Completed',
    match: (order, semantic) => semantic === 'won' && order.payment_status === 'paid',
  },
  {
    key: 'cancelled',
    label: 'Cancelled',
    match: (_order, semantic) => semantic === 'lost',
  },
];

/** Maps each status value to its semantic, for the workflow's options. */
export function semanticIndex(statuses: readonly FieldOption[]): Map<string, OrderSemantic> {
  const index = new Map<string, OrderSemantic>();
  for (const status of statuses) {
    if (status.semantic) index.set(status.value, status.semantic);
  }
  return index;
}

/**
 * Groups orders in segment order, dropping empty groups and putting anything
 * unclassifiable last.
 *
 * An order lands in "Other" only when its status carries no semantic — either
 * the workflow doesn't define one, or the order holds a value that has since
 * been removed from the workflow. Both are worth showing rather than hiding:
 * they are orders someone still has to deal with.
 */
export function segmentOrders<T extends SegmentableOrder>(
  orders: readonly T[],
  semantics: ReadonlyMap<string, OrderSemantic>,
): OrderGroup<T>[] {
  const buckets = new Map<string, T[]>();

  for (const order of orders) {
    const semantic = semantics.get(order.status);
    const segment = semantic
      ? SEGMENTS.find(candidate => candidate.match(order, semantic))
      : undefined;
    const key = segment?.key ?? 'other';
    const bucket = buckets.get(key);
    if (bucket) bucket.push(order);
    else buckets.set(key, [order]);
  }

  const labels = new Map(SEGMENTS.map(s => [s.key, s.label]));
  labels.set('other', 'Other');

  return [...SEGMENTS.map(s => s.key), 'other']
    .map(key => ({ key, label: labels.get(key) ?? 'Other', items: buckets.get(key) ?? [] }))
    .filter(group => group.items.length > 0);
}
