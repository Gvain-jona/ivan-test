'use client';

import { dataService } from './supabase';
import { setCachedData, getCachedData } from './cache';
import { mutate } from 'swr';

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
   * Prefetch orders data
   */
  prefetchOrders: async () => {
    // Check if we already have cached data
    const cachedData = getCachedData('orders');
    if (cachedData) {
      // If we have cached data, we can use it to populate the SWR cache
      mutate(API_ENDPOINTS.ORDERS, cachedData, false);
      console.log('Using cached orders data');
      return;
    }
    
    try {
      // Fetch the data
      const data = await dataService.getOrders();
      
      // Cache the data
      setCachedData('orders', data, 60000); // Cache for 1 minute
      
      // Update the SWR cache
      mutate(API_ENDPOINTS.ORDERS, data, false);
      
      console.log('Prefetched orders data');
    } catch (error) {
      console.error('Error prefetching orders:', error);
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
   * Prefetch all data
   */
  prefetchAll: async () => {
    await Promise.all([
      prefetchService.prefetchOrders(),
      prefetchService.prefetchExpenses(),
      prefetchService.prefetchMaterials(),
      prefetchService.prefetchTasks(),
      prefetchService.prefetchDashboardStats(),
    ]);
    
    console.log('Prefetched all data');
  },
};
