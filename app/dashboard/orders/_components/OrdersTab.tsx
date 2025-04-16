'use client';

import React from 'react';
import { Button } from '../../../components/ui/button';
import OrdersTable from '@/components/orders/OrdersTableNew';
import FilterDrawer, { OrderFilters as FilterTypes } from '../../../components/orders/FilterDrawer';
import { useOrdersPage } from '../_context/OrdersPageContext';
import { useOrdersData } from '@/hooks/useOrdersData';
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

  // Get loading state from the orders hook directly
  const { isLoading: ordersLoading } = useOrdersData();

  // Combined loading state - show skeleton if either context loading or SWR loading is true
  const isLoading = loading || ordersLoading;

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
        {isLoading && (!paginatedOrders || paginatedOrders.length === 0) ? (
          <OrdersTableSkeleton rows={10} />
        ) : (
          <OrdersTable
            orders={paginatedOrders}
            totalCount={filteredOrders.length}
            userRole={userRole}
            onView={handleViewOrder}
            onEdit={handleEditOrder}
            onDelete={handleDeleteOrder}
            onDuplicate={handleDuplicateOrder}
            onInvoice={handleGenerateInvoice}
            onStatusChange={handleOrderStatusChange}
            onLoadMore={handleLoadMore}
            loading={isLoading} // Use combined loading state
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
        )}
      </div>
    </div>
  );
};

export default OrdersTab;