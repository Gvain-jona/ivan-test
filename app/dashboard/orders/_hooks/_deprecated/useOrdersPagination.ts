import { useState, useCallback, useMemo } from 'react';
import { Order } from '@/types/orders';

/**
 * Custom hook to manage order pagination functionality
 */
export const useOrdersPagination = (orders: Order[]) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  // Update total pages when orders change
  useMemo(() => {
    setTotalPages(Math.ceil(orders.length / itemsPerPage));
  }, [orders.length, itemsPerPage]);
  
  // Calculate paginated orders
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return orders.slice(startIndex, endIndex);
  }, [orders, currentPage, itemsPerPage]);
  
  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
  // Handle change of items per page
  const handleItemsPerPageChange = useCallback((count: number) => {
    setItemsPerPage(count);
    setCurrentPage(1); // Reset to first page when changing items per page
    setTotalPages(Math.ceil(orders.length / count));
  }, [orders.length]);
  
  // Reset to first page (used when filters change)
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);
  
  // Update total pages externally (when filtered results count is provided)
  const updateTotalPages = useCallback((filteredCount: number) => {
    setTotalPages(Math.ceil(filteredCount / itemsPerPage));
    // Ensure current page is valid for new total
    if (currentPage > Math.ceil(filteredCount / itemsPerPage)) {
      setCurrentPage(1);
    }
  }, [currentPage, itemsPerPage]);
  
  return {
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedOrders,
    handlePageChange,
    handleItemsPerPageChange,
    resetPagination,
    updateTotalPages
  };
}; 