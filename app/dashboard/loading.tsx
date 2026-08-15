import { FeedSkeleton } from '@/components/skeletons';

// The dashboard-wide fallback: the nearest loading boundary for any feed screen
// that doesn't declare its own (clients, products, documents all do, but this
// covers the rest of the live surface). A neutral feed shell, not a desktop
// table — the landing surfaces are all the max-w-lg feed.
export default function DashboardLoading() {
  return <FeedSkeleton />;
}
