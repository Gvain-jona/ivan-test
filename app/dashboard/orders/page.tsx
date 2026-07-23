'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSheets } from '@/context/sheet-host';

// Import refactored components
import OrdersPageHeader from './_components/OrdersPageHeader';
import OrdersTab from './_components/OrdersTab';

// Import context provider
import { OrdersPageProvider, useOrdersUI } from './_context';

/**
 * Inner component that uses the context. The create/view sheets are owned by
 * the app-wide sheet host (see DESIGN_PHILOSOPHY.md → "Overlays & sheets"),
 * so this page renders none itself — it just opens them by intent.
 */
const OrdersPageContent: React.FC = () => {
  const { handleCreateOrder } = useOrdersUI();
  const { openOrder, openCreateOrder } = useSheets();

  const router = useRouter();
  const searchParams = useSearchParams();

  // Deep-links (shared/bookmarked URLs) open a sheet via the host, then strip
  // the param so a refresh doesn't reopen it:
  //   ?order=<id> — open that order's view sheet
  //   ?new=1      — open the create sheet
  useEffect(() => {
    if (!searchParams) return;
    const orderId = searchParams.get('order');
    if (orderId) {
      openOrder(orderId);
      router.replace('/dashboard/orders');
    } else if (searchParams.get('new') === '1') {
      openCreateOrder();
      router.replace('/dashboard/orders');
    }
  }, [searchParams, openOrder, openCreateOrder, router]);

  // Horizontal padding comes from the layout's <main> (p-4 lg:p-6); don't
  // double it here — mobile only has room for one gutter.
  return (
    <div className="space-y-5 min-h-screen py-4 lg:px-2">
      {/* Page Header */}
      <OrdersPageHeader
        title="Orders Management"
        description="Manage customer orders and track status."
        onCreateOrder={handleCreateOrder}
      />

      {/* TODO(v2 read layer): order metrics cards return here once the
          analytics read accessors exist in the v2 schema. */}

      <OrdersTab />
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
