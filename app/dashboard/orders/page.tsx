'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Badge } from "../../components/ui/badge";
import { ScrollArea, ScrollBar } from "../../components/ui/scroll-area";
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

    // User role
    userRole,

    // Metrics
    stats
  } = useOrdersPage();

  return (
    <div className="space-y-6 min-h-screen p-6">
      {/* Page Header */}
      <OrdersPageHeader
        title="Orders Management"
        description="Manage customer orders, track status, and generate invoices."
      />

      {/* Metric Cards */}
      <OrderMetricsCards
        stats={stats}
        isLoading={initialLoading}
      />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <ScrollArea className="w-full">
          <TabsList className="bg-transparent border border-[#2B2B40] rounded-lg p-1 mb-3">
            <TabsTrigger
              value="orders"
              className="text-sm font-medium text-[#6D6D80] py-2 px-4 rounded-md data-[state=active]:bg-orange-500 data-[state=active]:text-white hover:bg-white/[0.02] group"
            >
              <Package
                className="-ms-0.5 me-1.5 opacity-60"
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
              Orders
              <Badge
                className="ms-1.5 min-w-5 bg-orange-500/15 px-1 transition-opacity group-data-[state=inactive]:opacity-50"
                variant="secondary"
              >
                {stats.pendingOrders}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="text-sm font-medium text-[#6D6D80] py-2 px-4 rounded-md data-[state=active]:bg-orange-500 data-[state=active]:text-white hover:bg-white/[0.02] group"
            >
              <CheckSquare
                className="-ms-0.5 me-1.5 opacity-60"
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
              Related Tasks
              <Badge
                className="ms-1.5 transition-opacity group-data-[state=inactive]:opacity-50"
              >
                New
              </Badge>
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="orders" className="space-y-6">
          <OrdersTab />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
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