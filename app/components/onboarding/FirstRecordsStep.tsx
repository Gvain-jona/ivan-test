'use client';

import { Check, ClipboardList, Lock, Package, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useProducts } from '@/hooks/products/useProducts';
import { useClients } from '@/hooks/clients/useClients';
import { useOrders } from '@/hooks/orders/useOrders';
import { useSheets } from '@/context/sheet-host';

interface EntityRowProps {
  icon: React.ReactNode;
  label: string;
  /** Lower-case singular, for the button label ("Add a client"). */
  singular: string;
  /** How many of this entity exist; drives the done state and the sub-label. */
  count: number;
  /** Copy shown before anything exists. */
  emptyHint: string;
  onAdd: () => void;
  /** Set when the entity can't be created yet, explaining why. */
  blockedReason?: string;
  /** The one action worth nudging — at most one row is primary. */
  emphasis?: boolean;
}

function EntityRow({
  icon,
  label,
  singular,
  count,
  emptyHint,
  onAdd,
  blockedReason,
  emphasis,
}: EntityRowProps) {
  const done = count > 0;
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-setup-surface p-3">
      <span
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
          done ? 'bg-success-bg text-success' : 'bg-primary/10 text-primary',
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          {label}
          {done && (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-success">
              <Check className="h-3 w-3" strokeWidth={3} />
              Done
            </span>
          )}
          {blockedReason && <Lock className="h-3 w-3 text-muted-foreground" />}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {blockedReason ?? (done ? `${count} added` : emptyHint)}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        variant={emphasis && !done ? 'default' : 'outline'}
        onClick={onAdd}
        disabled={!!blockedReason}
      >
        {done ? 'Add another' : `Add a ${singular}`}
      </Button>
    </li>
  );
}

/**
 * The closing step: setup is already saved, so this is an invitation rather
 * than a requirement — add a first record now, or leave and do it as work
 * comes in. Orders stay locked until a client exists because an order can't
 * be created without one.
 */
export default function FirstRecordsStep() {
  const { openCreateProduct, openCreateClient, openCreateOrder } = useSheets();
  // Counts only — limit 1 keeps the payload to a single row; `total` is the
  // real count. These revalidate when a create sheet saves, so a row flips to
  // done without the user leaving the step.
  const { total: productCount, isLoading: productsLoading } = useProducts({ limit: 1 });
  const { total: clientCount, isLoading: clientsLoading } = useClients({ limit: 1 });
  const { total: orderCount, isLoading: ordersLoading } = useOrders({ limit: 1 });

  // Until the counts land they all read 0, which would paint Products/Clients
  // as empty and Orders as locked ("Needs a client first") for a beat — a
  // false "nothing set up, orders blocked" flash. Show placeholders instead.
  // SWR only reports loading on a cold cache, so this doesn't re-flash on every
  // revalidation after a record is created.
  if (productsLoading || clientsLoading || ordersLoading) {
    return (
      <ul className="space-y-2.5" aria-hidden>
        {[0, 1, 2].map(i => (
          <li key={i}>
            <Skeleton className="h-[66px] w-full rounded-xl bg-setup-surface" />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-2.5">
      <EntityRow
        icon={<Package className="h-5 w-5" />}
        label="Products"
        singular="product"
        count={productCount}
        emptyHint="What you sell"
        onAdd={openCreateProduct}
        emphasis={productCount === 0}
      />
      <EntityRow
        icon={<Users className="h-5 w-5" />}
        label="Clients"
        singular="client"
        count={clientCount}
        emptyHint="Who you sell to"
        onAdd={openCreateClient}
        emphasis={productCount > 0 && clientCount === 0}
      />
      <EntityRow
        icon={<ClipboardList className="h-5 w-5" />}
        label="Orders"
        singular="order"
        count={orderCount}
        emptyHint="What ties them together"
        onAdd={openCreateOrder}
        blockedReason={clientCount === 0 ? 'Needs a client first' : undefined}
        emphasis={clientCount > 0 && orderCount === 0}
      />
    </ul>
  );
}
