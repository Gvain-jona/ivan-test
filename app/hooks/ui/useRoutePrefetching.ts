'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { prefetchService } from '@/lib/prefetch-service';
import { NavItemType } from './useTabNavigation';

/**
 * Enhanced hook to handle route prefetching with improved efficiency
 */
export function useRoutePrefetching(navigationItems: NavItemType[]) {
  const pathname = usePathname();
  const router = useRouter();

  // Use a ref to track which routes have already been prefetched
  // This prevents redundant prefetching during the session
  const prefetchedRoutes = useRef<Set<string>>(new Set());

  // Prefetch adjacent routes and data for faster navigation
  useEffect(() => {
    // Skip prefetching for feature-in-development pages
    if (pathname.includes('/feature-in-development')) {
      return;
    }

    // Find current index
    const currentIndex = navigationItems.findIndex(
      item => 'href' in item && item.href && item.href !== '#' && pathname.startsWith(item.href)
    );

    if (currentIndex !== -1) {
      // Determine which routes to prefetch - previous, next, and common routes
      const routesToPrefetch = [];

      // Add previous and next routes
      if (currentIndex > 0) {
        routesToPrefetch.push(currentIndex - 1);
      }

      if (currentIndex < navigationItems.length - 1) {
        routesToPrefetch.push(currentIndex + 1);
      }

      // Add frequently accessed routes (like orders) if not already included
      const commonRouteIndices = navigationItems.reduce((indices, item, index) => {
        if (
          'href' in item &&
          (item.href.includes('/orders') || item.href.includes('/expenses')) &&
          !routesToPrefetch.includes(index) &&
          index !== currentIndex
        ) {
          indices.push(index);
        }
        return indices;
      }, [] as number[]);

      // Combine all routes to prefetch
      const allRoutesToPrefetch = [...routesToPrefetch, ...commonRouteIndices];

      // Prefetch each route if it's valid and hasn't been prefetched yet
      allRoutesToPrefetch.forEach(index => {
        if (
          index >= 0 &&
          index < navigationItems.length &&
          'href' in navigationItems[index] &&
          navigationItems[index].href !== '#' &&
          !navigationItems[index].href.includes('/feature-in-development')
        ) {
          const href = navigationItems[index].href as string;

          // Only prefetch if we haven't already prefetched this route
          if (!prefetchedRoutes.current.has(href)) {
            // Prefetch the route
            router.prefetch(href);
            prefetchedRoutes.current.add(href);

            // Selectively prefetch data based on route
            // Using a more targeted approach to reduce unnecessary data fetching
            if (href.includes('/orders')) {
              prefetchService.prefetchOrders();
            } else if (href.includes('/expenses')) {
              prefetchService.prefetchExpenses();
            } else if (href.includes('/material-purchases')) {
              prefetchService.prefetchMaterials();
            }
            // Only prefetch other data when specifically navigating to those routes
            // This reduces unnecessary data fetching
          }
        }
      });
    }
  }, [pathname, router, navigationItems]);
}
