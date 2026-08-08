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
 *   meta         { document_type, document_number, order_number, order_date, issued_at }
 *   issuer       ← settings.identity, verbatim
 *   recipient    { client_id, name, fields{} }
 *   order_fields { <field_label>: <value> }
 *   lines        [ { description, quantity, unit_price, discount, total, fields{} } ]
 *   totals       { currency, subtotal, tax_total, total, tax_label, tax_rate,
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
  /** Org-defined fields flagged `show_in_documents`, already label-keyed. */
  fields: Record<string, string>;
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
  lines: SnapshotLine[];
  currency: string | null;
  subtotal: number;
  discountTotal: number;
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

    lines: lines.map(raw => {
      const line = obj(raw);
      return {
        description: text(line.description) ?? '—',
        quantity: money(line.quantity),
        unitPrice: money(line.unit_price),
        total: money(line.total),
        fields: Object.fromEntries(pairs(line.fields)),
      };
    }),

    currency: text(totals.currency),
    subtotal: money(totals.subtotal),
    // Absent until the order-discount columns land (A1); a snapshot without it
    // simply has no discount line.
    discountTotal: money(totals.discount_total),
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
