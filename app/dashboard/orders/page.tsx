'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Badge } from "../../components/ui/badge";
import { Package, CheckSquare } from "lucide-react";
import OrderViewSheet from '../../components/orders/OrderViewSheet';
import OrderFormSheet from '../../components/orders/OrderFormSheet';
import InvoiceSheet from '../../components/orders/InvoiceSheet';

// Import refactored components
import OrdersPageHeader from './_components/OrdersPageHeader';
import OrderMetricsCards from './_components/OrderMetricsCards';
import OrdersTab from './_components/OrdersTab';
import TasksTab from './_components/TasksTab';

// Import context provider
import { OrdersPageProvider, useOrdersPage } from './_context/OrdersPageContext';

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
    editModalOpen,
    createModalOpen,
    invoiceModalOpen,
    setViewModalOpen,
    setEditModalOpen,
    setCreateModalOpen,
    setInvoiceModalOpen,
    handleEditOrder,
    handleGenerateInvoice,
    handleSaveOrder,
    handleCreateOrder,

    // User role
    userRole,

    // Metrics
    stats,

    // Filtering
    filterByStatus
  } = useOrdersPage();

  return (
    <div className="space-y-5 min-h-screen px-6 py-4">
      {/* Page Header */}
      <OrdersPageHeader
        title="Orders Management"
        description="Manage customer orders, track status, and generate invoices."
        onCreateOrder={handleCreateOrder}
      />

      {/* Metric Cards */}
      <OrderMetricsCards
        stats={stats}
        isLoading={initialLoading}
        onFilterByStatus={filterByStatus}
      />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-5"
      >
        <div className="mb-5">
          <TabsList className="bg-background/80 border border-border/60 rounded-lg p-2 w-full inline-flex gap-1.5 shadow-sm">
            <TabsTrigger
              value="orders"
              className="text-sm font-medium text-muted-foreground py-2.5 px-5 rounded-md data-[state=active]:bg-foreground data-[state=active]:text-background hover:bg-muted/20 group transition-all duration-200"
            >
              <Package
                className="-ms-0.5 me-1.5 opacity-60"
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
              Orders
              <Badge
                className="ms-1.5 min-w-5 bg-muted/30 px-1.5 py-0.5 text-xs font-medium text-muted-foreground rounded-full transition-opacity group-data-[state=inactive]:opacity-50"
                variant="secondary"
              >
                {stats.pendingOrders}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="text-sm font-medium text-muted-foreground py-2.5 px-5 rounded-md data-[state=active]:bg-foreground data-[state=active]:text-background hover:bg-muted/20 group transition-all duration-200"
            >
              <CheckSquare
                className="-ms-0.5 me-1.5 opacity-60"
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
              Tasks
              <Badge
                className="ms-1.5 min-w-5 bg-muted/30 px-1.5 py-0.5 text-xs font-medium text-muted-foreground rounded-full transition-opacity group-data-[state=inactive]:opacity-50"
              >
                New
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="orders" className="space-y-5 animate-in fade-in-50 duration-300">
          <OrdersTab />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-5 animate-in fade-in-50 duration-300">
          <TasksTab />
        </TabsContent>
      </Tabs>

      {/* Order View Sheet */}
      {selectedOrder && (
        <OrderViewSheet
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
          order={selectedOrder}
          onClose={() => setViewModalOpen(false)}
          onEdit={handleEditOrder}
          onGenerateInvoice={handleGenerateInvoice}
          userRole={userRole}
        />
      )}

      {/* Order Edit Sheet */}
      <OrderFormSheet
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSave={handleSaveOrder}
        initialOrder={selectedOrder || undefined}
        title="Edit Order"
        isEditing={true}
      />

      {/* Order Create Sheet */}
      <OrderFormSheet
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSave={handleSaveOrder}
        title="Create New Order"
        isEditing={false}
      />

      {/* Invoice Sheet */}
      {selectedOrder && (
        <InvoiceSheet
          open={invoiceModalOpen}
          onOpenChange={setInvoiceModalOpen}
          order={selectedOrder}
          onClose={() => setInvoiceModalOpen(false)}
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