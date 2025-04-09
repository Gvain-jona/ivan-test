'use client';

import React from 'react';
import { Button } from '../../../components/ui/button';
import OrdersTable from '../../../components/orders/OrdersTable';
import OrderFilters from '../../../components/orders/OrderFilters';
import { useOrdersPage } from '../_context/OrdersPageContext';

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

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <div className="bg-[#1E1E2D] border border-[#2B2B40] rounded-xl p-4 shadow-lg">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-sm font-medium text-white">Filter Orders</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8 text-[#6D6D80] hover:text-white hover:bg-[#1E1E2D]/80"
            >
              Reset Filters
            </Button>
          </div>
          <OrderFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
            onReset={resetFilters}
          />
        </div>
      )}

      {/* Orders Table */}
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
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onFilter={toggleFilters}
        onExport={() => console.log('Export')}
        onCreateOrder={handleCreateOrder}
        searchTerm={searchTerm}
      />
    </div>
  );
};

export default OrdersTab;