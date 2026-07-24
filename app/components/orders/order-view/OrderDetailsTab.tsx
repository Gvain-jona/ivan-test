import React from 'react';
import { CheckCircle, Tag, CalendarIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/status-badge';
import { PaymentStatusBadge } from '@/components/ui/payment-status-badge';
import { useFieldDefinitions } from '@/hooks/fields/useFieldDefinitions';
import type { OrderDetailsTabProps } from './types';

/** Human-readable rendering for a governed custom_data value. */
function formatFieldValue(value: unknown): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') {
    const dim = value as { raw?: string; w?: number; h?: number };
    if (dim.raw) return dim.raw;
    if (dim.w != null && dim.h != null) return `${dim.w}x${dim.h}`;
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * OrderDetailsTab shows order info (including the org's custom fields
 * from the field registry) and the financial summary.
 */
const OrderDetailsTab: React.FC<OrderDetailsTabProps> = ({ order }) => {
  const { fieldDefinitions } = useFieldDefinitions('order');
  const customData = (order.custom_data ?? {}) as Record<string, unknown>;

  return (
    <div className="space-y-4">
      {/* Order Information Section */}
      <div className="border border-border/40 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[#6D6D80]">Order Information</h3>
          <StatusBadge status={order.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="flex items-start gap-2">
            <CalendarIcon className="h-4 w-4 text-[#6D6D80] mt-0.5" />
            <div>
              <p className="text-xs text-[#6D6D80]">Order Date</p>
              <p className="text-sm text-foreground">
                {order.order_date ? new Date(order.order_date).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Tag className="h-4 w-4 text-[#6D6D80] mt-0.5" />
            <div>
              <p className="text-xs text-[#6D6D80]">Order Items</p>
              <p className="text-sm text-foreground">{order.order_items?.length ?? 0} Items</p>
            </div>
          </div>

          {/* Org-defined custom fields, from the field registry */}
          {fieldDefinitions.map(field => (
            <div key={field.field_name} className="flex items-start gap-2">
              <Tag className="h-4 w-4 text-[#6D6D80] mt-0.5" />
              <div>
                <p className="text-xs text-[#6D6D80]">{field.field_label}</p>
                <p className="text-sm text-foreground">
                  {formatFieldValue(customData[field.field_name])}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Summary Section */}
      <div className="border border-border/40 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[#6D6D80]">Financial Summary</h3>
          <PaymentStatusBadge status={order.payment_status ?? 'unpaid'} />
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-[#6D6D80]">Total Amount</p>
              <p className="text-lg font-medium text-foreground">{formatCurrency(order.total_amount)}</p>
            </div>
            <div>
              <p className="text-xs text-[#6D6D80]">Amount Paid</p>
              <p className="text-lg font-medium text-green-500">{formatCurrency(order.amount_paid)}</p>
            </div>
            <div>
              <p className="text-xs text-[#6D6D80]">Balance Due</p>
              <p className="text-lg font-medium text-primary">
                {formatCurrency(order.balance ?? order.total_amount - order.amount_paid)}
              </p>
            </div>
          </div>

          {order.payment_status === 'paid' && (
            <div className="flex items-center justify-center mt-2 text-green-500 bg-green-500/10 rounded-md py-1">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span className="text-sm">Fully Paid</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsTab;
