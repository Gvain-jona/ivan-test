// Export all loading components from a single file
// This makes it easier to import loading components

// Export the loading provider and hooks
export { 
  LoadingProvider, 
  useLoading, 
  LoadingIndicator, 
  withLoading 
} from './LoadingProvider';

// Export the simplified loading coordinator
export { SimpleLoadingCoordinator } from './SimpleLoadingCoordinator';

// Export the deprecated loading coordinator (marked as deprecated)
export { LoadingStateCoordinator } from './LoadingStateCoordinator';

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
export { LoadingExample } from '../examples/LoadingExample';
