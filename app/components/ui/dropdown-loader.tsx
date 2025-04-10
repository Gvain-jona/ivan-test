'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useDropdownCache } from '@/context/DropdownCacheContext';

interface DropdownLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * A component that shows a loading indicator while dropdown data is being loaded
 * This helps prevent users from interacting with forms before data is ready
 */
export function DropdownLoader({
  children,
  fallback = <DefaultLoadingFallback />
}: DropdownLoaderProps) {
  const { initialLoadComplete, cache } = useDropdownCache();
  const [isLoading, setIsLoading] = useState(true);

  // Check if essential data is loaded
  useEffect(() => {
    // Consider the loader complete when either:
    // 1. initialLoadComplete is true, or
    // 2. We have data for categories and sizes
    const hasCategories = cache['categories']?.data?.length > 0;
    const hasSizes = cache['sizes']?.data?.length > 0;
    const essentialDataLoaded = hasCategories && hasSizes;

    console.log('[DropdownLoader] Checking data load status:', {
      initialLoadComplete,
      hasCategories,
      hasSizes,
      categoriesCount: cache['categories']?.data?.length || 0,
      sizesCount: cache['sizes']?.data?.length || 0
    });

    // If we have essential data or initialLoadComplete is true, proceed
    if (initialLoadComplete || essentialDataLoaded) {
      // Add a small delay to ensure UI is ready
      const timer = setTimeout(() => {
        setIsLoading(false);
        console.log('[DropdownLoader] Loading complete');
      }, 500);

      return () => clearTimeout(timer);
    }

    // If we don't have essential data yet, set a timeout to force-complete loading
    // after a reasonable time to prevent the app from being stuck in loading state
    const forceCompleteTimer = setTimeout(() => {
      if (isLoading) {
        console.log('[DropdownLoader] Force completing load after timeout');
        setIsLoading(false);
      }
    }, 10000); // 10 seconds max loading time

    return () => clearTimeout(forceCompleteTimer);
  }, [initialLoadComplete, cache, isLoading]);

  if (isLoading) {
    return fallback;
  }

  return <>{children}</>;
}

function DefaultLoadingFallback() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card rounded-lg shadow-lg p-6 max-w-md w-full mx-4 flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <h3 className="text-lg font-medium">Loading Data</h3>
        <p className="text-center text-muted-foreground">
          Loading dropdown data for forms. This will only take a moment...
        </p>
      </div>
    </div>
  );
}
