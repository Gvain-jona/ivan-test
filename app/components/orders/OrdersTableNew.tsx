"use client"

import React, { useState, useMemo, useCallback } from 'react';
import { Order, OrderStatus } from '@/types/orders';
import OrderRow from './OrderRow';
import { Button } from '@/app/components/ui/button';
import { Search, Filter, Download, PlusCircle, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Input } from '@/app/components/ui/input';
import TablePagination from '@/app/components/ui/table/TablePagination';
import { cn } from '@/lib/utils';

interface OrdersTableProps {
  orders: Order[];
  totalCount: number;
  userRole: 'admin' | 'manager' | 'employee';
  onView: (order: Order) => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  onDuplicate: (order: Order) => void;
  onInvoice: (order: Order) => void;
  onStatusChange: (order: Order, status: OrderStatus) => void;
  onLoadMore: () => void;
  loading: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onSearch: (term: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onCreateOrder?: () => void;
  searchTerm: string;
  showFilters?: boolean;
}

// Sort configuration type
type SortConfig = {
  key: keyof Order | null;
  direction: 'ascending' | 'descending';
};

export default function OrdersTable(props: OrdersTableProps) {
  const {
    orders,
    totalCount,
    userRole,
    onView,
    onEdit,
    onDelete,
    onDuplicate,
    onInvoice,
    onStatusChange,
    onLoadMore,
    loading,
    currentPage = 1,
    totalPages = 1,
    onPageChange,
    onSearch,
    onFilter,
    onExport,
    onCreateOrder,
    searchTerm,
    showFilters = false,
  } = props;

  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' });
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  // Memoize row mouse enter/leave handlers
  const handleRowMouseEnter = useCallback((id: string) => {
    setHoveredRowId(id);
  }, []);

  const handleRowMouseLeave = useCallback(() => {
    setHoveredRowId(null);
  }, []);

  // Handle sort request
  const requestSort = useCallback((key: keyof Order) => {
    setSortConfig(prevConfig => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === 'ascending'
          ? 'descending'
          : 'ascending'
    }));
  }, []);

  // Get sorted orders
  const sortedOrders = useMemo(() => {
    if (!orders || orders.length === 0 || !sortConfig.key) return orders;

    return [...orders].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Order] ?? '';
      const bValue = b[sortConfig.key as keyof Order] ?? '';

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [orders, sortConfig]);

  // Get class names for sort headers
  const getSortIcon = (key: keyof Order) => {
    if (sortConfig.key !== key) return null;

    return sortConfig.direction === 'ascending'
      ? <ArrowUp className="ml-0.5 h-3 w-3 inline" />
      : <ArrowDown className="ml-0.5 h-3 w-3 inline" />;
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-[hsl(var(--table-background))] rounded-md border border-[hsl(var(--table-border))] shadow-md overflow-hidden">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 p-4 border-b border-[hsl(var(--table-border))] flex-shrink-0">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-9 w-full bg-[hsl(var(--table-search-bg))] border-[hsl(var(--table-border))]"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onFilter}
            className={cn(
              "border-[hsl(var(--table-border))]",
              showFilters && "bg-accent text-accent-foreground"
            )}
            title="Filter Orders"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="icon"
            onClick={onExport}
            className="border-[hsl(var(--table-border))]"
            title="Export Orders"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={onLoadMore}
            className="border-[hsl(var(--table-border))]"
            disabled={loading}
            title="Refresh Orders"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>

          {userRole !== 'employee' && onCreateOrder && (
            <Button
              onClick={onCreateOrder}
              className="gap-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">New Order</span>
            </Button>
          )}
        </div>
      </div>

      {/* Table Container - This is the scrollable area */}
      <div
        ref={tableContainerRef}
        className="flex-1 min-h-0 overflow-auto relative w-full p-1"
      >
        <div className="w-full">
          <table className="w-full table-fixed divide-y divide-[hsl(var(--table-border))] rounded-md overflow-hidden" style={{ width: '100%', tableLayout: 'fixed' }}>
            <thead className="sticky top-0 bg-[hsl(var(--table-header-bg))] z-10 w-full border-b border-[hsl(var(--table-border))] shadow-sm">
              <tr>
                <th scope="col" className="w-[250px] px-2 py-2.5 text-left text-sm font-medium tracking-wider client-column">
                  <button
                    className="flex items-center justify-start w-full text-[hsl(var(--table-header-text))] hover:text-foreground focus:outline-none"
                    onClick={() => requestSort('client_name')}
                    aria-label="Sort by client"
                  >
                    <span className="flex items-center">Client {getSortIcon('client_name')}</span>
                  </button>
                </th>

                <th scope="col" className="date-column px-4 py-2.5 text-left text-sm font-medium tracking-wider">
                  <button
                    className="flex items-center justify-start w-full text-[hsl(var(--table-header-text))] hover:text-foreground focus:outline-none"
                    onClick={() => requestSort('date')}
                    aria-label="Sort by date"
                  >
                    <span className="flex items-center">Date {getSortIcon('date')}</span>
                  </button>
                </th>
                <th scope="col" className="status-column px-4 py-2.5 text-left text-sm font-medium tracking-wider">
                  <button
                    className="flex items-center justify-start w-full text-[hsl(var(--table-header-text))] hover:text-foreground focus:outline-none"
                    onClick={() => requestSort('status')}
                    aria-label="Sort by status"
                  >
                    <span className="flex items-center">Status {getSortIcon('status')}</span>
                  </button>
                </th>
                <th scope="col" className="financial-column px-4 py-2.5 text-sm font-medium tracking-wider">
                  <button
                    className="flex items-center justify-end w-full text-[hsl(var(--table-header-text))] hover:text-foreground focus:outline-none"
                    onClick={() => requestSort('total_amount')}
                    aria-label="Sort by total"
                  >
                    <span className="flex items-center justify-end">Total {getSortIcon('total_amount')}</span>
                  </button>
                </th>
                <th scope="col" className="financial-column px-4 py-2.5 text-sm font-medium tracking-wider">
                  <button
                    className="flex items-center justify-end w-full text-[hsl(var(--table-header-text))] hover:text-foreground focus:outline-none"
                    onClick={() => requestSort('amount_paid')}
                    aria-label="Sort by amount paid"
                  >
                    <span className="flex items-center justify-end">Paid {getSortIcon('amount_paid')}</span>
                  </button>
                </th>
                <th scope="col" className="financial-column px-4 py-2.5 text-sm font-medium tracking-wider">
                  <button
                    className="flex items-center justify-end w-full text-[hsl(var(--table-header-text))] hover:text-foreground focus:outline-none"
                    onClick={() => requestSort('balance')}
                    aria-label="Sort by balance"
                  >
                    <span className="flex items-center justify-end">Balance {getSortIcon('balance')}</span>
                  </button>
                </th>
                <th scope="col" className="actions-column px-4 py-2.5 text-right text-sm font-medium tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--table-border))]">
              {loading ? (
                Array(5).fill(0).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td className="px-2 py-3 whitespace-nowrap client-column">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-5 w-5 rounded-full bg-table-hover" />
                        <Skeleton className="h-10 w-10 rounded-full bg-table-hover" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-4 w-28 bg-table-hover" />
                          <div className="flex items-center gap-1">
                            <Skeleton className="h-3 w-14 bg-table-hover" />
                            <Skeleton className="h-3 w-2 bg-table-hover rounded-full" />
                            <Skeleton className="h-3 w-16 bg-table-hover" />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="date-column">
                      <Skeleton className="h-5 w-full bg-table-hover" />
                    </td>
                    <td className="status-column">
                      <Skeleton className="h-5 w-16 bg-table-hover rounded-full mx-auto" />
                    </td>
                    <td className="financial-column">
                      <Skeleton className="h-5 w-full bg-table-hover ml-auto" style={{ maxWidth: '80px' }} />
                    </td>
                    <td className="financial-column">
                      <Skeleton className="h-5 w-full bg-table-hover ml-auto" style={{ maxWidth: '80px' }} />
                    </td>
                    <td className="financial-column">
                      <Skeleton className="h-5 w-full bg-table-hover ml-auto" style={{ maxWidth: '80px' }} />
                    </td>
                    <td className="actions-column">
                      <div className="flex justify-end space-x-1">
                        <Skeleton className="h-7 w-14 bg-table-hover rounded-md" />
                        <Skeleton className="h-7 w-7 bg-table-hover rounded-md" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : !sortedOrders || sortedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <p className="text-base text-white">No orders found</p>
                    <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or create a new order</p>
                  </td>
                </tr>
              ) : (
                sortedOrders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    userRole={userRole}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onDuplicate={onDuplicate}
                    onInvoice={onInvoice}
                    onStatusChange={onStatusChange}
                    isHovered={hoveredRowId === order.id}
                    onMouseEnter={() => handleRowMouseEnter(order.id)}
                    onMouseLeave={handleRowMouseLeave}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination using the TablePagination component - Fixed at the bottom */}
      <div className="border-t border-table-border py-5 px-5 bg-gray-950 flex-shrink-0 rounded-b-md">
        {/* Always show pagination when there's at least one record */}
        {(sortedOrders && sortedOrders.length > 0) && (
          <TablePagination
            currentPage={currentPage || 1}
            totalPages={Math.max(1, totalPages || 1)}
            totalCount={totalCount}
            onPageChange={onPageChange || (() => {})}
            className="py-2"
          />
        )}
      </div>
    </div>
  );
}
