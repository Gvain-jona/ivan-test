'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Badge } from "../../components/ui/badge";
import { Package, DollarSign } from "lucide-react";
import OrderViewSheet from '../../components/orders/OrderViewSheet';
import OrderFormSheet from '../../components/orders/OrderFormSheet';
import { InvoiceSheet } from '@/app/features/invoices';

// Import refactored components
import OrdersPageHeader from './_components/OrdersPageHeader';
import OrderMetricsCards from './_components/OrderMetricsCards';
import OrdersTab from './_components/OrdersTab';
import InvoicesTab from './_components/InvoicesTab';


// Import context provider
import { OrdersPageProvider, useOrdersPage } from './_context';

/**
 * Inner component that uses the context
 */
const OrdersPageContent: React.FC = () => {
  const {
    // State
    initialLoading,
    activeTab,
    setActiveTab,

    // Modals
    selectedOrder,
    viewModalOpen,
    createModalOpen,
    invoiceModalOpen,
    setViewModalOpen,
    setCreateModalOpen,
    setInvoiceModalOpen,
    handleGenerateInvoice,
    handleSaveOrder,
    handleCreateOrder,
    handleInlineEdit,
    activeModal,

    // User role
    userRole,

    // Metrics
    stats,

    // Filtering
    filterByStatus,
    filters,

    // Invoice Settings
    invoiceSettings,
    isLoadingInvoiceSettings
  } = useOrdersPage();

  return (
    <div className="space-y-5 min-h-screen px-6 py-4">
      {/* Page Header */}
      <OrdersPageHeader
        title="Orders Management"
        description="Manage customer orders, track status, and generate invoices."
        onCreateOrder={handleCreateOrder}
      />

      {/* Metric Cards - Pass filters to ensure accurate metrics */}
      <OrderMetricsCards
        stats={stats}
        isLoading={initialLoading}
        onFilterByStatus={filterByStatus}
        filters={filters}
      />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-5"
      >
        <div className="mb-5">
          <TabsList className="bg-transparent border border-border/40 rounded-lg p-1">
            <TabsTrigger
              value="orders"
              className="text-sm font-medium text-muted-foreground py-2 px-4 rounded-md data-[state=active]:bg-orange-500 data-[state=active]:text-white hover:bg-muted/10"
            >
              <Package className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
              Orders
              <Badge
                className="ms-1.5 min-w-5 bg-muted/30 px-1.5 py-0.5 text-xs font-medium text-muted-foreground rounded-full transition-opacity group-data-[state=inactive]:opacity-50"
                variant="secondary"
              >
                {stats.pendingOrders}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="invoices"
              className="text-sm font-medium text-muted-foreground py-2 px-4 rounded-md data-[state=active]:bg-orange-500 data-[state=active]:text-white hover:bg-muted/10"
            >
              <DollarSign className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
              Invoices
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="orders" className="space-y-5 animate-in fade-in-50 duration-300">
          <OrdersTab />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-5 animate-in fade-in-50 duration-300">
          <InvoicesTab />
        </TabsContent>
      </Tabs>

      {/* Order View Sheet */}
      {selectedOrder && (
        <OrderViewSheet
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
          order={selectedOrder}
          onClose={() => setViewModalOpen(false)}
          onEdit={handleInlineEdit}
          onGenerateInvoice={handleGenerateInvoice}
          userRole={userRole}
        />
      )}

      {/* Edit functionality has been consolidated to use only inline editing in the OrderViewSheet */}

      {/* Order Create Sheet */}
      <OrderFormSheet
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSave={handleSaveOrder}
        title="Create New Order"
      />

      {/* Invoice Sheet - Pass pre-loaded settings */}
      {selectedOrder && (
        <InvoiceSheet
          open={invoiceModalOpen}
          onOpenChange={setInvoiceModalOpen}
          order={selectedOrder}
          onClose={() => setInvoiceModalOpen(false)}
          initialSettings={invoiceSettings}
        />
      )}
    </div>
  );
};

/**
 * Main page component wrapped with context provider
 */
export default function OrdersPage() {
  return (
    <OrdersPageProvider>
      <OrdersPageContent />
    </OrdersPageProvider>
  );
}