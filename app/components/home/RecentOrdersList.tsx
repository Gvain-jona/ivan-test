'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Clock, Plus, ChevronRight, PackageOpen } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useFormatCurrency } from '@/hooks/organization/useFormatCurrency';
import { useSheets } from '@/context/sheet-host';
import StatusBadge from '@/components/orders/StatusBadge';
import PaymentStatusBadge from '@/components/orders/PaymentStatusBadge';
import type { OrderSummary } from '@/hooks/orders/useOrders';

interface RecentOrdersListProps {
  orders: OrderSummary[];
  isLoading: boolean;
}

/**
 * How the recent set is segmented — going beyond a flat "latest N" list to
 * group orders by the state a print-shop owner acts on. Evaluated in order;
 * each order lands in the first matching segment, with a catch-all last.
 */
const SEGMENTS: { key: string; label: string; match: (o: OrderSummary) => boolean }[] = [
  {
    key: 'in_progress',
    label: 'In progress',
    match: (o) => ['pending', 'in_progress', 'paused'].includes(o.status),
  },
  {
    key: 'awaiting',
    label: 'Awaiting payment',
    match: (o) => ['completed', 'delivered'].includes(o.status) && o.payment_status !== 'paid',
  },
  {
    key: 'completed',
    label: 'Completed',
    match: (o) => ['completed', 'delivered'].includes(o.status) && o.payment_status === 'paid',
  },
  {
    key: 'cancelled',
    label: 'Cancelled',
    match: (o) => o.status === 'cancelled',
  },
];

/**
 * "Recent orders" feed — the card-first list, now grouped by workflow state
 * (in progress / awaiting payment / …) rather than a single flat list, so the
 * feed surfaces what needs action instead of just what's newest. Each card
 * carries the same status/payment badges the desktop table uses.
 */
export default function RecentOrdersList({ orders, isLoading }: RecentOrdersListProps) {
  const groups = useMemo(() => {
    const buckets = new Map<string, { label: string; items: OrderSummary[] }>();
    for (const order of orders) {
      const segment = SEGMENTS.find((s) => s.match(order));
      const key = segment?.key ?? 'other';
      const label = segment?.label ?? 'Other';
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = { label, items: [] };
        buckets.set(key, bucket);
      }
      bucket.items.push(order);
    }
    // Preserve SEGMENTS order, then any 'other' catch-all last.
    const ordered = [
      ...SEGMENTS.map((s) => s.key),
      'other',
    ];
    return ordered
      .map((key) => buckets.get(key))
      .filter((g): g is { label: string; items: OrderSummary[] } => !!g && g.items.length > 0);
  }, [orders]);

  return (
    <section className="space-y-4">
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

      {/* Skeletons only with nothing to show — keepPreviousData holds the
          previous rows during revalidation, so don't flash over them. */}
      {isLoading && orders.length === 0 ? (
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
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.label} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </h3>
                <span className="text-xs font-medium text-muted-foreground">
                  {group.items.length}
                </span>
              </div>
              <ul className="space-y-3">
                {group.items.map((order) => (
                  <li key={order.id}>
                    <OrderCard order={order} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function OrderCard({ order }: { order: OrderSummary }) {
  const { openOrder } = useSheets();
  const fmt = useFormatCurrency();
  return (
    <button
      type="button"
      onClick={() => openOrder(order.id)}
      className="block w-full rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted"
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
            {fmt(order.total_amount)}
          </span>
          <StatusBadge status={order.status} size="sm" />
        </div>
      </div>
    </button>
  );
}

function EmptyState() {
  const { openCreateOrder } = useSheets();
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
      <PackageOpen className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        No orders yet. Create your first one to get started.
      </p>
      <button
        type="button"
        onClick={openCreateOrder}
        className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-105"
      >
        <Plus className="h-4 w-4" />
        New order
      </button>
    </div>
  );
}
