'use client';

import { useEffect } from 'react';
import { performCleanup } from '@/app/lib/cleanup-utils';

/**
 * Component that initializes SWR cache cleanup on app startup
 * This component should be placed in the app layout
 * Note: This has been simplified to only handle SWR cache
 */
export function CacheCleanupInitializer() {
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    // Check if this is a fresh session
    const lastCleanupTime = localStorage.getItem('last_cache_cleanup');
    const now = Date.now();

    // If no cleanup has been performed in the last 24 hours, clean expired items
    if (!lastCleanupTime || (now - parseInt(lastCleanupTime)) > 24 * 60 * 60 * 1000) {
      console.log('Performing startup cache cleanup...');

      // Clean up expired cache items
      try {
        // Only clean expired items on startup to avoid disrupting the user experience
        const { localStorageCount } = performCleanup('swr');

        // Record the cleanup time
        localStorage.setItem('last_cache_cleanup', now.toString());

        console.log(`Startup cleanup complete: removed ${localStorageCount} expired items`);
      } catch (error) {
        console.error('Error during startup cleanup:', error);
      }
    }

    // Set up periodic cleanup
    const cleanupInterval = setInterval(() => {
      try {
        // Check for expired SWR cache every hour
        performCleanup('swr');
      } catch (error) {
        console.error('Error during periodic cleanup:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    return () => {
      clearInterval(cleanupInterval);
    };
  }, []);

  // This component doesn't render anything
  return null;
}
