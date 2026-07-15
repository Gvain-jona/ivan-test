'use client';

import React, { useMemo } from 'react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import OrdersTable from '@/components/orders/OrdersTableNew';
import { useOrdersStore, useOrdersUI } from '../_context';
import { useLoading } from '@/components/loading';
import { OrdersTableSkeleton } from '@/components/ui/loading-states';

/**
 * Orders tab content. Filtering happens through the table's built-in
 * quick filters (status / payment / date / search), wired straight to
 * the store's OrderListFilters. The legacy FilterDrawer (public-schema
 * fields, hardcoded status list) was deleted in cleanup Phase 2 — see
 * docs/v2-migration/ORDERS_CLEANUP.md.
 */
const OrdersTab: React.FC = () => {
  const store = useOrdersStore();
  const ui = useOrdersUI();
  const { loadingIds } = useLoading();

  const { filters, setFilters } = store;

  const dateRange = useMemo<DateRange | undefined>(() => {
    if (!filters.startDate && !filters.endDate) return undefined;
    return {
      from: filters.startDate ? new Date(filters.startDate) : undefined,
      to: filters.endDate ? new Date(filters.endDate) : undefined,
    };
  }, [filters.startDate, filters.endDate]);

  const isInitialLoading =
    (store.isLoading || loadingIds.has('orders')) && store.orders.length === 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0">
        {isInitialLoading ? (
          <OrdersTableSkeleton rows={10} />
        ) : (
          <OrdersTable
            orders={store.orders}
            totalCount={store.totalCount}
            onView={ui.handleViewOrder}
            onDelete={(order) => { ui.handleDeleteOrder(order.id); }}
            onStatusChange={(order, status) => { ui.handleOrderStatusChange(order.id, status); }}
            onLoadMore={store.refresh}
            loading={store.isLoading}
            currentPage={store.page}
            totalPages={store.pageCount}
            onPageChange={store.setPage}
            onSearch={(term) => setFilters({ ...filters, search: term || undefined })}
            searchTerm={filters.search ?? ''}
            selectedStatus={filters.status ?? []}
            onStatusFilterChange={(statuses) =>
              setFilters({ ...filters, status: statuses.length ? statuses : undefined })
            }
            selectedPaymentStatus={filters.paymentStatus ?? []}
            onPaymentStatusFilterChange={(statuses) =>
              setFilters({ ...filters, paymentStatus: statuses.length ? statuses : undefined })
            }
            dateRange={dateRange}
            onDateRangeChange={(range) =>
              setFilters({
                ...filters,
                startDate: range?.from ? format(range.from, 'yyyy-MM-dd') : undefined,
                endDate: range?.to ? format(range.to, 'yyyy-MM-dd') : undefined,
              })
            }
          />
        )}
      </div>
    </div>
  );
};

export default OrdersTab;
