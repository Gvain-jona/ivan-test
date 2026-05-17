'use client';

import React, { ReactNode } from 'react';
import { OrderStatus } from '@/types/orders';
import { OrdersStoreProvider, useOrdersStore } from './OrdersStoreContext';
import { OrdersUIProvider, useOrdersUI } from './OrdersUIContext';
import { OrdersInvoiceSettingsProvider, useOrdersInvoiceSettings } from './OrdersInvoiceSettingsContext';

export { OrdersStoreProvider, useOrdersStore } from './OrdersStoreContext';
export { OrdersUIProvider, useOrdersUI } from './OrdersUIContext';
export { OrdersInvoiceSettingsProvider, useOrdersInvoiceSettings } from './OrdersInvoiceSettingsContext';

// Legacy compat: useOrdersData is now useOrdersStore
export { useOrdersStore as useOrdersData } from './OrdersStoreContext';

export const OrdersPageProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
  <OrdersStoreProvider>
    <OrdersInvoiceSettingsProvider>
      <OrdersUIProvider>
        {children}
      </OrdersUIProvider>
    </OrdersInvoiceSettingsProvider>
  </OrdersStoreProvider>
);

export function useOrdersPage() {
  const store = useOrdersStore();
  const ui = useOrdersUI();
  const invoiceSettings = useOrdersInvoiceSettings();

  const stats = {
    totalOrders: store.metrics?.totalOrders ?? 0,
    revenue: store.metrics?.totalRevenue ?? 0,
    activeClients: store.metrics?.activeClients ?? 0,
    pendingOrders: store.metrics?.pendingOrders ?? 0,
  };

  return {
    // Data
    orders: store.orders,
    totalCount: store.totalCount,
    pageCount: store.pageCount,
    isLoading: store.isLoading,
    isValidating: store.isValidating,
    initialLoading: store.isLoading,
    loading: store.isLoading,
    stats,
    metrics: store.metrics,

    // Filter & pagination
    filters: store.filters,
    page: store.page,
    pageSize: store.pageSize,
    showFilters: store.showFilters,
    searchTerm: store.filters.search ?? '',
    filterByStatus: store.filterByStatus,
    toggleFilters: store.toggleFilters,
    setFilters: store.setFilters,
    setPage: store.setPage,
    handleSearch: (term: string) => store.setFilters({ ...store.filters, search: term || undefined }),
    resetFilters: () => store.setFilters({}),
    handleFilterChange: (newFilters: any) => {
      store.setFilters({
        status: newFilters.status ? [newFilters.status] : undefined,
        paymentStatus: newFilters.paymentStatus ? [newFilters.paymentStatus] : undefined,
        startDate: newFilters.startDate,
        endDate: newFilters.endDate,
        search: newFilters.search,
      });
    },
    currentPage: store.page,
    totalPages: store.pageCount,
    handlePageChange: store.setPage,
    paginatedOrders: store.orders,
    filteredOrders: store.orders,
    handleLoadMore: store.refresh,
    refreshOrders: store.refresh,
    updateOrderStatus: store.updateOrderStatus,

    // UI
    activeTab: ui.activeTab,
    setActiveTab: ui.setActiveTab,
    selectedOrder: ui.selectedOrder,
    viewModalOpen: ui.viewSheetOpen,
    createModalOpen: ui.createSheetOpen,
    invoiceModalOpen: ui.invoiceSheetOpen,
    setViewModalOpen: ui.setViewSheetOpen,
    setCreateModalOpen: ui.setCreateSheetOpen,
    setInvoiceModalOpen: ui.setInvoiceSheetOpen,
    handleViewOrder: ui.handleViewOrder,
    handleCreateOrder: ui.handleCreateOrder,
    handleGenerateInvoice: ui.handleGenerateInvoice,
    handleDeleteOrder: (orderId: string) => ui.handleDeleteOrder(orderId),
    handleDuplicateOrder: (_order: any) => {},
    handleOrderStatusChange: (orderId: string, status: string) =>
      ui.handleOrderStatusChange(orderId, status as OrderStatus),
    handleSaveOrder: ui.handleSaveOrder,
    handleInlineEdit: ui.handleInlineEdit,
    activeModal: ui.viewSheetOpen ? 'view' : ui.createSheetOpen ? 'create' : ui.invoiceSheetOpen ? 'invoice' : null,
    userRole: 'admin' as const,

    // Invoice settings
    invoiceSettings: invoiceSettings.invoiceSettings,
    isLoadingInvoiceSettings: invoiceSettings.isLoadingInvoiceSettings,

    // Tasks (moved to TasksTab, stubs for compat)
    filteredTasks: [],
    taskFilters: {},
    handleTaskFilterChange: () => {},
    handleCompleteTask: () => {},

    // Unused legacy fields
    selectedStatus: [] as any[],
    selectedPaymentStatus: [] as any[],
    selectedClientType: [] as any[],
    dateRange: undefined,
    handleStatusFilterChange: () => {},
    handlePaymentStatusFilterChange: () => {},
    handleClientTypeFilterChange: () => {},
    handleDateRangeChange: () => {},
    paginationInfo: undefined,
    rawTotalCount: store.totalCount,
  };
}
