// Export all loading components from a single file
// This makes it easier to import loading components

// Export the loading provider and hooks
export { 
  LoadingProvider, 
  useLoading, 
  LoadingIndicator, 
  withLoading 
} from './LoadingProvider';

// The SimpleLoadingCoordinator / LoadingStateCoordinator full-page skeletons
// were removed in the loading overhaul: tenancy is gated server-side and each
// screen owns its own in-place loading state, so a global coordinator only
// added a second, mismatched full-page skeleton (the flicker). Route-level
// loading.tsx (FeedSkeleton) now covers navigation.

// Re-export all standardized loading components
export {
  LoadingSpinner,
  LoadingState,
  LoadingButton,
  TableSkeleton,
  CardSkeleton,
  FormSkeleton,
  MetricCardSkeleton,
  MetricCardsGrid,
  LoadingError,
  InlineLoading,
  PageSkeleton
} from '@/components/ui/loading';

// Export the example component
