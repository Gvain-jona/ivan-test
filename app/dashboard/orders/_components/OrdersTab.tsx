'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../../components/ui/button';
import OrdersTable from '@/components/orders/OrdersTableNew';
import FilterDrawer, { OrderFilters as FilterTypes } from '../../../components/orders/FilterDrawer';
import { useOrdersPage } from '../_context';
import { useLoading } from '@/components/loading';
import { useOrders } from '@/hooks/useData';
import { OrdersTableSkeleton } from '@/components/ui/loading-states';
import { mutate } from 'swr';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import { createSWRConfig } from '@/lib/swr-config';

/**
 * Tab content for the Orders tab in the Orders page
 */
const OrdersTab: React.FC = () => {
  const {
    // Filtering
    filters,
    showFilters,
    handleFilterChange,
    handleSearch,
    resetFilters,
    searchTerm,
    toggleFilters,

    // Quick filters
    selectedStatus,
    selectedPaymentStatus,
    selectedClientType,
    dateRange,
    handleStatusFilterChange,
    handlePaymentStatusFilterChange,
    handleClientTypeFilterChange,
    handleDateRangeChange,

    // Pagination
    paginatedOrders,
    filteredOrders,
    currentPage,
    totalPages,
    totalCount, // Get totalCount from context
    rawTotalCount, // Get raw total count for debugging
    handlePageChange,

    // Loading
    loading,
    handleLoadMore,

    // User role
    userRole,

    // Modal handlers
    handleViewOrder,
    handleDeleteOrder,
    handleDuplicateOrder,
    handleGenerateInvoice,
    handleOrderStatusChange,
    handleCreateOrder,
  } = useOrdersPage();

  // Use our consolidated data hook with loading state management
  const {
    isLoading: ordersLoading,
    orders: directOrders,
    isValidating,
    mutate: refreshDirectOrders
  } = useOrders(undefined, undefined, {
    ...createSWRConfig('list', {
      // Disable revalidation on focus to reduce API calls
      revalidateOnFocus: false,
      // Always revalidate stale data
      revalidateIfStale: true,
      // Disable automatic refresh - we'll handle it with our own interval
      refreshInterval: 0
    })
  });

  // Function to force refresh the orders data
  const forceRefreshOrders = useCallback(() => {
    // Refresh the direct orders data
    refreshDirectOrders();
    // Also refresh the orders data in the context
    handleLoadMore(false);
    // Only invalidate specific orders-related cache keys
    mutate(
      (key) => {
        if (typeof key === 'string') {
          // Only match the main orders endpoint and optimized endpoint
          return key === API_ENDPOINTS.ORDERS ||
                 key.includes(`${API_ENDPOINTS.ORDERS}/optimized`);
        }
        return false;
      },
      undefined,
      { revalidate: true }
    );
  }, [refreshDirectOrders, handleLoadMore]);

  // Use the loading provider for component-specific loading states
  const { loadingIds } = useLoading();

  // Track if we've attempted to load data
  const [dataAttempted, setDataAttempted] = useState(false);

  // Track if we have any data at all (either from context or direct hook)
  const hasAnyData =
    (filteredOrders && filteredOrders.length > 0) ||
    (directOrders && directOrders.length > 0);

  // Combined loading state - show skeleton if either context loading or SWR loading is true
  // But only if we don't have any data yet
  const isInitialLoading = (loading || ordersLoading || loadingIds.has('orders')) && !hasAnyData;

  // Track if we're just refreshing data (validating) but already have data to show
  const isRefreshing = isValidating && hasAnyData;

  // Set dataAttempted to true once loading completes
  React.useEffect(() => {
    if (!isInitialLoading && !dataAttempted) {
      setDataAttempted(true);
    }
  }, [isInitialLoading, dataAttempted, hasAnyData]);

  // Check if we need to force a refresh
  React.useEffect(() => {
    // If we have direct orders but no server-side orders, force a refresh
    if (directOrders && directOrders.length > 0 &&
        (!paginatedOrders || paginatedOrders.length === 0)) {
      handleLoadMore(false); // Don't show toast
    }
  }, [directOrders, paginatedOrders, handleLoadMore]);

  // Directly use the orders data if available, even if not authenticated
  React.useEffect(() => {
    // Data availability check (debug logs removed)
  }, [directOrders]);

  // Set up an interval to periodically refresh the orders data
  React.useEffect(() => {
    // Refresh the orders data every 30 minutes to reduce API calls
    const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

    const intervalId = setInterval(() => {
      console.log('OrdersTab - Auto-refreshing orders data after 30 minutes');
      // Only refresh if the document is visible
      if (document.visibilityState === 'visible') {
        forceRefreshOrders();
      } else {
        console.log('OrdersTab - Skipping refresh because document is not visible');
      }
    }, REFRESH_INTERVAL);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [forceRefreshOrders]);

  // Listen for visibility changes to refresh data when the tab becomes visible
  // but only if it's been a significant amount of time since the last refresh
  React.useEffect(() => {
    // Track the last refresh time
    let lastRefreshTime = Date.now();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Only refresh if it's been at least 10 minutes since the last refresh
        const now = Date.now();
        const timeSinceLastRefresh = now - lastRefreshTime;
        const MIN_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

        if (timeSinceLastRefresh > MIN_REFRESH_INTERVAL) {
          console.log('OrdersTab - Tab became visible after 10+ minutes, refreshing orders data');
          forceRefreshOrders();
          lastRefreshTime = now;
        } else {
          console.log('OrdersTab - Tab became visible, but skipping refresh (last refresh was too recent)');
        }
      }
    };

    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up event listener
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [forceRefreshOrders]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Filter Drawer - Only render when it's open to prevent unnecessary API calls */}
      {showFilters && (
        <FilterDrawer
          open={showFilters}
          onOpenChange={toggleFilters}
          onApplyFilters={(newFilters: FilterTypes) => {
            handleFilterChange(newFilters);
          }}
          onResetFilters={resetFilters}
          initialFilters={filters}
        />
      )}

      {/* Orders Table - Using flex-1 and min-h-0 to ensure proper scrolling */}
      <div className="flex-1 min-h-0">
        {/* Show skeleton only during initial loading when we have no data */}
        {isInitialLoading ? (
          <>
            <div className="mb-2 text-xs text-muted-foreground text-center">
              Loading orders data...
            </div>
            <OrdersTableSkeleton rows={10} />
          </>
        ) : (
          <>
            {/* Show refreshing indicator when validating but we already have data */}
            {isRefreshing && (
              <div className="mb-2 text-xs text-muted-foreground text-center animate-pulse">
                Refreshing data...
              </div>
            )}

            <OrdersTable
              orders={paginatedOrders || directOrders || []}
              totalCount={totalCount || 0} // Use totalCount from context
              userRole={userRole}
              onView={handleViewOrder}
              onEdit={handleViewOrder} /* Use view handler instead of edit handler */
              onDelete={handleDeleteOrder}
              onDuplicate={handleDuplicateOrder}
              onInvoice={handleGenerateInvoice}
              onStatusChange={handleOrderStatusChange}
              onLoadMore={forceRefreshOrders} // Use forceRefreshOrders instead of handleLoadMore
              loading={loading || isInitialLoading} // Pass loading state from context
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onSearch={handleSearch}
              onFilter={toggleFilters}
              onExport={() => console.log('Export')}
              onCreateOrder={handleCreateOrder}
              searchTerm={searchTerm}

              // Quick filters
              selectedStatus={selectedStatus}
              onStatusFilterChange={handleStatusFilterChange}
              selectedPaymentStatus={selectedPaymentStatus}
              onPaymentStatusFilterChange={handlePaymentStatusFilterChange}
              selectedClientType={selectedClientType}
              onClientTypeFilterChange={handleClientTypeFilterChange}
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
              showFilters={showFilters}
            />
          </>
        )}


      </div>
    </div>
  );
};

export default OrdersTab;