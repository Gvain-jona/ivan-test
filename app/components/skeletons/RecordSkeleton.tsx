'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * The loading shell for a single-record detail screen (order hub, client and
 * product detail — B4/C2/D2).
 *
 * It replaces the old one flat `h-64` block with the record's actual shape: a
 * back-arrow + title row, a two-figure summary card, then a couple of section
 * blocks — the same `max-w-lg` column the loaded screen uses. So the load reads
 * as content filling in, not a block becoming a page (LOAD-04). Pair it with
 * `useDeferredLoading` so it never flashes on a warm cache (LOAD-05).
 */
export function RecordSkeleton() {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-5">
      {/* Back + title row */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3.5 w-24" />
        </div>
      </div>

      {/* Two-figure summary card (ghost-card container) */}
      <div className="mt-5 rounded-2xl border border-border bg-card p-4">
        <div className="flex gap-4">
          {[0, 1].map(i => (
            <div key={i} className="flex-1 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Section blocks */}
      <div className="mt-5 space-y-2">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-2xl border border-border bg-card"
          />
        ))}
      </div>
    </div>
  );
}
