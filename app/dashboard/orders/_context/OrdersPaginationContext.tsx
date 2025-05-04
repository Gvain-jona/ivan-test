'use client';

import React, { createContext, useContext, ReactNode, useState, useMemo, useCallback, useRef } from 'react';
import { Order } from '@/types/orders';
import { useOrdersData } from './OrdersDataContext';
import { useOrdersFilter } from './OrdersFilterContext';

// Define the context type
interface OrdersPaginationContextType {
  // Pagination state
  currentPage: number;
  totalPages: number;
  paginatedOrders: Order[];
  totalCount?: number;
  
  // Pagination info for debugging
  paginationInfo: {
    rawTotalCount?: number;
    filteredCount: number;
    effectiveTotalCount?: number;
    ordersLength: number;
    displayPageSize: number;
    serverPageSize: number;
    currentDisplayPage: number;
    currentServerPage: number;
    calculatedTotalPages: number;
    usingFilteredData: boolean;
  };
  
  // Pagination handlers
  handlePageChange: (page: number) => void;
}

// Create the context
const OrdersPaginationContext = createContext<OrdersPaginationContextType | undefined>(undefined);

// Provider component
export const OrdersPaginationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Get orders data from OrdersDataContext
  const { orders, totalCount, currentPagination, setCurrentPagination } = useOrdersData();
  
  // Get filtered orders from OrdersFilterContext
  const { filteredOrders } = useOrdersFilter();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Display page size (for UI) - different from server fetch size
  const displayPageSize = 10;
  
  // Track if we're currently in a server-side pagination operation
  const isServerPaginatingRef = useRef(false);
  
  // Track the current request ID to handle race conditions
  const currentRequestIdRef = useRef<number>(0);
  
  // Calculate paginated orders from filtered data - show only 10 at a time for better UX
  const paginatedOrders = useMemo(() => {
    // Use filteredOrders instead of raw orders for pagination
    const ordersToUse = filteredOrders && filteredOrders.length > 0 ? filteredOrders : orders || [];
    
    if (ordersToUse.length === 0) {
      return [];
    }
    
    // Calculate start and end indices based on display page size
    const startIndex = (currentPage - 1) * displayPageSize;
    const endIndex = startIndex + displayPageSize;
    
    // Return only the orders for the current display page
    const result = ordersToUse.slice(startIndex, Math.min(endIndex, ordersToUse.length));
    
    return result;
  }, [orders, filteredOrders, currentPage, displayPageSize]);
  
  // Update total pages when data changes
  useMemo(() => {
    // When filters are applied, use filteredOrders.length as the totalCount
    const effectiveTotalCount = filteredOrders && filteredOrders.length > 0
      ? filteredOrders.length
      : (!totalCount && orders?.length) ? orders.length : totalCount;
    
    if (effectiveTotalCount !== undefined) {
      // Calculate total pages based on display page size (10) for better UX
      const calculatedTotalPages = Math.max(1, Math.ceil(effectiveTotalCount / displayPageSize));
      
      // Ensure we have at least 2 pages if we have more than displayPageSize records
      if (effectiveTotalCount > displayPageSize && calculatedTotalPages <= 1) {
        // Force at least 2 pages in this case
        setTotalPages(2);
      } else {
        setTotalPages(calculatedTotalPages);
      }
    }
  }, [totalCount, displayPageSize, orders?.length, filteredOrders?.length]);
  
  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    // Server fetch page size is 500, display page size is 10
    const serverPageSize = 500;
    
    // Use effective total count for calculation
    const effectiveTotalCount = filteredOrders && filteredOrders.length > 0
      ? filteredOrders.length
      : (!totalCount && orders?.length) ? orders.length : totalCount;
    
    // Calculate which server page this display page should be on
    const expectedServerPage = Math.ceil((page * displayPageSize) / serverPageSize);
    const actualServerPage = currentPagination.page;
    
    // Check if we need to fetch a different server page
    if (expectedServerPage !== actualServerPage) {
      // We need to fetch a different server page
      isServerPaginatingRef.current = true;
      currentRequestIdRef.current++;
      
      // Update server pagination
      setCurrentPagination({
        ...currentPagination,
        page: expectedServerPage
      });
    }
    
    // Update the current display page
    setCurrentPage(page);
  }, [currentPagination, displayPageSize, filteredOrders, orders, setCurrentPagination, totalCount]);
  
  // Calculate pagination info for debugging
  const paginationInfo = useMemo(() => ({
    rawTotalCount: totalCount, // The actual totalCount from the API
    filteredCount: filteredOrders?.length || 0, // The count after client-side filtering
    effectiveTotalCount: filteredOrders && filteredOrders.length > 0
      ? filteredOrders.length
      : (!totalCount && orders?.length) ? orders.length : totalCount, // The totalCount used for UI
    ordersLength: orders?.length || 0, // The length of the orders array
    displayPageSize, // The page size used for UI display
    serverPageSize: currentPagination.pageSize, // The page size used for server fetching
    currentDisplayPage: currentPage, // The current page in the UI
    currentServerPage: currentPagination.page, // The current page on the server
    calculatedTotalPages: totalPages, // The total pages calculated for UI
    usingFilteredData: filteredOrders && filteredOrders.length > 0, // Whether we're using filtered data
  }), [currentPage, currentPagination.page, currentPagination.pageSize, displayPageSize, filteredOrders, orders?.length, totalCount, totalPages]);

  const contextValue = {
    // Pagination state
    currentPage,
    totalPages,
    paginatedOrders,
    totalCount: filteredOrders && filteredOrders.length > 0
      ? filteredOrders.length
      : (!totalCount && orders?.length) ? orders.length : totalCount,
    
    // Pagination info for debugging
    paginationInfo,
    
    // Pagination handlers
    handlePageChange
  };

  return (
    <OrdersPaginationContext.Provider value={contextValue}>
      {children}
    </OrdersPaginationContext.Provider>
  );
};

// Hook to use the orders pagination context
export const useOrdersPagination = () => {
  const context = useContext(OrdersPaginationContext);
  if (context === undefined) {
    throw new Error('useOrdersPagination must be used within an OrdersPaginationProvider');
  }
  return context;
};
