'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrders } from '@/hooks/orders/useOrders';
import { useOrderStatuses } from '@/hooks/orders/useOrderStatuses';
import { homeMetrics } from '@/lib/orders/home-metrics';
import HomeHero from '@/components/home/HomeHero';
import HomeQuickActions from '@/components/home/HomeQuickActions';
import HomeSnapshot from '@/components/home/HomeSnapshot';
import RecentOrdersList from '@/components/home/RecentOrdersList';
import QuotationsSection from '@/components/home/QuotationsSection';
import ToDoSection from '@/components/home/ToDoSection';
import ContinueSetupBanner from '@/components/onboarding/ContinueSetupBanner';

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
 * Mobile-only Home — the H1 feed: org header + greeting, a two-figure snapshot
 * (sales this month · still to collect) over its sub-stats, the quick-create
 * chips, the orders feed, active quotations, and a to-do section. Desktop
 * viewers are redirected to Orders (Home is mobile-only, see DESIGN_PHILOSOPHY).
 *
 * Data: bounded v2 fetches — the current month's orders (summed for "sales this
 * month"; count from the accurate `total`) and a bounded order book that feeds
 * everything else. `homeMetrics` derives "still to collect", the in-process
 * count, and the active-quotations split from that book (quotations are pulled
 * out so the orders feed and the quotations section don't double-count). No
 * global aggregate endpoint exists yet, so the sums are over bounded fetches —
 * TODO(v2 read layer) when analytics cuts over. The to-do section is scaffolded
 * (no v2 task layer yet); see ToDoSection.
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

  const { statuses } = useOrderStatuses();

  // The order book that feeds the snapshot's "to collect"/in-process figures,
  // the orders feed, and the active-quotations split. Bounded, like the rest.
  const { orders: book, isLoading: bookLoading } = useOrders({ limit: 100 });

  // TODO(v2 read layer): "sales this month" is a bounded client-side sum —
  // accurate count (`total`), approximate sum (capped at `limit`). The list API
  // caps `limit` at 100 (listQuerySchema), so that is the ceiling here; a true
  // month total needs the analytics/metrics accessor when that module cuts
  // over. See STATE.md.
  const {
    orders: month,
    total: monthCount,
    isLoading: monthLoading,
  } = useOrders({ start_date: monthStart(), end_date: today(), limit: 100 });

  const salesThisMonth = useMemo(
    () => month.reduce((sum, o) => sum + (o.total_amount ?? 0), 0),
    [month],
  );

  const metrics = useMemo(() => homeMetrics(book, statuses), [book, statuses]);

  // The orders feed excludes quotations — they get their own section, and
  // showing them in both would double-count the same records.
  const feedOrders = useMemo(() => {
    const quotationIds = new Set(metrics.quotations.map(q => q.id));
    return book.filter(o => !quotationIds.has(o.id));
  }, [book, metrics.quotations]);

  // Nothing paints until we've confirmed we're on a mobile viewport, so a
  // desktop viewer being redirected never flashes the feed.
  if (!allowed) return null;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <HomeHero />
      <ContinueSetupBanner />
      <HomeSnapshot
        salesThisMonth={salesThisMonth}
        orderCount={monthCount}
        toCollect={metrics.toCollect}
        inProcessCount={metrics.inProcessCount}
        isLoading={bookLoading || monthLoading}
      />
      <HomeQuickActions />
      <RecentOrdersList orders={feedOrders} isLoading={bookLoading} />
      <QuotationsSection quotations={metrics.quotations} />
      <ToDoSection />
    </div>
  );
}
