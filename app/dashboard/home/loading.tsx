import { Skeleton } from '@/components/ui/skeleton';

/**
 * Home (H1) is the mobile-only feed and sits in a wider `max-w-2xl` column than
 * the list screens, so it gets its own shell rather than the shared
 * FeedSkeleton: a hero row, the two-figure snapshot card, the quick-action
 * chips, then a few feed rows — the same order the page paints them in.
 */
export default function HomeLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {/* Hero: greeting + org identity */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>

      {/* Snapshot: two figures over their sub-stats */}
      <div className="flex items-center rounded-2xl border border-border bg-card px-1 py-4">
        {[0, 1].map(i => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-[7px]">
        {[0, 1, 2].map(i => (
          <Skeleton key={i} className="h-9 w-28 rounded-full" />
        ))}
      </div>

      {/* Orders feed */}
      <div className="space-y-2">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-2xl border border-border bg-card"
          />
        ))}
      </div>
    </div>
  );
}
