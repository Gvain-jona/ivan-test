'use client';

/** Our word for a document type; the DB's values are machine keys. */
export function documentLabel(type: string): string {
  const labels: Record<string, string> = {
    quotation: 'Quotation',
    invoice: 'Invoice',
    receipt: 'Receipt',
    proforma: 'Proforma',
    purchase_order: 'Purchase order',
  };
  return labels[type] ?? type;
}
