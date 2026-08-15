// The live v2 feed surface (orders, clients, products, documents) shares one
// content-shaped loading shell. The old per-page desktop skeletons
// (OrdersSkeleton, DashboardSkeleton) were retired with the loading overhaul —
// they drew a desktop table over a mobile feed and reflowed on every load.
export { FeedSkeleton } from './FeedSkeleton';
export { RecordSkeleton } from './RecordSkeleton';

// Legacy (dark) modules keep their own skeletons until their v2 cutovers.
export { ExpensesSkeleton } from './ExpensesSkeleton';
export { TodoSkeleton } from './TodoSkeleton';
export { MaterialPurchasesSkeleton } from './MaterialPurchasesSkeleton';
export { AnalyticsSkeleton } from './AnalyticsSkeleton';
