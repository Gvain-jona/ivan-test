import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Order } from '@/types/orders';

/**
 * Custom hook to manage order pagination functionality
 * Enhanced to better handle server-side pagination
 *
 * @deprecated This hook has been replaced with server-side pagination in OrdersPageContext.tsx.
 * A backup of this hook is available in _hooks/_deprecated/useOrdersPagination.backup.ts.
 * This file will be removed in a future update.
 */
export const useOrdersPagination = (
  orders: Order[],
  serverTotalCount?: number,
  serverPageCount?: number,
  initialPageSize: number = 10 // Default to 10 items per page for client-side pagination
) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialPageSize);
  const [totalPages, setTotalPages] = useState(1);
  const isInitialRender = useRef(true);
  const previousOrdersLength = useRef(0);
  const previousServerTotalCount = useRef<number | undefined>(undefined);

  // Log pagination state for debugging
  useEffect(() => {
    console.log('Pagination state:', {
      currentPage,
      itemsPerPage,
      totalPages,
      ordersLength: orders?.length || 0,
      serverTotalCount,
      serverPageCount,
      calculatedTotalPages: serverTotalCount ? Math.ceil(serverTotalCount / itemsPerPage) : undefined
    });
  }, [currentPage, itemsPerPage, totalPages, orders?.length, serverTotalCount, serverPageCount]);

  // Update total pages when server total count changes
  useEffect(() => {
    // Always prioritize server total count if available
    if (serverTotalCount !== undefined) {
      console.log('Updating total pages based on server total count:', serverTotalCount);
      const newTotalPages = Math.max(1, Math.ceil(serverTotalCount / itemsPerPage));
      setTotalPages(newTotalPages);
      previousServerTotalCount.current = serverTotalCount;
      isInitialRender.current = false;
    }
    // Otherwise, fall back to calculating from orders length
    else if (orders && orders.length > 0) {
      console.log('Updating total pages based on orders length:', orders.length);
      setTotalPages(Math.max(1, Math.ceil(orders.length / itemsPerPage)));
      previousOrdersLength.current = orders.length;
      isInitialRender.current = false;
    }
    // If we have no data yet, ensure we have at least 1 page
    else {
      console.log('No data available, setting total pages to 1');
      setTotalPages(1);
      isInitialRender.current = false;
    }
  }, [orders, itemsPerPage, serverTotalCount, serverPageCount]);

  // Calculate paginated orders with safeguards
  const paginatedOrders = useMemo(() => {
    // If orders array is empty, return empty array
    if (!orders || orders.length === 0) {
      return [];
    }

    // Calculate start and end indices
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    // Ensure startIndex is valid
    if (startIndex >= orders.length) {
      // If current page is invalid, reset to page 1
      if (currentPage > 1) {
        // Use setTimeout to avoid state updates during render
        setTimeout(() => setCurrentPage(1), 0);
        return orders.slice(0, itemsPerPage);
      }
    }

    // Log pagination details for debugging
    console.log('Paginating orders:', {
      totalOrders: orders.length,
      currentPage,
      itemsPerPage,
      startIndex,
      endIndex,
      visibleOrders: orders.slice(startIndex, endIndex).length
    });

    // Return only the orders for the current page
    return orders.slice(startIndex, endIndex);
  }, [orders, currentPage, itemsPerPage]);

  // Handle page change with validation
  const handlePageChange = useCallback((page: number) => {
    // Validate page number
    const validPage = Math.max(1, Math.min(page, totalPages));
    console.log(`Changing page from ${currentPage} to ${validPage} (max: ${totalPages})`);
    setCurrentPage(validPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, totalPages]);

  // Handle change of items per page
  const handleItemsPerPageChange = useCallback((count: number) => {
    console.log(`Changing items per page from ${itemsPerPage} to ${count}`);
    setItemsPerPage(count);
    setCurrentPage(1); // Reset to first page when changing items per page

    // Calculate new total pages based on server total count if available
    if (serverTotalCount !== undefined) {
      const newTotalPages = Math.max(1, Math.ceil(serverTotalCount / count));
      setTotalPages(newTotalPages);
    }
    // Otherwise fall back to orders length
    else if (orders && orders.length > 0) {
      setTotalPages(Math.ceil(orders.length / count));
    }
  }, [orders, itemsPerPage, serverTotalCount]);

  // Reset to first page (used when filters change)
  const resetPagination = useCallback(() => {
    console.log('Resetting pagination to page 1');
    setCurrentPage(1);
  }, []);

  // Update total pages externally (when filtered results count is provided)
  const updateTotalPages = useCallback((filteredCount: number, forceUseFiltered: boolean = false) => {
    // Determine which count to use:
    // 1. If forceUseFiltered is true, use the filtered count
    // 2. Otherwise, if we have a server total count, use that
    // 3. Otherwise, use the filtered count
    const countToUse = forceUseFiltered ? filteredCount :
                       (serverTotalCount !== undefined ? serverTotalCount : filteredCount);

    console.log(`Updating total pages based on count: ${countToUse} (filtered: ${filteredCount}, server: ${serverTotalCount}, forceUseFiltered: ${forceUseFiltered})`);
    const newTotalPages = Math.max(1, Math.ceil(countToUse / itemsPerPage));
    setTotalPages(newTotalPages);

    // Ensure current page is valid for new total
    if (currentPage > newTotalPages) {
      console.log(`Current page ${currentPage} exceeds new total pages ${newTotalPages}, resetting to page 1`);
      setCurrentPage(1);
    }
  }, [currentPage, itemsPerPage, serverTotalCount]);

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedOrders,
    handlePageChange,
    handleItemsPerPageChange,
    resetPagination,
    updateTotalPages,
    // Add server-side pagination info for debugging
    serverTotalCount,
    serverPageCount
  };
};
