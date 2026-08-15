import { FeedSkeleton } from '@/components/skeletons';

// Orders (B1): summary of two figures, three quick actions, search + filter
// chips, then the rows. Matched so the hard-load shell doesn't reflow into the
// feed.
export default function OrdersLoading() {
  return <FeedSkeleton figures={2} actions={3} chips={3} />;
}
