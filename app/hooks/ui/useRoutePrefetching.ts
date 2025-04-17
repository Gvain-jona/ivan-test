'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { prefetchService } from '@/lib/prefetch-service';
import { NavItemType } from './useTabNavigation';

/**
 * Custom hook to handle route prefetching
 * Optimized to reduce excessive prefetching
 */
export function useRoutePrefetching(navigationItems: NavItemType[]) {
  const pathname = usePathname();
  const router = useRouter();

  // Prefetch adjacent routes and data for faster navigation
  useEffect(() => {
    // Skip prefetching for feature-in-development pages to reduce console spam
    if (pathname.includes('/feature-in-development')) {
      return;
    }

    // Find current index
    const currentIndex = navigationItems.findIndex(
      item => 'href' in item && item.href && item.href !== '#' && pathname.startsWith(item.href)
    );

    if (currentIndex !== -1) {
      // Prefetch previous and next routes
      const prevIndex = currentIndex - 1;
      const nextIndex = currentIndex + 1;

      // Helper function to prefetch if valid
      const prefetchIfValid = (index: number) => {
        if (
          index >= 0 &&
          index < navigationItems.length &&
          'href' in navigationItems[index] &&
          navigationItems[index].href !== '#' &&
          !navigationItems[index].href.includes('/feature-in-development') // Skip feature-in-development
        ) {
          const href = navigationItems[index].href as string;
          router.prefetch(href);

          // Also prefetch the data for this route
          if (href.includes('/orders')) {
            prefetchService.prefetchOrders();
          } else if (href.includes('/expenses')) {
            prefetchService.prefetchExpenses();
          } else if (href.includes('/material-purchases')) {
            prefetchService.prefetchMaterials();
          } else if (href.includes('/todo')) {
            prefetchService.prefetchTasks();
          } else if (href === '/dashboard' || href.includes('/home')) {
            prefetchService.prefetchDashboardStats();
          }
          // No longer logging feature-in-development prefetching
        }
      };

      // Prefetch previous and next items
      prefetchIfValid(prevIndex);
      prefetchIfValid(nextIndex);
    }
  }, [pathname, router, navigationItems]);
}
