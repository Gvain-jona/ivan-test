'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type NavigationContextType = {
  isNavigating: boolean;
  startNavigation: (path: string) => void;
  cancelNavigation: () => void;
  navigationError: Error | null;
  currentPath: string;
  previousPath: string | null;
};

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// Maximum time to wait for navigation to complete before timing out
const NAVIGATION_TIMEOUT = 20000; // 20 seconds - increased to accommodate complex pages with data loading

/**
 * NavigationProvider - Provides navigation state and functionality
 * Simplified implementation with improved error handling and performance
 */
export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Core state management
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationError, setNavigationError] = useState<Error | null>(null);
  const [previousPath, setPreviousPath] = useState<string | null>(null);

  // Single ref for tracking navigation state
  const navigationState = useRef<{
    timeoutId: NodeJS.Timeout | null;
    targetPath: string | null;
  }>({
    timeoutId: null,
    targetPath: null
  });

  // Clear navigation timeout
  const clearNavigationTimeout = useCallback(() => {
    if (navigationState.current.timeoutId) {
      clearTimeout(navigationState.current.timeoutId);
      navigationState.current.timeoutId = null;
    }
  }, []);

  // Reset navigation state - simplified
  const resetNavigationState = useCallback(() => {
    setIsNavigating(false);
    setNavigationError(null);
    navigationState.current.targetPath = null;
    clearNavigationTimeout();
  }, [clearNavigationTimeout]);

  // Effect to handle pathname changes - improved with better path matching
  useEffect(() => {
    // Log for debugging
    if (isNavigating) {
      console.log(`Navigation in progress: Current path=${pathname}, Target path=${navigationState.current.targetPath}`);
    }

    // If we're navigating and the pathname matches or starts with the target path, navigation succeeded
    // This handles both exact matches and nested routes
    if (isNavigating && navigationState.current.targetPath) {
      const targetPath = navigationState.current.targetPath;
      const isExactMatch = pathname === targetPath;
      const isNestedRoute = pathname.startsWith(`${targetPath}/`);

      if (isExactMatch || isNestedRoute) {
        console.log(`Navigation succeeded: ${pathname} matches target ${targetPath}`);
        resetNavigationState();
      }
    }

    // Track path changes for back/forward navigation support
    if (pathname !== previousPath) {
      setPreviousPath(pathname);

      // If path changed but we're still in navigating state, consider it a success
      // This handles cases where the router completes navigation but our state didn't update
      if (isNavigating) {
        console.log(`Path changed during navigation: from ${previousPath} to ${pathname}`);
        resetNavigationState();
      }
    }
  }, [pathname, previousPath, isNavigating, resetNavigationState]);

  // Cancel current navigation
  const cancelNavigation = useCallback(() => {
    if (isNavigating) {
      resetNavigationState();
    }
  }, [isNavigating, resetNavigationState]);

  // Enhanced navigation function with improved error handling and logging
  const startNavigation = useCallback((path: string) => {
    // Don't navigate to the current path
    if (path === pathname) {
      console.log(`Navigation skipped: Already at ${path}`);
      return;
    }

    // Clear any existing navigation state
    resetNavigationState();

    // Set up new navigation
    console.log(`Starting navigation to: ${path} from ${pathname}`);
    setIsNavigating(true);
    navigationState.current.targetPath = path;

    // Track navigation start time for performance monitoring
    const navigationStartTime = Date.now();

    try {
      // Use Next.js router for client-side navigation
      router.push(path);

      // Set up a reasonable timeout to detect failed navigation
      navigationState.current.timeoutId = setTimeout(() => {
        // If we reach this point, navigation might have failed
        const timeElapsed = Date.now() - navigationStartTime;
        console.warn(`Navigation timeout: ${timeElapsed}ms elapsed for path ${path}`);

        // Check if we're still on the original page
        if (pathname === navigationState.current.targetPath) {
          console.warn(`Still on original page after timeout. Navigation to ${path} may have failed.`);
        } else {
          console.warn(`Path changed to ${pathname} but navigation state wasn't reset properly.`);
        }

        // Instead of automatically using window.location (which causes a full page reload),
        // we set an error state that allows the user to choose what to do
        setNavigationError(new Error(`Failed to navigate to ${path}`));

        // Keep isNavigating true so the user knows we're still trying
        // The NavigationError component will provide options to retry or use direct navigation
      }, NAVIGATION_TIMEOUT);
    } catch (error) {
      // Handle immediate navigation errors (rare with Next.js router)
      console.error('Navigation error:', error);

      // Set error state with the actual error
      setNavigationError(
        error instanceof Error
          ? error
          : new Error(`Failed to navigate to ${path}`)
      );

      // Keep isNavigating true to show the error UI
    }
  }, [router, pathname, resetNavigationState]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearNavigationTimeout();
    };
  }, [clearNavigationTimeout]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    isNavigating,
    startNavigation,
    cancelNavigation,
    navigationError,
    currentPath: pathname,
    previousPath,
  }), [
    isNavigating,
    startNavigation,
    cancelNavigation,
    navigationError,
    pathname,
    previousPath,
  ]);

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);

  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }

  return context;
}

// Export the navigation timeout for use in other components
export const NAVIGATION_TIMEOUT_MS = NAVIGATION_TIMEOUT;
