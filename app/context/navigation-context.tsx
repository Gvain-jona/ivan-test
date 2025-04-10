'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
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
const NAVIGATION_TIMEOUT = 10000; // 10 seconds - increased for slower connections

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Enhanced state management
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationError, setNavigationError] = useState<Error | null>(null);
  const [previousPath, setPreviousPath] = useState<string | null>(null);

  // Refs for tracking navigation state
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const targetPathRef = useRef<string | null>(null);

  // Clear any existing navigation timeout
  const clearNavigationTimeout = useCallback(() => {
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
  }, []);

  // Reset navigation state
  const resetNavigationState = useCallback(() => {
    setIsNavigating(false);
    setNavigationError(null);
    targetPathRef.current = null;
    clearNavigationTimeout();
  }, [clearNavigationTimeout]);

  // Effect to handle pathname changes
  useEffect(() => {
    // If we're navigating and the pathname matches the target path, navigation succeeded
    if (isNavigating && pathname === targetPathRef.current) {
      resetNavigationState();
    }

    // If the pathname changed but doesn't match our target, it was likely an external navigation
    if (pathname !== previousPath) {
      setPreviousPath(pathname);
      // Reset navigation state in case we were in the middle of navigating
      resetNavigationState();
    }
  }, [pathname, previousPath, isNavigating, resetNavigationState]);

  // Cancel current navigation
  const cancelNavigation = useCallback(() => {
    if (isNavigating) {
      resetNavigationState();
    }
  }, [isNavigating, resetNavigationState]);

  // Enhanced navigation function with timeout, error handling, and fallback
  const startNavigation = useCallback((path: string) => {
    // Don't navigate to the current path
    if (path === pathname) return;

    // Clear any existing navigation state
    resetNavigationState();

    // Set up new navigation
    setIsNavigating(true);
    targetPathRef.current = path;

    // Log navigation attempt for debugging
    console.log(`Attempting to navigate to: ${path}`);

    try {
      // First attempt: Use router.push
      router.push(path);

      // Set up a timeout to detect failed navigation
      navigationTimeoutRef.current = setTimeout(() => {
        console.warn(`Navigation to ${path} timed out after ${NAVIGATION_TIMEOUT}ms, trying fallback...`);

        try {
          // Fallback: Try using window.location as a last resort
          // This is more disruptive but more reliable
          window.location.href = path;

          // Still keep the error state so the user knows something went wrong
          setNavigationError(new Error(`Navigation timeout: Falling back to direct navigation to ${path}`));
        } catch (fallbackError) {
          console.error('Fallback navigation failed:', fallbackError);
          setNavigationError(new Error(`Navigation failed completely: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`));
          setIsNavigating(false);
        }
      }, NAVIGATION_TIMEOUT);
    } catch (error) {
      // Handle immediate navigation errors
      console.error('Initial navigation error:', error);

      try {
        // Fallback: Try using window.location as a last resort
        console.warn('Trying fallback navigation...');
        window.location.href = path;

        // Still keep the error state so the user knows something went wrong
        setNavigationError(new Error(`Navigation error: Falling back to direct navigation to ${path}`));
      } catch (fallbackError) {
        console.error('Fallback navigation failed:', fallbackError);
        setNavigationError(new Error(`Navigation failed completely: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`));
        setIsNavigating(false);
      }
    }
  }, [router, pathname, resetNavigationState]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearNavigationTimeout();
    };
  }, [clearNavigationTimeout]);

  return (
    <NavigationContext.Provider
      value={{
        isNavigating,
        startNavigation,
        cancelNavigation,
        navigationError,
        currentPath: pathname,
        previousPath,
      }}
    >
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
