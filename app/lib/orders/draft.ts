/**
 * The shape of an order while it is still being composed on B2, and the money
 * it comes to.
 *
 * Nothing here is authoritative. `v2.recompute_order_totals()` computes the
 * real figures from the rows once the order exists, applying the org's
 * `currency_scale()`; this module exists so the screen can show the person a
 * running total *before* that happens. The two agree on the arithmetic — line
 * total, then order discount, then payments — which is the part that matters.
 *
 * Deliberately unrounded: `useFormatCurrency` renders every amount at 0dp
 * already, so rounding here would be a second, invented rule sitting in front
 * of the DB's. Exact numbers in, the formatter decides presentation, and the
 * stored figures come back from the create response.
 */

export interface DraftItem {
  /** Client-side identity for list operations — never sent. */
  key: string;
  product_id: string | null;
  /** Set instead of product_id when the line is a one-off. */
  product_name_raw?: string;
  /** What the row shows; for a catalogue line this is the product's name. */
  name: string;
  /** The second line of the row — category, size, whatever the org tracks. */
  meta?: string;
  quantity: number;
  unit_price: number;
  /** An absolute amount off this line, not a percentage. */
  discount?: number;
  custom_data?: Record<string, unknown>;
}

export interface DraftPayment {
  key: string;
  amount: number;
  payment_method: 'cash' | 'mobile_money' | 'bank' | 'credit';
  payment_date: string;
  reference?: string;
  notes?: string;
}

export interface DraftNote {
  key: string;
  content: string;
  custom_data?: Record<string, unknown>;
}

/** The figure the user typed, never the money it resolves to. */
export interface DraftDiscount {
  type: 'amount' | 'percent' | null;
  value: number;
}

export interface DraftTotals {
  subtotal: number;
  discountAmount: number;
  total: number;
  paid: number;
  balance: number;
}

/**
 * One line's contribution to the subtotal.
 *
 * Floored at zero: a per-line discount larger than the line is a typo, and a
 * negative line would quietly subtract from the rest of the order.
 */
export function lineTotal(item: Pick<DraftItem, 'quantity' | 'unit_price' | 'discount'>): number {
  const gross = item.quantity * item.unit_price;
  return Math.max(0, gross - (item.discount ?? 0));
}

/**
 * What the order discount comes to against a given subtotal.
 *
 * Mirrors `v2.order_discount_amount()`: a percent applies to the subtotal, an
 * amount is taken as typed, and neither may exceed the subtotal — an order
 * cannot be discounted into a negative total.
 */
export function discountAmount(subtotal: number, discount: DraftDiscount): number {
  if (discount.type === null || !Number.isFinite(discount.value) || discount.value <= 0) return 0;
  const raw =
    discount.type === 'percent' ? (subtotal * Math.min(discount.value, 100)) / 100 : discount.value;
  return Math.min(Math.max(raw, 0), subtotal);
}

export function draftTotals({
  items,
  discount,
  payments,
}: {
  items: DraftItem[];
  discount: DraftDiscount;
  payments: DraftPayment[];
}): DraftTotals {
  const subtotal = items.reduce((sum, item) => sum + lineTotal(item), 0);
  const amount = discountAmount(subtotal, discount);
  const total = subtotal - amount;
  const paid = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

  return {
    subtotal,
    discountAmount: amount,
    total,
    paid,
    // Overpayment shows as a negative balance rather than being clamped to
    // zero: money that arrived and isn't owed is something someone must see.
    balance: total - paid,
  };
}

/** The label a discount row carries — "Discount (10%)" vs plain "Discount". */
export function discountLabel(discount: DraftDiscount): string {
  return discount.type === 'percent' && discount.value > 0
    ? `Discount (${discount.value}%)`
    : 'Discount';
}
