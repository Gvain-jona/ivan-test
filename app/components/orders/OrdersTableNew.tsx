"use client"

import React, { useState, useMemo, useCallback } from 'react';
import { Order, OrderStatus, PaymentStatus } from '@/types/orders';
import OrderRow from './OrderRow';
import { Button } from '@/app/components/ui/button';
import {
  Search, Filter, RefreshCw, X, Calendar,
  CreditCard, ClipboardList, ChevronDown, Users
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
import { DateRange } from 'react-day-picker';
import TablePagination from '@/app/components/ui/pagination/TablePagination';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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

  // New quick filter props
  selectedStatus?: OrderStatus[];
  onStatusFilterChange?: (statuses: OrderStatus[]) => void;
  selectedPaymentStatus?: PaymentStatus[];
  onPaymentStatusFilterChange?: (statuses: PaymentStatus[]) => void;
  selectedClientType?: ClientType[];
  onClientTypeFilterChange?: (types: ClientType[]) => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
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

    // New quick filter props with defaults
    selectedStatus = [],
    onStatusFilterChange = () => {},
    selectedPaymentStatus = [],
    onPaymentStatusFilterChange = () => {},
    selectedClientType = [],
    onClientTypeFilterChange = () => {},
    dateRange,
    onDateRangeChange = () => {},
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
          {/* Status Quick Filter */}
          <div className="relative">
            <Select
              value={selectedStatus.length === 0 ? "all" : selectedStatus.length === 1 ? selectedStatus[0] : "multiple"}
              onValueChange={(value) => {
                if (value === "all") {
                  onStatusFilterChange([]);
                } else {
                  onStatusFilterChange([value as OrderStatus]);
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
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
                  onPaymentStatusFilterChange([value as PaymentStatus]);
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
                <SelectItem value="partially_paid">Partially Paid</SelectItem>
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

          {/* Client Type Quick Filter */}
          <div className="relative">
            <Select
              value={selectedClientType.length === 0 ? "all" : selectedClientType.length === 1 ? selectedClientType[0] : "multiple"}
              onValueChange={(value) => {
                if (value === "all") {
                  onClientTypeFilterChange([]);
                } else {
                  onClientTypeFilterChange([value as ClientType]);
                }
              }}
            >
              <SelectTrigger className="h-9 px-3 py-2 w-[130px] bg-[hsl(var(--table-search-bg))] border-[hsl(var(--table-border))]">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Client Type" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
              </SelectContent>
            </Select>
            {selectedClientType.length > 0 && (
              <Badge
                variant="secondary"
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full"
              >
                {selectedClientType.length}
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
      {(searchTerm || selectedStatus.length > 0 || selectedPaymentStatus.length > 0 || selectedClientType.length > 0 || dateRange) && (
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

            {/* Client type filter indicator */}
            {selectedClientType.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">Client:</span>
                <div className="flex gap-1 flex-wrap">
                  {selectedClientType.map(type => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                      <span
                        className="ml-1 hover:text-foreground cursor-pointer"
                        onClick={() => onClientTypeFilterChange(selectedClientType.filter(t => t !== type))}
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
                  {format(dateRange.from, "MMM dd, yyyy")}
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
              onClientTypeFilterChange([]);
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
    </div>
  );
}
