'use client';

import { useEffect } from 'react';
import { prefetchMultiple } from '@/lib/prefetch';

// Define API endpoints directly to avoid circular dependencies
const API_ENDPOINTS = {
  DROPDOWN_CLIENTS: '/api/dropdown/clients',
  DROPDOWN_CATEGORIES: '/api/dropdown/categories',
  DROPDOWN_SIZES: '/api/dropdown/sizes',
  DASHBOARD: '/api/dashboard',
  ORDERS: '/api/orders',
  ORDERS_OPTIMIZED: '/api/orders/optimized',
};

/**
 * DataPreloader Component
 * Preloads essential data when the application starts
 */
export function DataPreloader() {
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    // Safe fetch function that handles errors
    const safeFetch = async (url: string) => {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
        }
        return res.json();
      } catch (error) {
        console.error(`Error prefetching ${url}:`, error);
        return []; // Return empty array as fallback
      }
    };

    // Preload essential data
    prefetchMultiple([
      // Dropdown data (used across the app)
      {
        key: API_ENDPOINTS.DROPDOWN_CLIENTS,
        fetcher: () => safeFetch(API_ENDPOINTS.DROPDOWN_CLIENTS)
      },
      {
        key: API_ENDPOINTS.DROPDOWN_CATEGORIES,
        fetcher: () => safeFetch(API_ENDPOINTS.DROPDOWN_CATEGORIES)
      },
      {
        key: API_ENDPOINTS.DROPDOWN_SIZES,
        fetcher: () => safeFetch(API_ENDPOINTS.DROPDOWN_SIZES)
      },
    ]);

    // Preload dashboard data after a short delay
    setTimeout(() => {
      prefetchMultiple([
        {
          key: API_ENDPOINTS.DASHBOARD,
          fetcher: () => safeFetch(API_ENDPOINTS.DASHBOARD)
        },
      ]);
    }, 2000);

    // Preload orders data with a longer delay to prioritize essential data
    setTimeout(() => {
      prefetchMultiple([
        {
          key: API_ENDPOINTS.ORDERS_OPTIMIZED,
          fetcher: () => safeFetch(API_ENDPOINTS.ORDERS_OPTIMIZED)
        },
      ]);
    }, 5000);
  }, []);

  // This component doesn't render anything
  return null;
}
