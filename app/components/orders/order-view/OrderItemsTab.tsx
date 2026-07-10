import React from 'react';
import { Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { OrderItemsTabProps } from './types';

/** Compact inline rendering of an item's custom_data (size, finish…). */
function describeCustomData(value: unknown): string {
  if (value == null || typeof value !== 'object') return '';
  return Object.entries(value as Record<string, unknown>)
    .map(([key, v]) => {
      if (v != null && typeof v === 'object' && 'raw' in (v as object)) {
        return `${key}: ${(v as { raw?: string }).raw ?? ''}`;
      }
      return `${key}: ${String(v)}`;
    })
    .join(' · ');
}

/**
 * OrderItemsTab lists the order's line items (read-only).
 * TODO(B3 — order form cutover): add/edit/remove items lands together
 * with the product picker built for the order form.
 */
const OrderItemsTab: React.FC<OrderItemsTabProps> = ({ order }) => {
  const items = order.order_items ?? [];

  if (items.length === 0) {
    return (
      <div className="border border-[#2B2B40] rounded-lg p-8 text-center text-muted-foreground">
        <Package className="h-6 w-6 mx-auto mb-2 opacity-60" />
        <p className="text-sm">No items on this order</p>
      </div>
    );
  }

  return (
    <div className="border border-[#2B2B40] rounded-lg overflow-hidden">
      <table className="w-full divide-y divide-[#2B2B40]">
        <thead className="bg-muted/10">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-[#6D6D80]">Item</th>
            <th className="px-4 py-2 text-center text-xs font-medium text-[#6D6D80]">Qty</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-[#6D6D80]">Unit Price</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-[#6D6D80]">Discount</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-[#6D6D80]">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2B2B40]">
          {items.map(item => {
            const extra = describeCustomData(item.custom_data);
            return (
              <tr key={item.id} className="hover:bg-muted/10">
                <td className="px-4 py-2.5 text-sm text-white">
                  {item.product_name_raw ?? '—'}
                  {extra && <p className="text-xs text-muted-foreground mt-0.5">{extra}</p>}
                </td>
                <td className="px-4 py-2.5 text-sm text-white text-center">{item.quantity}</td>
                <td className="px-4 py-2.5 text-sm text-white text-right">
                  {formatCurrency(item.unit_price)}
                </td>
                <td className="px-4 py-2.5 text-sm text-muted-foreground text-right">
                  {item.discount ? formatCurrency(item.discount) : '—'}
                </td>
                <td className="px-4 py-2.5 text-sm text-white text-right font-medium">
                  {formatCurrency(item.total_amount)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default OrderItemsTab;
