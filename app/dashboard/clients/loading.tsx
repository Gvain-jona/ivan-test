import { FeedSkeleton } from '@/components/skeletons';

// Clients (C1): two figures (still to collect · client count), two quick
// actions, search + filter chips.
export default function ClientsLoading() {
  return <FeedSkeleton figures={2} actions={2} chips={3} />;
}
