import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Order, OrderStatus } from '@/types/orders';
import OrderRow from './OrderRow';
import { Button } from '@/components/ui/button';
import { Search, Filter, Download, PlusCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerChildren, listItem } from '@/utils/animation-variants';
import TablePagination from '@/components/ui/pagination/TablePagination';
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
  onCreateOrder: () => void;
  searchTerm: string;
}

// Sort configuration type
type SortConfig = {
  key: keyof Order | null;
  direction: 'ascending' | 'descending';
};

/**
 * OrdersTable displays a list of orders with sorting, filtering, and pagination
 * Enhanced with animations using Framer Motion
 */
const OrdersTable: React.FC<OrdersTableProps> = ({
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
}) => {
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' });
  const tableContainerRef = useRef<HTMLDivElement>(null);

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
      if (a[sortConfig.key!] < b[sortConfig.key!]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key!] > b[sortConfig.key!]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [orders, sortConfig]);

  // Get class names for sort headers
  const getSortIcon = (key: keyof Order) => {
    if (sortConfig.key !== key) return null;

    return sortConfig.direction === 'ascending'
      ? <ArrowUp className="ml-1 h-3 w-3 inline" />
      : <ArrowDown className="ml-1 h-3 w-3 inline" />;
  };

  // Fix for scrollbar alignment issues
  useEffect(() => {
    const fixTableHeaderAlignment = () => {
      const tableContainer = tableContainerRef.current;
      if (!tableContainer) return;

      const hasScrollbar = tableContainer.scrollHeight > tableContainer.clientHeight;
      const tableHeader = tableContainer.querySelector('thead');
      const scrollbarWidth = hasScrollbar ? window.innerWidth - document.documentElement.clientWidth : 0;

      if (tableHeader && scrollbarWidth > 0) {
        const lastHeaderCell = tableHeader.querySelector('th:last-child');
        if (lastHeaderCell && lastHeaderCell instanceof HTMLElement) {
          lastHeaderCell.style.paddingRight = `calc(1rem + ${scrollbarWidth}px)`;
        }
      }
    };

    fixTableHeaderAlignment();
    window.addEventListener('resize', fixTableHeaderAlignment);

    return () => {
      window.removeEventListener('resize', fixTableHeaderAlignment);
    };
  }, [orders]);

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="w-full sm:w-auto flex-1 flex flex-col sm:flex-row gap-2">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-table-header" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-8 bg-transparent border-table-border focus:border-brand text-white placeholder-table-header"
              aria-label="Search orders"
            />
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="icon"
              className="border-table-border bg-transparent hover:bg-table-hover text-table-header hover:text-white"
              onClick={onFilter}
              aria-label="Filter orders"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              className="border-table-border bg-transparent hover:bg-table-hover text-table-header hover:text-white"
              onClick={onExport}
              aria-label="Export orders"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onCreateOrder}
              className="bg-brand hover:bg-brand/90 text-white"
              aria-label="Create new order"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="border border-table-border rounded-xl overflow-hidden shadow-sm">
        <div ref={tableContainerRef} className="overflow-x-auto overflow-y-hidden max-h-[600px]" style={{ scrollbarGutter: 'stable' }}>
          <table className="min-w-full divide-y divide-table-border table-fixed" role="grid" aria-label="Orders table">
            <thead className="bg-background">
              <tr>
                <th scope="col" className="w-1/4 px-4 py-3 text-left text-xs font-medium text-table-header uppercase tracking-wider" aria-sort={sortConfig.key === 'client_name' ? sortConfig.direction : 'none'}>
                  <button
                    className="flex items-center text-table-header hover:text-white focus:outline-none"
                    onClick={() => requestSort('client_name')}
                    aria-label="Sort by client name"
                  >
                    Client {getSortIcon('client_name')}
                  </button>
                </th>
                <th scope="col" className="w-1/4 px-4 py-3 text-left text-xs font-medium text-table-header uppercase tracking-wider">
                  <button
                    className="flex items-center text-table-header hover:text-white focus:outline-none"
                    onClick={() => requestSort('client_type')}
                    aria-label="Sort by client type"
                  >
                    Client Type {getSortIcon('client_type')}
                  </button>
                </th>
                <th scope="col" className="w-1/4 px-4 py-3 text-left text-xs font-medium text-table-header uppercase tracking-wider">
                  <button
                    className="flex items-center text-table-header hover:text-white focus:outline-none"
                    onClick={() => requestSort('date')}
                    aria-label="Sort by date"
                  >
                    Date {getSortIcon('date')}
                  </button>
                </th>
                <th scope="col" className="w-1/4 px-4 py-3 text-left text-xs font-medium text-table-header uppercase tracking-wider">
                  <button
                    className="flex items-center text-table-header hover:text-white focus:outline-none"
                    onClick={() => requestSort('status')}
                    aria-label="Sort by status"
                  >
                    Status {getSortIcon('status')}
                  </button>
                </th>
                <th scope="col" className="w-1/4 px-4 py-3 text-right text-xs font-medium text-table-header uppercase tracking-wider">
                  <button
                    className="flex items-center justify-end w-full text-table-header hover:text-white focus:outline-none"
                    onClick={() => requestSort('total_amount')}
                    aria-label="Sort by total"
                  >
                    Total {getSortIcon('total_amount')}
                  </button>
                </th>
                <th scope="col" className="w-1/4 px-4 py-3 text-right text-xs font-medium text-table-header uppercase tracking-wider">
                  <button
                    className="flex items-center justify-end w-full text-table-header hover:text-white focus:outline-none"
                    onClick={() => requestSort('amount_paid')}
                    aria-label="Sort by cash paid"
                  >
                    Cash Paid {getSortIcon('amount_paid')}
                  </button>
                </th>
                <th scope="col" className="w-1/4 px-4 py-3 text-right text-xs font-medium text-table-header uppercase tracking-wider">
                  <button
                    className="flex items-center justify-end w-full text-table-header hover:text-white focus:outline-none"
                    onClick={() => requestSort('balance')}
                    aria-label="Sort by balance"
                  >
                    Balance {getSortIcon('balance')}
                  </button>
                </th>
                <th scope="col" className="w-1/4 px-4 py-3 text-right text-xs font-medium text-table-header uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <motion.tbody
              className="divide-y divide-table-border"
              variants={staggerChildren}
              initial="initial"
              animate="animate"
              style={{ overflowY: 'auto' }}
            >
              {loading ? (
                Array(5).fill(0).map((_, index) => (
                  <motion.tr key={`skeleton-${index}`} variants={listItem}>
                    {Array(8).fill(0).map((_, cellIndex) => (
                      <td key={`cell-${index}-${cellIndex}`} className="px-4 py-3 whitespace-nowrap">
                        <Skeleton className="h-6 w-full bg-table-hover" />
                      </td>
                    ))}
                  </motion.tr>
                ))
              ) : !sortedOrders || sortedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-3 text-center">
                    <p className="text-base text-table-header">No orders found</p>
                    <p className="text-sm text-table-secondaryText mt-1">Try adjusting your filters or create a new order</p>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {sortedOrders.map((order) => (
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
                  ))}
                </AnimatePresence>
              )}
            </motion.tbody>
          </table>
        </div>

        {/* Pagination using the TablePagination component */}
        <div className="border-t border-table-border py-4 px-4 bg-gray-950">
          {onPageChange && (
            <TablePagination
              currentPage={currentPage}
              totalPages={Math.max(1, totalPages)}
              totalCount={totalCount}
              onPageChange={onPageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(OrdersTable);