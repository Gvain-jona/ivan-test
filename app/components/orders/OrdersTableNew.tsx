"use client"

import React, { useState, useMemo, useCallback } from 'react';
import type { OrderSummary } from '@/hooks/orders/useOrders';
import { useOrganization } from '@/hooks/organization/useOrganization';
import { ArrowUp, ArrowDown } from 'lucide-react';
import OrderRow from './OrderRow';
import OrderCard from './OrderCard';
import OrdersFilterSheet from './OrdersFilterSheet';
import { Button } from '@/app/components/ui/button';
import {
  Search, RefreshCw, X, Calendar,
  CreditCard, ClipboardList, SlidersHorizontal
} from 'lucide-react';
import { useLoading, LoadingButton } from '@/components/loading';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/app/components/ui/select';
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/app/components/ui/popover';
import { DateRangePicker } from '@/app/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import TablePagination from '@/app/components/ui/pagination/TablePagination';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface OrdersTableProps {
  orders: OrderSummary[];
  totalCount: number;
  userRole: 'admin' | 'manager' | 'employee';
  onView: (order: OrderSummary) => void;
  onDelete: (order: OrderSummary) => void;
  onStatusChange: (order: OrderSummary, status: string) => void;
  onLoadMore: () => void;
  loading: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onSearch: (term: string) => void;
  searchTerm: string;

  // Quick filter props — the table header is the filter UI (the legacy
  // FilterDrawer was deleted in cleanup Phase 2). Client-type filtering
  // was dropped with it: the v2 orders API has no client_type param.
  selectedStatus?: string[];
  onStatusFilterChange?: (statuses: string[]) => void;
  selectedPaymentStatus?: string[];
  onPaymentStatusFilterChange?: (statuses: string[]) => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
}

// Sort configuration type
type SortConfig = {
  key: keyof OrderSummary | null;
  direction: 'ascending' | 'descending';
};

