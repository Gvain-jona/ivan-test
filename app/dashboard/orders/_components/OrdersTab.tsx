'use client';

import React from 'react';
import { Button } from '../../../components/ui/button';
import OrdersTable from '../../../components/orders/OrdersTable';
import FilterDrawer, { OrderFilters as FilterTypes } from '../../../components/orders/FilterDrawer';
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
    <div className="space-y-5">
      {/* Filter Drawer */}
      <FilterDrawer
        open={showFilters}
        onOpenChange={toggleFilters}
        onApplyFilters={(newFilters: FilterTypes) => {
          handleFilterChange(newFilters);
        }}
        onResetFilters={resetFilters}
        initialFilters={filters}
      />

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
        showFilters={showFilters}
      />
    </div>
  );
};

export default OrdersTab;