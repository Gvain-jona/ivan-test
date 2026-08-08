'use client';

import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { Mail, MapPin, Phone } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { PLATFORM_API, apiFetcher, buildKey } from '@/lib/api/client';
import { SWR_CACHE_TIMES } from '@/lib/swr-config';
import { useFormatCurrency } from '@/hooks/organization/useFormatCurrency';
import { useOrderStatuses } from '@/hooks/orders/useOrderStatuses';
import { useSheets } from '@/context/sheet-host';
import { Card, Divided, ScreenFooter, ScreenHeader } from '@/components/patterns/screen';
import {
  SummaryPanel,
  SummaryRow,
  SummaryRule,
  SummaryUnavailable,
} from '@/components/patterns/summary';
import { optionColorClasses } from '@/lib/fields/colors';
import type { Client } from '@/hooks/clients/useClients';
import type { OrderSummary } from '@/hooks/orders/useOrders';
import type { Rollup } from '@/lib/api/rollup';

interface ClientResponse {
  client: Client;
  rollup: Rollup<{ billed: number; paid: number; outstanding: number }>;
}

/**
 * One client (C2 on the Pencil canvas): who they are, what they've ordered,
 * and what they still owe.
 *
 * The contact rows come from `custom_data`, because phone/email/address are
 * org-defined starter fields rather than columns — an org that never added
 * them simply has no contact card, which is correct rather than empty.
 */
export default function ClientDetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const fmt = useFormatCurrency();
  const { openCreateOrder } = useSheets();
  const { statuses } = useOrderStatuses();

  const { data, isLoading } = useSWR<ClientResponse>(
    `${PLATFORM_API.CLIENTS}/${id}`,
    apiFetcher,
    { dedupingInterval: SWR_CACHE_TIMES.DETAIL_DEDUPE },
  );

  const { data: orderData } = useSWR<{ orders: OrderSummary[]; total: number }>(
    buildKey(PLATFORM_API.ORDERS, { client_id: id, limit: 8 }),
    apiFetcher,
    { dedupingInterval: SWR_CACHE_TIMES.LIST_DEDUPE },
  );

  if (isLoading || !data) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-5">
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
      </div>
    );
  }

  const { client, rollup } = data;
  const custom = (client.custom_data ?? {}) as Record<string, unknown>;
  const text = (key: string) => {
    const value = custom[key];
    return typeof value === 'string' && value.trim() !== '' ? value : null;
  };

  const contacts = [
    { icon: Phone, value: text('phone') },
    { icon: Mail, value: text('email') },
    { icon: MapPin, value: text('address') },
  ].filter(row => row.value !== null);

  const orders = orderData?.orders ?? [];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-background">
      <ScreenHeader title={client.name} onBack={() => router.back()} />

      <div className="flex-1 px-4 py-[18px]">
        <div className="flex items-center gap-2">
          {text('type') && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-[11.5px] font-semibold capitalize text-muted-foreground">
              {text('type')?.replace(/_/g, ' ')}
            </span>
          )}
          <span className="text-[11.5px] text-muted-foreground">
            Client since {formatDate(client.created_at)}
          </span>
        </div>

        {contacts.length > 0 && (
          <div className="mt-4">
            <Card>
              <Divided>
                {contacts.map(({ icon: Icon, value }) => (
                  <div key={value} className="flex items-center gap-[11px] px-3.5 py-[13px]">
                    <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span className="truncate text-[13.5px] font-medium text-foreground">
                      {value}
                    </span>
                  </div>
                ))}
              </Divided>
            </Card>
          </div>
        )}

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">ORDERS</span>
            <span className="text-[11.5px] text-muted-foreground">{rollup.count} total</span>
          </div>
          <div className="mt-2">
            {orders.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-[13px] text-muted-foreground">
                No orders yet.
              </p>
            ) : (
              <Card>
                <Divided>
                  {orders.map(order => (
                    <ClientOrderRow
                      key={order.id}
                      order={order}
                      statuses={statuses}
                      fmt={fmt}
                      onOpen={() => router.push(`/dashboard/orders?order=${order.id}`)}
                    />
                  ))}
                </Divided>
              </Card>
            )}
          </div>
        </div>

        <div className="mt-6">
          {rollup.exact ? (
            <SummaryPanel>
              <SummaryRow label="Billed" value={fmt(rollup.totals.billed)} />
              <SummaryRow label="Paid" value={`− ${fmt(rollup.totals.paid)}`} />
              <SummaryRule />
              <SummaryRow
                label="Outstanding"
                value={fmt(rollup.totals.outstanding)}
                emphasis
                tone="warning"
              />
            </SummaryPanel>
          ) : (
            <SummaryUnavailable count={rollup.count} noun="orders" />
          )}
        </div>
      </div>

      <ScreenFooter
        figureLabel="OUTSTANDING"
        figureValue={rollup.exact ? fmt(rollup.totals.outstanding) : '—'}
        actionLabel="New order"
        onAction={openCreateOrder}
      />
    </div>
  );
}

/**
 * A settled order shows its total in green and nothing else; only an order
 * with money still on it shows `total · balance`. That difference is the
 * fastest read on the screen.
 */
function ClientOrderRow({
  order,
  statuses,
  fmt,
  onOpen,
}: {
  order: OrderSummary;
  statuses: { value: string; label: string; color?: string }[];
  fmt: (value: number) => string;
  onOpen: () => void;
}) {
  const stage = statuses.find(s => s.value === order.status);
  const balance = Number(order.balance ?? 0);
  const settled = balance <= 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full px-3.5 py-[11px] text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {order.order_number}
          </span>
          <span className="flex flex-shrink-0 items-center gap-1.5">
            <span
              className={cn(
                'text-[13.5px] font-medium',
                settled ? 'text-success' : 'text-foreground',
              )}
            >
              {fmt(Number(order.total_amount ?? 0))}
            </span>
            {!settled && (
              <>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-[11.5px] font-semibold text-warning">{fmt(balance)}</span>
              </>
            )}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className="truncate text-[11px] text-muted-foreground">
            {formatDate(order.order_date)}
          </span>
          {stage && (
            <span
              className={cn(
                'flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                optionColorClasses(stage.color).chip,
              )}
            >
              {stage.label}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
