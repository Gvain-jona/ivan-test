'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import type { OrderSummary } from '@/hooks/orders/useOrders';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import StatusDropdown from './StatusDropdown';
import OrderActions from './OrderActions';
import PaymentStatusBadge from './PaymentStatusBadge';

interface OrderCardProps {
  order: OrderSummary;
  userRole: 'admin' | 'manager' | 'employee';
  onView: (order: OrderSummary) => void;
  onDelete: (order: OrderSummary) => void;
  onStatusChange: (order: OrderSummary, status: string) => void;
}

function initials(name: string): string {
  if (!name) return '--';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Card-first order treatment for mobile (`lg:hidden` in the orders list) —
 * the same order data the desktop table row carries, restructured into the
 * Home feed's card language rather than a shrunk-down table row. Tapping the
 * card opens the order (onView); the status dropdown and actions menu sit in
 * the footer for full parity with the desktop row. Interactive children are
 * excluded from the tap-to-view handler so they don't double-fire.
 */
export default function OrderCard({
  order,
  userRole,
  onView,
  onDelete,
  onStatusChange,
}: OrderCardProps) {
  const clientName = order.clients?.name ?? 'Unknown';
  const orderRef = order.order_number || (order.id ? `#${order.id.substring(0, 8)}` : 'Unknown');

  const openView = () => onView(order);

  const handleCardActivate = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = !!target.closest(
      'button, a, input, select, textarea, [role="menuitem"], [data-dropdown-trigger], [data-dropdown-content], .interactive-element',
    );
    if (!isInteractive) openView();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openView();
        }
      }}
      className="cursor-pointer rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted active:bg-muted"
    >
      {/* Client + payment status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0 border border-border">
            <AvatarFallback className="bg-muted text-sm font-medium text-foreground">
              {initials(clientName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">{clientName}</p>
            <p className="truncate text-xs font-medium text-primary">{orderRef}</p>
          </div>
        </div>
        {order.payment_status && (
          <PaymentStatusBadge status={order.payment_status} size="sm" />
        )}
      </div>

      {/* Financial summary */}
      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-3 text-center">
        {(
          [
            { label: 'Total', value: order.total_amount, strong: true },
            { label: 'Paid', value: order.amount_paid, strong: false },
            { label: 'Balance', value: order.balance, strong: true },
          ] as const
        ).map(({ label, value, strong }) => (
          <div key={label}>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p
              className={cn(
                'mt-0.5 text-sm text-foreground',
                strong ? 'font-semibold' : 'font-medium',
              )}
            >
              {formatCurrency(value || 0)}
            </p>
          </div>
        ))}
      </div>

      {/* Date + status + actions */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {order.order_date
            ? new Date(order.order_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : 'N/A'}
        </span>
        <div className="flex items-center gap-1">
          <StatusDropdown order={order} onStatusChange={onStatusChange} userRole={userRole} />
          <OrderActions
            order={order}
            userRole={userRole}
            onView={onView}
            onDelete={async (o) => {
              onDelete(o);
              return true;
            }}
          />
        </div>
      </div>
    </div>
  );
}
