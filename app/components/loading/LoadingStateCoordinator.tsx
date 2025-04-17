'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/auth-context';
import { PageSkeleton, LoadingError } from '@/components/ui/loading';

interface LoadingStateCoordinatorProps {
  children: React.ReactNode;
}

/**
 * @deprecated Use SimpleLoadingCoordinator instead
 * LoadingStateCoordinator manages the loading states across the application
 * It coordinates between authentication and data loading to provide a smooth experience
 */
export function LoadingStateCoordinator({ children }: LoadingStateCoordinatorProps) {
  const { user, profile, isLoading: authLoading, profileError, refreshProfile } = useAuth();
  const { isInitialized, cache, prefetchAll } = useGlobalDropdownCache();

  const [showSkeleton, setShowSkeleton] = useState(true);
  const [dataLoadingError, setDataLoadingError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Track when loading started
  const [loadingStartTime] = useState(Date.now());

  // Track loading stages
  const isAuthReady = !!user;
  const isProfileReady = !!profile;

  // Check if any data is still loading
  const isDataLoading = !isInitialized ||
    cache.clients.isLoading ||
    cache.categories.isLoading ||
    cache.sizes.isLoading ||
    cache.suppliers.isLoading;

  // Check if we have attempted to load data (even if it returned empty)
  const hasAttemptedDataLoad =
    (isInitialized && cache.clients.timestamp > 0) ||
    (isInitialized && cache.categories.timestamp > 0);

  // Check if essential data is loaded
  const hasEssentialData =
    cache.clients.data.length > 0 ||
    cache.categories.data.length > 0;

  // Check if data loading has completed (either successfully or with empty results)
  const isDataLoadComplete = isInitialized &&
    !cache.clients.isLoading &&
    !cache.categories.isLoading &&
    hasAttemptedDataLoad;

  // Calculate loading duration
  const loadingDuration = Date.now() - loadingStartTime;

  // Handle refresh of all data
  const handleRefresh = async () => {
    setIsRefreshing(true);

    // Refresh profile if needed
    if (profileError && refreshProfile) {
      await refreshProfile();
    }

    // Refresh all dropdown data
    prefetchAll();

    // Show skeleton for at least 1.5 seconds to avoid flicker
    setTimeout(() => {
      setIsRefreshing(false);
      setDataLoadingError(false);
    }, 1500);
  };

  // Detect data loading errors and clear them when data loads successfully
  useEffect(() => {
    const hasDataError =
      cache.clients.error ||
      cache.categories.error ||
      cache.sizes.error ||
      cache.suppliers.error;

    if (hasDataError) {
      setDataLoadingError(true);
    } else if (isDataLoadComplete) {
      // Clear error state when data has loaded successfully
      setDataLoadingError(false);
    }
  }, [cache, isDataLoadComplete]);

  // Force exit loading state after maximum time - improved to prevent getting stuck
  useEffect(() => {
    // Set a maximum loading time of 8 seconds (increased from 5s)
    const maxLoadingTime = 8000; // 8 seconds - increased to allow more time for data to load

    // Set a fallback timeout for extreme cases - 15 seconds
    const fallbackTimeout = 15000; // 15 seconds

    // Primary timeout - try to exit loading state if we have essential data
    const timeoutId = setTimeout(() => {
      console.log('Loading timeout reached, checking data availability...');
      setLoadingTimeout(true);

      // Clear any error states after timeout to prevent persistent error messages
      if (dataLoadingError) {
        setDataLoadingError(false);
      }

      // If we have essential data, exit loading state
      if (hasEssentialData) {
        console.log('Essential data available, exiting loading state');
        setShowSkeleton(false);
      } else {
        console.log('No essential data yet, waiting for fallback timeout...');
      }
    }, maxLoadingTime);

    // Fallback timeout - force exit loading state regardless of data
    const fallbackTimeoutId = setTimeout(() => {
      console.log('Fallback timeout reached, forcing exit from loading state');
      // Always exit loading state after fallback timeout
      setShowSkeleton(false);

      // Show a toast notification if we still don't have data
      if (!hasEssentialData) {
        console.warn('Exited loading state without essential data');
      }
    }, fallbackTimeout);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(fallbackTimeoutId);
    };
  }, [dataLoadingError, hasEssentialData]);

  // Improved skeleton visibility management with better transitions
  useEffect(() => {
    // Function to hide skeleton with a small delay for smooth transition
    const hideSkeleton = () => {
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 100);
      return timer;
    };

    // If we're refreshing, always show skeleton
    if (isRefreshing) {
      setShowSkeleton(true);
      return;
    }

    // If loading timeout occurred, exit loading state immediately
    if (loadingTimeout) {
      console.log('Loading timeout triggered, exiting skeleton state');
      setShowSkeleton(false);
      return;
    }

    // If auth is still loading, keep showing skeleton
    if (authLoading) {
      return;
    }

    // If we have essential data, hide skeleton
    if (hasEssentialData) {
      console.log('Essential data loaded, hiding skeleton');
      const timer = hideSkeleton();
      return () => clearTimeout(timer);
    }

    // If data loading has completed but we don't have essential data,
    // and we've attempted to load data, exit skeleton state
    if (isDataLoadComplete && hasAttemptedDataLoad && !isDataLoading) {
      console.log('Data loading complete but no essential data found, showing empty state');
      const timer = hideSkeleton();
      return () => clearTimeout(timer);
    }

    // If we've been loading for more than 10 seconds, exit skeleton state
    if (loadingDuration > 10000) {
      console.log('Loading duration exceeded 10s, exiting skeleton state');
      setShowSkeleton(false);
      return;
    }

    // Keep showing skeleton in all other cases
    return;
  }, [authLoading, isAuthReady, isProfileReady, isDataLoading, hasEssentialData,
      isRefreshing, loadingTimeout, hasAttemptedDataLoad, loadingDuration, isDataLoadComplete]);

  // If there's an error loading data and we're not currently refreshing, show an error message with refresh option
  // Only show error if we're not in skeleton loading state
  if ((dataLoadingError || profileError) && !isRefreshing && !showSkeleton) {
    return (
      <>
        <div className="relative">
          {/* Error toast that doesn't block content */}
          <div className="sticky top-2 mx-auto max-w-md z-50 mb-4 transform transition-all duration-300 ease-in-out">
            <Alert variant="destructive" className="shadow-lg border border-destructive/20">
              <AlertTitle className="text-sm font-medium">Error loading data</AlertTitle>
              <AlertDescription className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-xs">
                  {profileError
                    ? "Unable to load your profile data. This may affect some features."
                    : "There was a problem loading essential data. Some features may not work correctly."}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="shrink-0 bg-background text-xs h-8 px-2"
                >
                  {isRefreshing ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Refresh Data
                    </>
                  )}
                </Button>
              </AlertDescription>
            </Alert>
          </div>

          {/* Main content */}
          {showSkeleton ? (
            <DashboardSkeleton />
          ) : (
            children
          )}
        </div>
      </>
    );
  }

  // Show skeleton during loading
  if (showSkeleton) {
    return <DashboardSkeleton />;
  }

  // Show the actual content
  return <>{children}</>;
}
