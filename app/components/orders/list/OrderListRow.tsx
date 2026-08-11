'use client';

import { cn } from '@/lib/utils';
import { useFormatCurrency } from '@/hooks/organization/useFormatCurrency';
import { optionColorClasses } from '@/lib/fields/colors';
import { formatFieldValue } from '@/lib/fields/format';
import type { FieldDefinition } from '@/hooks/fields/useFieldDefinitions';
import type { FieldOption } from '@/lib/fields/options';
import type { OrderSummary } from '@/hooks/orders/useOrders';

/**
 * One order in the working list (B1).
 *
 * The money is the whole point of the row and the frame is precise about it:
 * an order still owing shows **total · balance**, with the balance carrying the
 * warning colour, while a settled order shows its total alone in green. That
 * contrast is what makes the list scannable — you read the colour before you
 * read the number.
 */
export default function OrderListRow({
  order,
  statuses,
  fields,
  onOpen,
}: {
  order: OrderSummary;
  statuses: FieldOption[];
  fields: FieldDefinition[];
  onOpen: () => void;
}) {
  const fmt = useFormatCurrency();

  const total = Number(order.total_amount ?? 0);
  const balance = Number(order.balance ?? 0);
  const settled = balance <= 0 && total > 0;

  const status = statuses.find(option => option.value === order.status);
  const custom = (order.custom_data ?? {}) as Record<string, unknown>;

  // The frame's second line is "ORD-0042 · Banners · Roll-up banner". The list
  // payload carries no line items, so what follows the number is the org's own
  // order fields — the same translation C2 and D2 do — and the line simply gets
  // shorter for an org that tracks nothing extra.
  const meta = [
    order.order_number,
    ...fields
      .filter(field => field.field_name !== 'status')
      .map(field => formatFieldValue(custom[field.field_name], field)),
  ]
    .filter((part): part is string => typeof part === 'string' && part !== '')
    .join(' · ');

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start gap-2 px-3.5 py-[11px] text-left"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {order.clients?.name ?? 'No client'}
          </span>
          <span className="flex-shrink-0 text-[13.5px] font-medium">
            <span className={cn(settled ? 'text-success' : 'text-foreground')}>{fmt(total)}</span>
            {balance > 0 && (
              <>
                <span className="text-muted-foreground"> · </span>
                <span className="text-warning">{fmt(balance)}</span>
              </>
            )}
          </span>
        </div>
        <div className="mt-0.5 flex items-start justify-between gap-2">
          <span className="truncate text-[11px] text-muted-foreground">{meta}</span>
          {status && (
            <span
              className={cn(
                'flex-shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-medium',
                optionColorClasses(status.color).chip,
              )}
            >
              {status.label}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
