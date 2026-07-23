'use client';

import Link from 'next/link';
import { Clock, Plus, ChevronRight, PackageOpen } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import StatusBadge from '@/components/orders/StatusBadge';
import PaymentStatusBadge from '@/components/orders/PaymentStatusBadge';
import type { OrderSummary } from '@/hooks/orders/useOrders';

interface RecentOrdersListProps {
  orders: OrderSummary[];
  isLoading: boolean;
}

/**
 * "Recent orders" feed — the card-first list treatment that becomes the
 * mobile default for order data (per the redesign direction). Each card
 * carries the same status/payment badges the desktop table uses, so the
 * two views stay visually consistent.
 */
export default function RecentOrdersList({ orders, isLoading }: RecentOrdersListProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Recent orders</h2>
        <Link
          href="/dashboard/orders"
          className="flex items-center gap-0.5 text-sm font-medium text-primary hover:underline"
        >
          See all
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[92px] animate-pulse rounded-2xl border border-border bg-card"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function OrderCard({ order }: { order: OrderSummary }) {
  return (
    <Link
      href={`/dashboard/orders?order=${order.id}`}
      className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-sm font-medium text-muted-foreground">
          #{order.order_number}
        </span>
        {order.payment_status && (
          <PaymentStatusBadge status={order.payment_status} size="sm" />
        )}
      </div>

      <p className="mt-1 truncate text-base font-semibold text-foreground">
        {order.clients?.name ?? 'Unknown client'}
      </p>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {formatDate(order.order_date)}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {formatCurrency(order.total_amount)}
          </span>
          <StatusBadge status={order.status} size="sm" />
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
      <PackageOpen className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        No orders yet. Create your first one to get started.
      </p>
      <Link
        href="/dashboard/orders?new=1"
        className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-105"
      >
        <Plus className="h-4 w-4" />
        New order
      </Link>
    </div>
  );
}
