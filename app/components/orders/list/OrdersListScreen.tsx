'use client';

import { useState } from 'react';
import { FileText, Plus, Search, SlidersHorizontal, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, Divided } from '@/components/patterns/screen';
import { ListError } from '@/components/patterns/ListError';
import MobileFeedHeader from '@/components/navigation/MobileFeedHeader';
import { useSheets } from '@/context/sheet-host';
import { useFieldDefinitions } from '@/hooks/fields/useFieldDefinitions';
import { useOrderStatuses } from '@/hooks/orders/useOrderStatuses';
import { useFormatCurrency } from '@/hooks/organization/useFormatCurrency';
import EntityFieldsManager from '@/components/fields/EntityFieldsManager';
import OrderListRow from './OrderListRow';
import { useOrdersList, type OrdersFilter } from './useOrdersList';
import { Chip, EmptyState, Figure, QuickAction } from './list-parts';

const FILTERS: { key: OrdersFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unpaid', label: 'Unpaid' },
  { key: 'due', label: 'Due soon' },
];

/**
 * Orders — the working list (B1), and A2 when the org has none yet.
 *
 * They are one screen rather than two: the empty state is a *state* of the
 * list, and the frame draws it with the same header, the same summary card and
 * the same quick actions, only with zeros and a prompt where the rows would be.
 * Splitting them would mean maintaining that chrome twice.
 */
export default function OrdersListScreen() {
  const fmt = useFormatCurrency();
  const list = useOrdersList();
  const { openCreateOrder, openOrder, openCreateClient } = useSheets();
  const { statuses } = useOrderStatuses();
  const { fieldDefinitions: orderFields } = useFieldDefinitions('order');
  const [showFields, setShowFields] = useState(false);

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-5">
      <MobileFeedHeader />
      <h1 className="text-[22px] font-semibold text-foreground">Orders</h1>

      <div className="mt-3.5 flex items-center rounded-2xl border border-border bg-card px-1 py-3.5">
        <Figure
          value={list.summary.exact ? fmt(list.summary.totals.sales) : '—'}
          label="Total sales"
        />
        <div className="h-[38px] w-px bg-border" />
        <Figure value={String(list.summary.count)} label="Orders this month" />
      </div>

      {!list.summary.exact && list.summary.count > 0 && (
        // The count is exact either way; the sum isn't, and a money figure that
        // is quietly missing orders is worse than none.
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Too many orders this month to total here yet.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-[7px]">
        <QuickAction icon={Plus} label="New order" onClick={openCreateOrder} primary />
        <QuickAction icon={UserPlus} label="New client" onClick={openCreateClient} />
        {/* "New quote" opens the same composer (B2) as New order — an order
            starts in the quotation stage, so it's a quote named for the intent
            you arrive with. Kept to match the frame and Home's quick actions,
            which carry the same three. */}
        <QuickAction icon={FileText} label="New quote" onClick={openCreateOrder} />
      </div>

      {!list.isEmptyOrg && (
        <>
          <div className="mt-4 flex h-10 items-center gap-[9px] rounded-[10px] bg-muted px-3">
            <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <input
              value={list.search}
              onChange={event => list.setSearch(event.target.value)}
              placeholder="Search client or order number"
              aria-label="Search client or order number"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="mt-3 flex items-center gap-[7px] overflow-x-auto pb-1">
            {FILTERS.filter(option => option.key !== 'due' || list.hasDueField).map(option => (
              <Chip
                key={option.key}
                label={option.label}
                active={list.filter === option.key && !list.showArchived}
                onClick={() => {
                  list.setFilter(option.key);
                  list.setShowArchived(false);
                }}
              />
            ))}
            {list.hasArchived && (
              // Where deleted orders went. They leave the default list on the
              // delete-archives decision, so there has to be a way back to them.
              <Chip
                label="Cancelled"
                active={list.showArchived}
                onClick={() => list.setShowArchived(!list.showArchived)}
              />
            )}
            <button
              type="button"
              onClick={() => setShowFields(v => !v)}
              aria-pressed={showFields}
              className={cn(
                'ml-auto flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                showFields
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Fields
            </button>
          </div>
        </>
      )}

      {showFields && (
        <div className="mt-3 space-y-6 rounded-2xl border border-border bg-card/40 p-4">
          {[
            { entity: 'order', label: 'Order fields', noun: 'order' },
            { entity: 'order_item', label: 'Order item fields', noun: 'order item' },
            { entity: 'note', label: 'Note fields', noun: 'note' },
          ].map(section => (
            <div key={section.entity} className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">{section.label}</h2>
              <EntityFieldsManager
                entity={section.entity as 'order'}
                entityLabel={section.noun}
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-3.5">
        {list.error && list.orders.length === 0 ? (
          <ListError noun="orders" onRetry={() => list.refresh()} />
        ) : list.isLoading && list.orders.length === 0 ? (
          <div className="space-y-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-16 animate-pulse rounded-2xl border border-border bg-card" />
            ))}
          </div>
        ) : list.orders.length === 0 ? (
          <EmptyState
            emptyOrg={list.isEmptyOrg}
            searching={list.searching}
            onCreate={openCreateOrder}
          />
        ) : (
          <>
            <Card>
              <Divided>
                {list.orders.map(order => (
                  <OrderListRow
                    key={order.id}
                    order={order}
                    statuses={statuses}
                    fields={orderFields}
                    onOpen={() => openOrder(order.id)}
                  />
                ))}
              </Divided>
            </Card>
            {list.total > list.orders.length && (
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Showing {list.orders.length} of {list.total}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

