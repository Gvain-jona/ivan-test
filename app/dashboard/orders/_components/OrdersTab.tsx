'use client';

import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import OrdersTable from '@/components/orders/OrdersTableNew';
import FilterDrawer, { OrderFilters as FilterTypes } from '../../../components/orders/FilterDrawer';
import { useOrdersPage } from '../_context/OrdersPageContext';
import { useLoading } from '@/components/loading';
import { useOrders } from '@/hooks/useData';
import { OrdersTableSkeleton } from '@/components/ui/loading-states';

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

    // Pagination
    paginatedOrders,
    filteredOrders,
    currentPage,
    totalPages,
    handlePageChange,

    // Loading
    loading,
    handleLoadMore,

    // User role
    userRole,

    // Modal handlers
    handleViewOrder,
    handleEditOrder,
    handleDeleteOrder,
    handleDuplicateOrder,
    handleGenerateInvoice,
    handleOrderStatusChange,
    handleCreateOrder,
  } = useOrdersPage();

  // Use our consolidated data hook with loading state management
  const { isLoading: ordersLoading, orders: directOrders, isValidating } = useOrders();

  // Use the loading provider for component-specific loading states
  const { loadingIds } = useLoading();

  // Track if we've attempted to load data
  const [dataAttempted, setDataAttempted] = useState(false);

  // Combined loading state - show skeleton if either context loading or SWR loading is true
  const isLoading = loading || ordersLoading || loadingIds.has('orders');

  // Set dataAttempted to true once loading completes
  React.useEffect(() => {
    if (!isLoading && !dataAttempted) {
      setDataAttempted(true);
    }
  }, [isLoading, dataAttempted]);

  // Track if we have any data at all (either from context or direct hook)
  const hasAnyData =
    (filteredOrders && filteredOrders.length > 0) ||
    (directOrders && directOrders.length > 0);

  // Log the data state for debugging
  React.useEffect(() => {
    console.log('OrdersTab - Data state:', {
      directOrders: directOrders?.length || 0,
      directOrdersData: directOrders ? directOrders.slice(0, 2) : null, // Log first 2 orders for debugging
      paginatedOrders: paginatedOrders?.length || 0,
      filteredOrders: filteredOrders?.length || 0,
      hasData: !!directOrders && directOrders.length > 0,
      isLoading,
      isValidating
    });

    // If we have direct orders but no filtered/paginated orders, force a refresh
    if (directOrders && directOrders.length > 0 &&
        (!filteredOrders || filteredOrders.length === 0) &&
        (!paginatedOrders || paginatedOrders.length === 0)) {
      console.log('OrdersTab - Forcing refresh because we have direct orders but no filtered/paginated orders');
      handleLoadMore(false); // Don't show toast
    }
  }, [directOrders, paginatedOrders, filteredOrders, isLoading, isValidating, handleLoadMore]);

  // Directly use the orders data if available, even if not authenticated
  React.useEffect(() => {
    if (directOrders && directOrders.length > 0) {
      console.log('OrdersTab - Using direct orders data:', directOrders.length);
    }
  }, [directOrders]);

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
        {/* Show skeleton only during initial loading and when we have no data */}
        {isLoading && !hasAnyData && !dataAttempted ? (
          <>
            <div className="mb-2 text-xs text-muted-foreground text-center">
              Loading orders data...
            </div>
            <OrdersTableSkeleton rows={10} />
          </>
        ) : (
          <>
            {/* Show refreshing indicator when validating but we already have data */}
            {isValidating && hasAnyData && (
              <div className="mb-2 text-xs text-muted-foreground text-center animate-pulse">
                Refreshing data...
              </div>
            )}

            <OrdersTable
              orders={paginatedOrders && paginatedOrders.length > 0 ? paginatedOrders : directOrders || []}
              totalCount={(filteredOrders && filteredOrders.length > 0) ? filteredOrders.length : (directOrders?.length || 0)}
              userRole={userRole}
              onView={handleViewOrder}
              onEdit={handleEditOrder}
              onDelete={handleDeleteOrder}
              onDuplicate={handleDuplicateOrder}
              onInvoice={handleGenerateInvoice}
              onStatusChange={handleOrderStatusChange}
              onLoadMore={handleLoadMore}
              loading={isLoading && !hasAnyData} // Only pass loading=true during initial load
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onSearch={handleSearch}
              onFilter={toggleFilters}
              onExport={() => console.log('Export')}
              onCreateOrder={handleCreateOrder}
              searchTerm={searchTerm}
              showFilters={showFilters}
            />
          </>
        )}

        {/* Development mode indicator */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-20 right-4 bg-yellow-500/80 text-black px-3 py-1 rounded-md text-xs font-medium">
            Dev Mode - No Auth Required
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersTab;