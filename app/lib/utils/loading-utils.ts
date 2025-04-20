/**
 * Utility functions for handling loading states
 */

/**
 * Determines if a component should show a loading state
 * @param isLoading Whether the data is currently loading
 * @param isValidating Whether the data is being revalidated
 * @param data The data that has been loaded
 * @param hasAttemptedLoad Whether we've attempted to load data
 * @returns Whether to show a loading state
 */
export function shouldShowLoading(
  isLoading: boolean,
  isValidating: boolean,
  data: any,
  hasAttemptedLoad: boolean = false
): boolean {
  // If we have data, don't show loading state (even if validating)
  if (data && (Array.isArray(data) ? data.length > 0 : true)) {
    return false;
  }
  
  // If we've attempted to load data and it's empty, don't show loading state
  if (hasAttemptedLoad && !isLoading) {
    return false;
  }
  
  // Show loading state if we're loading for the first time
  return isLoading;
}

/**
 * Determines if a component should show an empty state
 * @param isLoading Whether the data is currently loading
 * @param data The data that has been loaded
 * @param hasAttemptedLoad Whether we've attempted to load data
 * @returns Whether to show an empty state
 */
export function shouldShowEmptyState(
  isLoading: boolean,
  data: any,
  hasAttemptedLoad: boolean = false
): boolean {
  // If we're loading and haven't attempted to load data, don't show empty state
  if (isLoading && !hasAttemptedLoad) {
    return false;
  }
  
  // If we have data, don't show empty state
  if (data && (Array.isArray(data) ? data.length > 0 : true)) {
    return false;
  }
  
  // Show empty state if we've attempted to load data and it's empty
  return hasAttemptedLoad || !isLoading;
}

/**
 * Determines if a component should show a refreshing indicator
 * @param isValidating Whether the data is being revalidated
 * @param data The data that has been loaded
 * @returns Whether to show a refreshing indicator
 */
export function shouldShowRefreshing(
  isValidating: boolean,
  data: any
): boolean {
  // Show refreshing indicator if we're validating and have data
  return isValidating && data && (Array.isArray(data) ? data.length > 0 : true);
}
