'use client';

import { dataService } from './supabase';
import { setCachedData, getCachedData, CACHE_TTL } from './cache';
import { mutate } from 'swr';
import { toast } from '@/components/ui/use-toast';

// API endpoints (these would be real API endpoints in a production app)
const API_ENDPOINTS = {
  ORDERS: '/api/orders',
  EXPENSES: '/api/expenses',
  MATERIALS: '/api/materials',
  TASKS: '/api/tasks',
  DASHBOARD: '/api/dashboard',
};

export const prefetchService = {
  /**
   * Prefetch orders data with improved caching
   */
  prefetchOrders: async () => {
    // Check if we already have cached data
    const cachedData = getCachedData('orders');
    if (cachedData) {
      // If we have cached data, we can use it to populate the SWR cache
      mutate(API_ENDPOINTS.ORDERS, cachedData, false);
      console.log('Using cached orders data');
      return cachedData;
    }

    try {
      console.log('Fetching fresh orders data...');
      // Fetch the data
      const data = await dataService.getOrders();

      if (!data || (Array.isArray(data) && data.length === 0)) {
        console.warn('Received empty orders data from API');
      }

      // Cache the data with longer TTL
      setCachedData('orders', data, CACHE_TTL.MEDIUM); // Cache for 15 minutes

      // Update the SWR cache
      mutate(API_ENDPOINTS.ORDERS, data, false);

      console.log(`Prefetched ${Array.isArray(data) ? data.length : 'unknown'} orders`);
      return data;
    } catch (error) {
      console.error('Error prefetching orders:', error);
      // Show a toast notification for the error
      toast({
        title: 'Data Loading Error',
        description: 'Failed to load orders data. Some features may be unavailable.',
        variant: 'destructive',
      });
      return null;
    }
  },

  /**
   * Prefetch expenses data
   */
  prefetchExpenses: async () => {
    // Check if we already have cached data
    const cachedData = getCachedData('expenses');
    if (cachedData) {
      // If we have cached data, we can use it to populate the SWR cache
      mutate(API_ENDPOINTS.EXPENSES, cachedData, false);
      console.log('Using cached expenses data');
      return;
    }

    try {
      // Fetch the data
      const data = await dataService.getExpenses();

      // Cache the data
      setCachedData('expenses', data, 60000); // Cache for 1 minute

      // Update the SWR cache
      mutate(API_ENDPOINTS.EXPENSES, data, false);

      console.log('Prefetched expenses data');
    } catch (error) {
      console.error('Error prefetching expenses:', error);
    }
  },

  /**
   * Prefetch materials data
   */
  prefetchMaterials: async () => {
    // Check if we already have cached data
    const cachedData = getCachedData('materials');
    if (cachedData) {
      // If we have cached data, we can use it to populate the SWR cache
      mutate(API_ENDPOINTS.MATERIALS, cachedData, false);
      console.log('Using cached materials data');
      return;
    }

    try {
      // Fetch the data
      const data = await dataService.getMaterials();

      // Cache the data
      setCachedData('materials', data, 60000); // Cache for 1 minute

      // Update the SWR cache
      mutate(API_ENDPOINTS.MATERIALS, data, false);

      console.log('Prefetched materials data');
    } catch (error) {
      console.error('Error prefetching materials:', error);
    }
  },

  /**
   * Prefetch tasks data
   */
  prefetchTasks: async () => {
    // Check if we already have cached data
    const cachedData = getCachedData('tasks');
    if (cachedData) {
      // If we have cached data, we can use it to populate the SWR cache
      mutate(API_ENDPOINTS.TASKS, cachedData, false);
      console.log('Using cached tasks data');
      return;
    }

    try {
      // Fetch the data
      const data = await dataService.getTasks();

      // Cache the data
      setCachedData('tasks', data, 60000); // Cache for 1 minute

      // Update the SWR cache
      mutate(API_ENDPOINTS.TASKS, data, false);

      console.log('Prefetched tasks data');
    } catch (error) {
      console.error('Error prefetching tasks:', error);
    }
  },

  /**
   * Prefetch dashboard stats
   */
  prefetchDashboardStats: async () => {
    // Check if we already have cached data
    const cachedData = getCachedData('dashboard_stats');
    if (cachedData) {
      // If we have cached data, we can use it to populate the SWR cache
      mutate(API_ENDPOINTS.DASHBOARD, cachedData, false);
      console.log('Using cached dashboard stats');
      return;
    }

    try {
      // Fetch the data
      const data = await dataService.getDashboardStats();

      // Cache the data
      setCachedData('dashboard_stats', data, 300000); // Cache for 5 minutes

      // Update the SWR cache
      mutate(API_ENDPOINTS.DASHBOARD, data, false);

      console.log('Prefetched dashboard stats');
    } catch (error) {
      console.error('Error prefetching dashboard stats:', error);
    }
  },

  /**
   * Prefetch all data with improved error handling
   * @returns Object containing success status and any errors
   */
  prefetchAll: async () => {
    const startTime = Date.now();

    try {
      // Use allSettled instead of all to handle partial failures
      const results = await Promise.allSettled([
        prefetchService.prefetchOrders(),
        prefetchService.prefetchExpenses(),
        prefetchService.prefetchMaterials(),
        prefetchService.prefetchTasks(),
        prefetchService.prefetchDashboardStats(),
      ]);

      // Count successes and failures
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      // Log detailed results
      console.log(`Prefetch completed in ${Date.now() - startTime}ms: ${succeeded} succeeded, ${failed} failed`);

      // If any prefetch failed, show a toast but only once
      if (failed > 0) {
        toast({
          title: 'Some data failed to load',
          description: `${succeeded} of ${succeeded + failed} data types loaded successfully.`,
          variant: 'default',
        });
      }

      return {
        success: failed === 0,
        results
      };
    } catch (error) {
      console.error('Critical error during prefetch:', error);
      toast({
        title: 'Data Loading Error',
        description: 'Failed to load application data. Please refresh the page.',
        variant: 'destructive',
      });

      return {
        success: false,
        error
      };
    }
  },
};
