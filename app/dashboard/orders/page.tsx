'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import OrdersListScreen from '@/components/orders/list/OrdersListScreen';
import { useSheets } from '@/context/sheet-host';

/**
 * Orders — B1, with A2 as its empty state.
 *
 * The page is a thin shell: the list owns its own filters and data, and the
 * create/open destinations are routes now (B2 and B4), reached through the
 * sheet host so the intent stays in one place.
 */
function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openCreateOrder } = useSheets();

  // Deep-links kept working after both destinations became routes:
  //   ?order=<id> — the order hub
  //   ?new=1      — the new-order screen
  //
  // `?order=` redirects straight rather than going through openOrder(), which
  // would push the hub and then race this effect's own replace() back.
  useEffect(() => {
    if (!searchParams) return;
    const orderId = searchParams.get('order');
    if (orderId) {
      router.replace(`/dashboard/orders/${orderId}`);
    } else if (searchParams.get('new') === '1') {
      openCreateOrder();
    }
  }, [searchParams, openCreateOrder, router]);

  return <OrdersListScreen />;
}

export default function OrdersPage() {
  // useSearchParams needs a Suspense boundary to keep the route from opting
  // the whole page out of static optimization.
  return (
    <Suspense fallback={null}>
      <OrdersPageContent />
    </Suspense>
  );
}
