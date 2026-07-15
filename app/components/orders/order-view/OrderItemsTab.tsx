import React, { useState } from 'react';
import { Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { orderItemName } from '@/hooks/orders/useOrders';
import type { OrderItemInput } from '@/hooks/orders/useOrders';
import OrderItemForm from './OrderItemForm';
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
 * OrderItemsTab lists the order's lines and edits them in place:
 * add / edit / remove, all through the item routes (the DB trigger
 * retotals the order on every change). Removing the last line is
 * rejected API-side — the button is disabled to match.
 */
const OrderItemsTab: React.FC<OrderItemsTabProps> = ({
  order,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  isSubmitting,
}) => {
  const items = order.order_items ?? [];
  /** null = viewing · 'new' = adding · item id = editing that line. */
  const [editing, setEditing] = useState<string | null>(null);
  /** Item id awaiting remove confirmation (two-step button). */
  const [confirmingRemove, setConfirmingRemove] = useState<string | null>(null);

  const handleAdd = async (input: OrderItemInput) => {
    await onAddItem(input);
    setEditing(null);
  };

  const handleUpdate = (itemId: string) => async (input: OrderItemInput) => {
    await onUpdateItem(itemId, input);
    setEditing(null);
  };

  const handleRemove = async (itemId: string) => {
    setConfirmingRemove(null);
    await onRemoveItem(itemId);
  };

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="border border-[#2B2B40] rounded-lg p-8 text-center text-muted-foreground">
          <Package className="h-6 w-6 mx-auto mb-2 opacity-60" />
          <p className="text-sm">No items on this order</p>
        </div>
      ) : (
        <div className="border border-[#2B2B40] rounded-lg overflow-x-auto">
          <table className="w-full divide-y divide-[#2B2B40]">
            <thead className="bg-muted/10">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-[#6D6D80]">Item</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-[#6D6D80]">Qty</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-[#6D6D80]">Unit Price</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-[#6D6D80]">Discount</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-[#6D6D80]">Total</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-[#6D6D80]">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B2B40]">
              {items.map(item => {
                const extra = describeCustomData(item.custom_data);
                return (
                  <tr key={item.id} className="hover:bg-muted/10">
                    <td className="px-4 py-2.5 text-sm text-white">
                      {orderItemName(item)}
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
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      {confirmingRemove === item.id ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-destructive"
                            disabled={isSubmitting}
                            onClick={() => handleRemove(item.id)}
                          >
                            Confirm
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => setConfirmingRemove(null)}
                          >
                            Keep
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            aria-label="Edit item"
                            disabled={isSubmitting}
                            onClick={() => {
                              setConfirmingRemove(null);
                              setEditing(item.id);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive disabled:opacity-40"
                            aria-label="Remove item"
                            disabled={isSubmitting || items.length <= 1}
                            title={items.length <= 1 ? 'An order needs at least one item' : undefined}
                            onClick={() => setConfirmingRemove(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing === 'new' ? (
        <OrderItemForm
          item={null}
          onSubmit={handleAdd}
          onCancel={() => setEditing(null)}
          isSubmitting={isSubmitting}
        />
      ) : editing != null ? (
        <OrderItemForm
          key={editing}
          item={items.find(i => i.id === editing) ?? null}
          onSubmit={handleUpdate(editing)}
          onCancel={() => setEditing(null)}
          isSubmitting={isSubmitting}
        />
      ) : (
        <Button variant="outline" size="sm" className="w-full" onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Item
        </Button>
      )}
    </div>
  );
};

export default OrderItemsTab;
