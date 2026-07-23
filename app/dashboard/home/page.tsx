'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrders } from '@/hooks/orders/useOrders';
import HomeHero from '@/components/home/HomeHero';
import HomeCategoryChips from '@/components/home/HomeCategoryChips';
import HomeSnapshot from '@/components/home/HomeSnapshot';
import RecentOrdersList from '@/components/home/RecentOrdersList';

/**
 * Mobile-only Home — the reference implementation of the redesigned
 * visual language (greeting hero, quick-add, category chips, momentum
 * snapshot, card-first recent orders) and the prime structure the rest of
 * the mobile experience inherits from. Rendered as a centered feed column
 * that reads as a phone screen; desktop viewers are redirected to Orders
 * (see DESIGN_PHILOSOPHY.md — Home is mobile-only, desktop lands on Orders).
 *
 * Data: two bounded v2 fetches — the 5 most recent orders for the feed,
 * and the open (unpaid/partial) orders for the outstanding-balance and
 * collection-rate snapshot. No global aggregate endpoint exists yet, so
 * the snapshot is scoped to the open-orders set by design.
 */
export default function HomePage() {
  const router = useRouter();

  // Home is a mobile-only surface (see DESIGN_PHILOSOPHY.md). A desktop
  // viewer who lands here directly is bounced to Orders before the feed
  // paints, so the centered mobile feed never shows on a wide screen.
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      router.replace('/dashboard/orders');
    } else {
      setAllowed(true);
    }
  }, [router]);

  const { orders: recent, isLoading: recentLoading } = useOrders({ limit: 5 });
  const { orders: open, isLoading: openLoading } = useOrders({
    payment_status: 'unpaid,partial',
    limit: 100,
  });

  const snapshot = useMemo(() => {
    const outstanding = open.reduce((sum, o) => sum + (o.balance ?? 0), 0);
    const billed = open.reduce((sum, o) => sum + o.total_amount, 0);
    const collected = open.reduce((sum, o) => sum + o.amount_paid, 0);
    const collectionRate = billed > 0 ? Math.round((collected / billed) * 100) : 0;
    return { outstanding, openCount: open.length, collectionRate };
  }, [open]);

  // Nothing paints until we've confirmed we're on a mobile viewport, so a
  // desktop viewer being redirected never flashes the feed.
  if (!allowed) return null;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <HomeHero />
      <HomeCategoryChips />
      <HomeSnapshot
        outstanding={snapshot.outstanding}
        openCount={snapshot.openCount}
        collectionRate={snapshot.collectionRate}
        isLoading={openLoading}
      />
      <RecentOrdersList orders={recent} isLoading={recentLoading} />
    </div>
  );
}
