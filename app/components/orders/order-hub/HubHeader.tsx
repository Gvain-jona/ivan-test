'use client';

import { ArrowLeft } from 'lucide-react';
import { RowDivider } from '@/components/patterns/screen';
import { formatFieldValue } from '@/lib/fields/format';
import { formatDate } from '@/lib/utils';
import type { FieldDefinition } from '@/hooks/fields/useFieldDefinitions';
import type { OrderDetail } from '@/hooks/orders/useOrders';

/**
 * The hub's identity block: the order number, who it's for, and the one line of
 * context the frame puts under it — "Aug 7 · Due Aug 12 · Pickup".
 *
 * That line is *not* three known fields. Only the date is a column; "Due" and
 * "Pickup" are the org's `due_date` and `delivery_method` starter fields, so
 * the line is built from whatever the org actually tracks and simply gets
 * shorter for an org that tracks neither.
 *
 * The frame also carries a ⋯ overflow in this header. Its contents aren't
 * drawn anywhere on the canvas, so it isn't rendered — an affordance with no
 * defined behaviour is worse than none.
 */
export function HubHeader({
  order,
  fields,
  onBack,
}: {
  order: OrderDetail;
  fields: FieldDefinition[];
  onBack: () => void;
}) {
  const custom = (order.custom_data ?? {}) as Record<string, unknown>;

  const context = [
    order.order_date ? formatDate(order.order_date) : null,
    ...fields
      .filter(field => field.field_name !== 'status')
      .map(field => {
        const value = formatFieldValue(custom[field.field_name], field);
        if (value === null) return null;
        // Dates read better with their label ("Due Aug 12"); a choice speaks
        // for itself ("Pickup"), and prefixing it would only add noise.
        return field.field_type === 'date' ? `${field.field_label} ${value}` : value;
      }),
  ].filter((part): part is string => part !== null && part !== '');

  return (
    <header className="sticky top-0 z-10 bg-card">
      <div className="flex items-start gap-3 p-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="mt-0.5 rounded text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-[22px] w-[22px]" strokeWidth={2} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-[19px] font-semibold text-foreground">
            {order.order_number ?? 'Order'}
          </h1>
          {order.clients?.name && (
            <p className="truncate text-[13px] text-foreground">{order.clients.name}</p>
          )}
          {context.length > 0 && (
            <p className="truncate text-[11px] text-muted-foreground">{context.join(' · ')}</p>
          )}
        </div>
      </div>
      <RowDivider />
    </header>
  );
}
