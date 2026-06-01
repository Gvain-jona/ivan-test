'use client';

import React from 'react';
import OrdersTable from '@/components/orders/OrdersTableNew';
import FilterDrawer, { OrderFilters as FilterTypes } from '../../../components/orders/FilterDrawer';
import { useOrdersPage } from '../_context';
import { useLoading } from '@/components/loading';
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
    currentPage,
    totalPages,
    totalCount,
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

  const { loadingIds } = useLoading();

  const isInitialLoading = (loading || loadingIds.has('orders')) && (!paginatedOrders || paginatedOrders.length === 0);

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
        {isInitialLoading ? (
          <OrdersTableSkeleton rows={10} />
        ) : (
          <OrdersTable
            orders={paginatedOrders || []}
            totalCount={totalCount || 0}
            userRole={userRole}
            onView={handleViewOrder}
            onEdit={handleViewOrder}
            onDelete={handleDeleteOrder}
            onDuplicate={handleDuplicateOrder}
            onInvoice={handleGenerateInvoice}
            onStatusChange={handleOrderStatusChange}
            onLoadMore={handleLoadMore}
            loading={loading}
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
        )}
      </div>
    </div>
  );
};

export default OrdersTab;
