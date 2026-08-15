'use client';

import MobileFeedHeader from '@/components/navigation/MobileFeedHeader';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * The loading shell for the mobile-feed screens (orders, clients, products,
 * documents — the live v2 surface).
 *
 * It renders the *real* static chrome — the feed header and the same
 * `max-w-lg` column, figures card, action chips, search bar and list-row
 * geometry the loaded screen uses — so that when data arrives the only thing
 * that changes is the content *inside* those boxes, never their size or
 * position. That is the whole point: the old per-page skeletons drew a desktop
 * table over a mobile feed, so every load ended in a visible reflow. This one
 * has none.
 *
 * The screens themselves already render this same chrome instantly and skeleton
 * only their list region; this component is the route-level (`loading.tsx`)
 * counterpart shown during the server-side tenant resolve on a hard load, cut
 * to the same measurements so the two are indistinguishable.
 */
export function FeedSkeleton({
  figures = 2,
  actions = 3,
  showSearch = true,
  chips = 3,
  rows = 5,
}: {
  /** Figures in the summary card (Total sales · Orders this month → 2). */
  figures?: number;
  /** Quick-action chips (New order · New client · New quote → 3). */
  actions?: number;
  /** Whether the screen carries a search field. */
  showSearch?: boolean;
  /** Filter chips under the search (All · Unpaid · Due soon → 3). */
  chips?: number;
  /** Placeholder list rows. */
  rows?: number;
}) {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-5">
      <MobileFeedHeader />

      {/* Title (h1) */}
      <Skeleton className="h-7 w-32" />

      {/* Figures summary card — same container as the real one. Omitted when
          the screen has none (Products carries its price per row instead). */}
      {figures > 0 && (
        <div className="mt-3.5 flex items-center rounded-2xl border border-border bg-card px-1 py-3.5">
          {Array.from({ length: figures }).map((_, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      )}

      {/* Quick-action chips */}
      <div className="mt-4 flex flex-wrap gap-[7px]">
        {Array.from({ length: actions }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-full" />
        ))}
      </div>

      {/* Search */}
      {showSearch && <Skeleton className="mt-4 h-10 w-full rounded-[10px]" />}

      {/* Filter chips */}
      {chips > 0 && (
        <div className="mt-3 flex gap-[7px]">
          {Array.from({ length: chips }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-16 rounded-full" />
          ))}
        </div>
      )}

      {/* List rows — identical geometry to the screens' own inline skeleton */}
      <div className="mt-3.5 space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-2xl border border-border bg-card"
          />
        ))}
      </div>
    </div>
  );
}
