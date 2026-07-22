'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Import refactored components
import OrderViewSheet from '../../components/orders/OrderViewSheet';
import OrderFormSheet from '../../components/orders/OrderFormSheet';
import OrdersPageHeader from './_components/OrdersPageHeader';
import OrdersTab from './_components/OrdersTab';

// Import context provider
import { OrdersPageProvider, useOrdersUI } from './_context';

/**
 * Inner component that uses the context
 */
const OrdersPageContent: React.FC = () => {
  const {
    handleCreateOrder,
    selectedOrder,
    viewSheetOpen,
    setViewSheetOpen,
    createSheetOpen,
    setCreateSheetOpen,
    handleSaveOrder,
  } = useOrdersUI();

  const router = useRouter();
  const searchParams = useSearchParams();

  // Deep-link: `?new=1` (e.g. from the Home quick-add) opens the create
  // sheet, then strips the param so a refresh doesn't reopen it.
  useEffect(() => {
    if (searchParams?.get('new') === '1') {
      setCreateSheetOpen(true);
      router.replace('/dashboard/orders');
    }
  }, [searchParams, setCreateSheetOpen, router]);

  return (
    <div className="space-y-5 min-h-screen px-6 py-4">
      {/* Page Header */}
      <OrdersPageHeader
        title="Orders Management"
        description="Manage customer orders and track status."
        onCreateOrder={handleCreateOrder}
      />

      {/* TODO(v2 read layer): order metrics cards return here once the
          analytics read accessors exist in the v2 schema. */}

      <OrdersTab />

      {/* Order View Sheet — v2 data path (fetches detail itself) */}
      {selectedOrder && (
        <OrderViewSheet
          open={viewSheetOpen}
          onOpenChange={setViewSheetOpen}
          order={selectedOrder}
          onClose={() => setViewSheetOpen(false)}
          userRole="admin"
        />
      )}

      {/* Order Create Sheet — v2 form (atomic create_order) */}
      <OrderFormSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        onSave={handleSaveOrder}
        title="Create New Order"
      />

      {/* Documents (quotations/invoices/receipts) are viewable and
          creatable as drafts from the order view sheet's Documents tab
          (see app/components/orders/order-view/OrderDocumentsTab.tsx).
          The legacy Invoices tab and the per-row "quick invoice" button
          were removed in cleanup Phase 2 (docs/v2-migration/
          ORDERS_CLEANUP.md) — an "issue document" action returns once
          v2.issue_document() exists. */}
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