export default function OrdersTable(props: OrdersTableProps) {
  const {
    orders,
    totalCount,
    userRole,
    onView,
    onDelete,
    onStatusChange,
    onLoadMore,
    loading,
    currentPage = 1,
    totalPages = 1,
    onPageChange,
    onSearch,
    searchTerm,

    // Quick filter props with defaults
    selectedStatus = [],
    onStatusFilterChange = () => {},
    selectedPaymentStatus = [],
    onPaymentStatusFilterChange = () => {},
    dateRange,
    onDateRangeChange = () => {},
  } = props;

  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' });

  // Number of active filter groups (drives the mobile Filter button badge).
  const activeFilterCount =
    (selectedStatus.length > 0 ? 1 : 0) +
    (selectedPaymentStatus.length > 0 ? 1 : 0) +
    (dateRange ? 1 : 0);

  const clearAllFilters = () => {
    onSearch('');
    onStatusFilterChange([]);
    onPaymentStatusFilterChange([]);
    onDateRangeChange(undefined);
  };
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  // Status list is org-configurable in v2 (organizations.settings)
  const { orderStatuses } = useOrganization();

  // Memoize row mouse enter/leave handlers
  const handleRowMouseEnter = useCallback((id: string) => {
    setHoveredRowId(id);
  }, []);

  const handleRowMouseLeave = useCallback(() => {
    setHoveredRowId(null);
  }, []);

  // Handle sort request
  const requestSort = useCallback((key: keyof OrderSummary) => {
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
      const aValue = a[sortConfig.key as keyof OrderSummary] ?? '';
      const bValue = b[sortConfig.key as keyof OrderSummary] ?? '';

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
  const getSortIcon = (key: keyof OrderSummary) => {
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
              onChange={(e) => {
                // Apply the search immediately for instant feedback
                onSearch(e.target.value);
              }}
              className={cn(
                "pl-9 pr-8 w-full bg-[hsl(var(--table-search-bg))] border-[hsl(var(--table-border))]",
                searchTerm && "pr-8" // Add padding for the clear button
              )}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            {/* Clear search button */}
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearch("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {/* Mobile: one Filter button opens the bottom sheet. The inline
              quick filters below are desktop-only. */}
          <Button
            variant="outline"
            onClick={() => setFilterOpen(true)}
            className="relative h-9 flex-1 justify-center gap-2 border-[hsl(var(--table-border))] bg-[hsl(var(--table-search-bg))] sm:flex-none lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filter
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 rounded-full px-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {/* Desktop: inline quick filters */}
          <div className="hidden items-center gap-2 flex-wrap lg:flex">
          {/* Status Quick Filter */}
          <div className="relative">
            <Select
              value={selectedStatus.length === 0 ? "all" : selectedStatus.length === 1 ? selectedStatus[0] : "multiple"}
              onValueChange={(value) => {
                if (value === "all") {
                  onStatusFilterChange([]);
                } else {
                  onStatusFilterChange([value]);
                }
              }}
            >
              <SelectTrigger className="h-9 px-3 py-2 w-[130px] bg-[hsl(var(--table-search-bg))] border-[hsl(var(--table-border))]">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {orderStatuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedStatus.length > 0 && (
              <Badge
                variant="secondary"
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full"
              >
                {selectedStatus.length}
              </Badge>
            )}
          </div>

          {/* Payment Status Quick Filter */}
          <div className="relative">
            <Select
              value={selectedPaymentStatus.length === 0 ? "all" : selectedPaymentStatus.length === 1 ? selectedPaymentStatus[0] : "multiple"}
              onValueChange={(value) => {
                if (value === "all") {
                  onPaymentStatusFilterChange([]);
                } else {
                  onPaymentStatusFilterChange([value]);
                }
              }}
            >
              <SelectTrigger className="h-9 px-3 py-2 w-[130px] bg-[hsl(var(--table-search-bg))] border-[hsl(var(--table-border))]">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Payment" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
            {selectedPaymentStatus.length > 0 && (
              <Badge
                variant="secondary"
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full"
              >
                {selectedPaymentStatus.length}
              </Badge>
            )}
          </div>

          {/* Date Range Quick Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-9 px-3 py-2 bg-[hsl(var(--table-search-bg))] border-[hsl(var(--table-border))]",
                  dateRange && "text-foreground"
                )}
              >
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd")
                  )
                ) : (
                  <span>Date Range</span>
                )}
                {dateRange && (
                  <span
                    className="ml-1 cursor-pointer text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDateRangeChange(undefined);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={onDateRangeChange}
              />
            </PopoverContent>
          </Popover>

          </div>

          {/* Keep the Refresh Button */}
          <LoadingButton
            variant="outline"
            size="icon"
            onClick={onLoadMore}
            className="h-9 w-9 border-[hsl(var(--table-border))] bg-[hsl(var(--table-search-bg))]"
            isLoading={loading}
            loadingText=""
            title="Refresh Orders"
          >
            <RefreshCw className="h-4 w-4" />
          </LoadingButton>
        </div>
      </div>

      {/* Active filters indicator */}
      {(searchTerm || selectedStatus.length > 0 || selectedPaymentStatus.length > 0 || dateRange) && (
        <div className="px-4 py-2 border-b border-[hsl(var(--table-border))] bg-[hsl(var(--table-search-bg))] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search term indicator */}
            {searchTerm && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Search: <span className="font-medium text-foreground">"{searchTerm}"</span>
                </span>
              </div>
            )}

            {/* Status filter indicator */}
            {selectedStatus.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">Status:</span>
                <div className="flex gap-1 flex-wrap">
                  {selectedStatus.map(status => (
                    <Badge key={status} variant="outline" className="text-xs">
                      {status.replace('_', ' ')}
                      <span
                        className="ml-1 hover:text-foreground cursor-pointer"
                        onClick={() => onStatusFilterChange(selectedStatus.filter(s => s !== status))}
                      >
                        <X className="h-3 w-3" />
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Payment status filter indicator */}
            {selectedPaymentStatus.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">Payment:</span>
                <div className="flex gap-1 flex-wrap">
                  {selectedPaymentStatus.map(status => (
                    <Badge key={status} variant="outline" className="text-xs">
                      {status.replace('_', ' ')}
                      <span
                        className="ml-1 hover:text-foreground cursor-pointer"
                        onClick={() => onPaymentStatusFilterChange(selectedPaymentStatus.filter(s => s !== status))}
                      >
                        <X className="h-3 w-3" />
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Date range filter indicator */}
            {dateRange && (
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">Date:</span>
                <Badge variant="outline" className="text-xs">
                  {dateRange.from ? format(dateRange.from, "MMM dd, yyyy") : ''}
                  {dateRange.to && ` - ${format(dateRange.to, "MMM dd, yyyy")}`}
                  <span
                    className="ml-1 hover:text-foreground cursor-pointer"
                    onClick={() => onDateRangeChange(undefined)}
                  >
                    <X className="h-3 w-3" />
                  </span>
                </Badge>
              </div>
            )}

            <Badge variant="outline" className="ml-2">
              {orders.length} {orders.length === 1 ? 'result' : 'results'}
            </Badge>
          </div>

          {/* Clear all filters button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSearch("");
              onStatusFilterChange([]);
              onPaymentStatusFilterChange([]);
              onDateRangeChange(undefined);
            }}
            className="h-8 px-2 text-xs"
          >
            Clear all filters
          </Button>
        </div>
      )}

      {/* Table Container - This is the scrollable area */}
      <div
        ref={tableContainerRef}
        className="flex-1 min-h-0 overflow-auto relative w-full p-3 lg:p-1"
      >
        {/* Mobile: card-first list (per DESIGN_PHILOSOPHY.md — order data is
            cards on mobile, not a shrunk table). Desktop keeps the table. */}
        <div className="space-y-3 lg:hidden">
          {loading ? (
            Array(5).fill(0).map((_, index) => (
              <div
                key={`card-skeleton-${index}`}
                className="h-[152px] animate-pulse rounded-2xl border border-border bg-card"
              />
            ))
          ) : !sortedOrders || sortedOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
              <p className="text-base font-medium text-foreground">No orders found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your filters or create a new order
              </p>
            </div>
          ) : (
            sortedOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                userRole={userRole}
                onView={onView}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
              />
            ))
          )}
        </div>

        <div className="hidden w-full lg:block">
          <table className="w-full table-fixed divide-y divide-[hsl(var(--table-border))] rounded-md overflow-hidden" style={{ width: '100%', tableLayout: 'fixed' }}>
            <thead className="sticky top-0 bg-[hsl(var(--table-header-bg))] z-10 w-full border-b border-[hsl(var(--table-border))] shadow-sm">
              <tr>
                <th scope="col" className="w-[250px] px-2 py-2.5 text-left text-sm font-medium tracking-wider client-column">
                  <button
                    className="flex items-center justify-start w-full text-[hsl(var(--table-header-text))] hover:text-foreground focus:outline-none"
                    onClick={() => requestSort('order_number')}
                    aria-label="Sort by client"
                  >
                    <span className="flex items-center">Client {getSortIcon('order_number')}</span>
                  </button>
                </th>

                <th scope="col" className="date-column px-4 py-2.5 text-left text-sm font-medium tracking-wider">
                  <button
                    className="flex items-center justify-start w-full text-[hsl(var(--table-header-text))] hover:text-foreground focus:outline-none"
                    onClick={() => requestSort('order_date')}
                    aria-label="Sort by date"
                  >
                    <span className="flex items-center">Date {getSortIcon('order_date')}</span>
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
                    <p className="text-base text-foreground">No orders found</p>
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
                    onDelete={onDelete}
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
      <div className="border-t border-table-border py-5 px-5 bg-[hsl(var(--table-background))] flex-shrink-0 rounded-b-md">
        {/* Always show pagination when there's at least one record */}
        {(sortedOrders && sortedOrders.length > 0) && (
          <>

            <TablePagination
              currentPage={currentPage || 1}
              totalPages={Math.max(1, totalPages || 1)}
              totalCount={totalCount || orders.length}
              pageSize={10} // Explicitly set page size to 10 for UI display
              onPageChange={onPageChange || (() => {})}
              className="py-2"
              isLoading={loading}
            />
          </>
        )}
      </div>

      {/* Mobile filter bottom sheet (opened by the Filter button above). */}
      <OrdersFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        orderStatuses={orderStatuses}
        selectedStatus={selectedStatus}
        onStatusChange={onStatusFilterChange}
        selectedPaymentStatus={selectedPaymentStatus}
        onPaymentStatusChange={onPaymentStatusFilterChange}
        dateRange={dateRange}
        onDateRangeChange={onDateRangeChange}
        resultCount={totalCount || orders.length}
        onClearAll={clearAllFilters}
      />
    </div>
  );
}
