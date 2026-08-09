/**
 * Reading a frozen document snapshot.
 *
 * `issue_document()` builds this at issue time and nothing may change it
 * afterwards — `protect_issued_documents` rejects the attempt. So this is the
 * authority for what a document *says*, and rendering must read it rather than
 * re-deriving from the order, which has moved on.
 *
 * Shape confirmed by reading the function source on 2026-08-07 (see
 * DB_ASKS.md), not inferred:
 *
 *   meta         { document_type, document_number, order_number, order_date,
 *                  order_count, issued_at }   order_number/date null when >1
 *   issuer       ← settings.identity, verbatim
 *   recipient    { client_id, name, fields{} }
 *   order_fields { <field_label>: <value> }   top level only when 1 order
 *   orders       [ { order_id, order_number, order_date, lines_total,
 *                    discount_total, total, discount_type, discount_value,
 *                    fields{} } ]
 *   lines        [ { order_number, description, quantity, unit_price,
 *                    discount, total, fields{} } ]
 *   totals       { currency, subtotal, discount_total, discount_type,
 *                  discount_value, tax_total, total, tax_label, tax_rate,
 *                  tax_registered, amounts_include_tax }
 *   terms        { terms_days, due_date, valid_until, footer, bank_details }
 *
 * Every accessor tolerates absence. A snapshot written by an older version of
 * the function is still a legal document and must still render — which is the
 * whole reason it's frozen.
 */

export interface SnapshotLine {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  /** Which order this line came from — the only way to group a consolidated
   *  document's lines back into the jobs they belong to. */
  orderNumber: string | null;
  /** Org-defined fields flagged `show_in_documents`, already label-keyed. */
  fields: Record<string, string>;
}

/** One order covered by a document, as the document froze it. */
export interface SnapshotOrder {
  orderId: string | null;
  orderNumber: string | null;
  orderDate: string | null;
  /** Net of that order's own discount; equals its `orders.total_amount`. */
  total: number;
  fields: [string, string][];
}

export interface DocumentSnapshot {
  documentType: string;
  documentNumber: string;
  orderNumber: string | null;
  issuedAt: string | null;
  issuerName: string | null;
  issuerContact: string[];
  issuerTaxId: string | null;
  recipientName: string | null;
  recipientDetails: string[];
  orderFields: [string, string][];
  /**
   * The orders this document covers, in the sequence it billed them — which
   * is also the sequence payments fill them in. One entry for an ordinary
   * document, several for a consolidated invoice.
   */
  orders: SnapshotOrder[];
  lines: SnapshotLine[];
  currency: string | null;
  subtotal: number;
  discountTotal: number;
  /**
   * The discount as it was agreed, frozen alongside the money it resolved to,
   * so the paper can say "Discount (10%)" rather than only an amount. Null on
   * snapshots issued before A1 part 2, and on orders with no discount.
   */
  discountType: 'amount' | 'percent' | null;
  discountValue: number;
  taxTotal: number;
  taxLabel: string;
  taxRate: number;
  taxRegistered: boolean;
  amountsIncludeTax: boolean;
  total: number;
  dueDate: string | null;
  validUntil: string | null;
  footer: string | null;
  bankDetails: string | null;
}

type Json = Record<string, unknown>;

const obj = (value: unknown): Json =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Json) : {};
const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value : null;
const money = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/** Label-keyed values, as `{ "Delivery": "Pickup" }` — dropped when empty. */
function pairs(value: unknown): [string, string][] {
  return Object.entries(obj(value))
    .map(([label, raw]) => [label, raw == null ? '' : String(raw)] as [string, string])
    .filter(([, v]) => v !== '');
}

export function readSnapshot(
  snapshot: unknown,
  fallback: { documentNumber: string; documentType: string },
): DocumentSnapshot {
  const s = obj(snapshot);
  const meta = obj(s.meta);
  const issuer = obj(s.issuer);
  const recipient = obj(s.recipient);
  const totals = obj(s.totals);
  const terms = obj(s.terms);

  const lines = Array.isArray(s.lines) ? s.lines : [];

  return {
    documentType: text(meta.document_type) ?? fallback.documentType,
    documentNumber: text(meta.document_number) ?? fallback.documentNumber,
    orderNumber: text(meta.order_number),
    issuedAt: text(meta.issued_at),

    issuerName: text(issuer.trading_name) ?? text(issuer.legal_name),
    issuerContact: [text(issuer.address), text(issuer.phone), text(issuer.email)].filter(
      (v): v is string => v !== null,
    ),
    issuerTaxId: text(issuer.tax_id),

    recipientName: text(recipient.name),
    recipientDetails: pairs(recipient.fields).map(([, value]) => value),
    orderFields: pairs(s.order_fields),

    orders: (Array.isArray(s.orders) ? s.orders : []).map(raw => {
      const order = obj(raw);
      return {
        orderId: text(order.order_id),
        orderNumber: text(order.order_number),
        orderDate: text(order.order_date),
        total: money(order.total),
        fields: pairs(order.fields),
      };
    }),

    lines: lines.map(raw => {
      const line = obj(raw);
      return {
        description: text(line.description) ?? '—',
        quantity: money(line.quantity),
        unitPrice: money(line.unit_price),
        total: money(line.total),
        orderNumber: text(line.order_number),
        fields: Object.fromEntries(pairs(line.fields)),
      };
    }),

    currency: text(totals.currency),
    subtotal: money(totals.subtotal),
    // Absent on snapshots frozen before A1 part 2; such a document simply has
    // no discount line, which is right — it had no discount.
    discountTotal: money(totals.discount_total),
    discountType:
      totals.discount_type === 'amount' || totals.discount_type === 'percent'
        ? totals.discount_type
        : null,
    discountValue: money(totals.discount_value),
    taxTotal: money(totals.tax_total),
    taxLabel: text(totals.tax_label) ?? 'Tax',
    taxRate: money(totals.tax_rate),
    taxRegistered: totals.tax_registered === true,
    amountsIncludeTax: totals.amounts_include_tax === true,
    total: money(totals.total),

    dueDate: text(terms.due_date),
    validUntil: text(terms.valid_until),
    footer: text(terms.footer),
    // issue_document already nulls this unless show_bank_details is on.
    bankDetails: text(terms.bank_details),
  };
}

/** Initials for the letterhead mark, from whatever name the snapshot froze. */
export function issuerInitials(name: string | null): string {
  if (!name) return '—';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase() ?? '')
    .join('');
}
