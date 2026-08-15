import { FeedSkeleton } from '@/components/skeletons';

// Products (D1): no figures card (price lives per row), two quick actions,
// search + category chips.
export default function ProductsLoading() {
  return <FeedSkeleton figures={0} actions={2} chips={3} />;
}
