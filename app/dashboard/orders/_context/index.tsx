'use client';

import type { ReactNode } from 'react';
import React from 'react';
// Legacy types are used ONLY to type the compat stubs for unmigrated
// tabs (Invoices/Tasks/Insights); both imports go when those migrate.
import type { Order as LegacyOrder, Task as LegacyTask } from '@/types/orders';
import { OrdersStoreProvider, useOrdersStore } from './OrdersStoreContext';
import { OrdersUIProvider, useOrdersUI } from './OrdersUIContext';
import { OrdersInvoiceSettingsProvider, useOrdersInvoiceSettings } from './OrdersInvoiceSettingsContext';

export { OrdersStoreProvider, useOrdersStore } from './OrdersStoreContext';
export type { OrderListFilters } from './OrdersStoreContext';
export { OrdersUIProvider, useOrdersUI } from './OrdersUIContext';
export { OrdersInvoiceSettingsProvider, useOrdersInvoiceSettings } from './OrdersInvoiceSettingsContext';

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

  return {
    // Data
    orders: store.orders,
    totalCount: store.totalCount,
    pageCount: store.pageCount,
    isLoading: store.isLoading,
    initialLoading: store.isLoading,
    loading: store.isLoading,

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
    currentPage: store.page,
    totalPages: store.pageCount,
    handlePageChange: store.setPage,
    paginatedOrders: store.orders,
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
    // handleGenerateInvoice lives in the stub block below (any-typed)
    // because the unmigrated InvoicesTab passes legacy Order objects.
    handleDeleteOrder: ui.handleDeleteOrder,
    handleOrderStatusChange: ui.handleOrderStatusChange,
    handleSaveOrder: ui.handleSaveOrder,
    userRole: 'admin' as const,

    // Invoice settings (module unmigrated; sheet disconnected)
    invoiceSettings: invoiceSettings.invoiceSettings,
    isLoadingInvoiceSettings: invoiceSettings.isLoadingInvoiceSettings,

    // ── Legacy-compat stubs ──────────────────────────────────────────
    // Consumed by the UNMIGRATED tabs (Invoices, Tasks, Insights) and
    // the legacy order-view components. They keep those modules
    // compiling until their own cutover; delete each stub when its
    // consumer migrates. Values are intentionally empty — those tabs
    // read legacy public-schema data shapes that no longer flow here.
    /* eslint-disable @typescript-eslint/no-explicit-any */
    isValidating: store.isLoading,
    stats: { totalOrders: 0, revenue: 0, activeClients: 0, pendingOrders: 0 },
    metrics: undefined as any,
    filteredOrders: [] as LegacyOrder[],
    filteredTasks: [] as LegacyTask[],
    handleGenerateInvoice: ui.handleGenerateInvoice as any,
    taskFilters: {} as any,
    handleTaskFilterChange: (() => {}) as any,
    handleCompleteTask: (() => {}) as any,
    handleInlineEdit: (async () => ({ success: false })) as any,
    handleDuplicateOrder: ((_order: any) => {}) as any,
    handleFilterChange: ((_f: any) => {}) as any,
    selectedStatus: [] as any[],
    selectedPaymentStatus: [] as any[],
    selectedClientType: [] as any[],
    dateRange: undefined as any,
    handleStatusFilterChange: (() => {}) as any,
    handlePaymentStatusFilterChange: (() => {}) as any,
    handleClientTypeFilterChange: (() => {}) as any,
    handleDateRangeChange: (() => {}) as any,
    activeModal: (ui.viewSheetOpen ? 'view' : ui.createSheetOpen ? 'create' : ui.invoiceSheetOpen ? 'invoice' : null) as string | null,
    paginationInfo: undefined as any,
    rawTotalCount: store.totalCount,
    /* eslint-enable @typescript-eslint/no-explicit-any */
  };
}
