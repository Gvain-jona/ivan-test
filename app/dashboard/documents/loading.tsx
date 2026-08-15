import { FeedSkeleton } from '@/components/skeletons';

// Documents (F1): two figures (unpaid · overdue), one quick action (New order),
// search + four type tabs.
export default function DocumentsLoading() {
  return <FeedSkeleton figures={2} actions={1} chips={4} />;
}
