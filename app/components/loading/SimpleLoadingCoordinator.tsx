'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/auth-context';
import { PageSkeleton, LoadingError } from '@/components/ui/loading';

interface LoadingCoordinatorProps {
  children: React.ReactNode;
}

/**
 * SimpleLoadingCoordinator manages the loading states across the application
 * It focuses on authentication state and provides a consistent loading experience
 */
export function SimpleLoadingCoordinator({ children }: LoadingCoordinatorProps) {
  const { user, profile, isLoading: authLoading, profileError, refreshProfile } = useAuth();
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Handle refresh of profile data
  const handleRefresh = async () => {
    if (!refreshProfile) return;
    
    setIsRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      // Add a small delay to prevent flickering
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  // Manage loading state based on auth status
  useEffect(() => {
    if (!authLoading) {
      // Add a small delay for smoother transition
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [authLoading]);
  
  // Add a maximum loading time to prevent getting stuck
  useEffect(() => {
    const maxLoadingTime = 5000; // 5 seconds
    
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, maxLoadingTime);
    
    return () => clearTimeout(timer);
  }, []);

  // Show profile error if there's an issue with the profile data
  if (profileError && !authLoading && !showSkeleton) {
    return (
      <>
        <div className="sticky top-2 mx-auto max-w-md z-50 mb-4">
          <LoadingError
            title="Profile Error"
            description="Unable to load your profile data. Some features may not work correctly."
            onRetry={handleRefresh}
            isRetrying={isRefreshing}
          />
        </div>
        {children}
      </>
    );
  }

  // Show skeleton during loading
  if (showSkeleton) {
    return <PageSkeleton />;
  }

  // Show the actual content
  return <>{children}</>;
}
