'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrders } from '@/hooks/orders/useOrders';
import HomeHero from '@/components/home/HomeHero';
import HomeQuickActions from '@/components/home/HomeQuickActions';
import HomeSnapshot from '@/components/home/HomeSnapshot';
import RecentOrdersList from '@/components/home/RecentOrdersList';

/** First day of the current month, as a YYYY-MM-DD string. */
function monthStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

/** Today, as a YYYY-MM-DD string (inclusive end of the month-to-date range). */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Mobile-only Home — the reference implementation of the redesigned visual
 * language (greeting hero, quick-add, quick-action chips, sales snapshot,
 * card-first recent orders) and the prime structure the rest of the mobile
 * experience inherits from. Rendered as a centered feed column that reads as
 * a phone screen; desktop viewers are redirected to Orders (see
 * DESIGN_PHILOSOPHY.md — Home is mobile-only, desktop lands on Orders).
 *
 * Data: two bounded v2 fetches — the current month's orders (summed for the
 * "sales this month" snapshot; count comes from the accurate `total`), and a
 * small recent set that RecentOrdersList groups by workflow state. No global
 * aggregate endpoint exists yet, so the month sum is over a bounded fetch.
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

  // A slightly larger recent set so the workflow segments have something to
  // group; the list stays short per segment.
  const { orders: recent, isLoading: recentLoading } = useOrders({ limit: 10 });

  // TODO(v2 read layer): "sales this month" is scaffolded on a bounded
  // client-side sum — accurate count (`total`), approximate sum (capped at
  // `limit`). Wire to the analytics/metrics aggregate accessor when that
  // module cuts over; don't build a bespoke endpoint first. See
  // docs/v2-migration/STATE.md → Module status → Home dashboard.
  const {
    orders: month,
    total: monthCount,
    isLoading: monthLoading,
  } = useOrders({ start_date: monthStart(), end_date: today(), limit: 200 });

  const salesThisMonth = useMemo(
    () => month.reduce((sum, o) => sum + (o.total_amount ?? 0), 0),
    [month],
  );

  // Nothing paints until we've confirmed we're on a mobile viewport, so a
  // desktop viewer being redirected never flashes the feed.
  if (!allowed) return null;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <HomeHero />
      <HomeQuickActions />
      <HomeSnapshot
        salesThisMonth={salesThisMonth}
        orderCount={monthCount}
        isLoading={monthLoading}
      />
      <RecentOrdersList orders={recent} isLoading={recentLoading} />
    </div>
  );
}
