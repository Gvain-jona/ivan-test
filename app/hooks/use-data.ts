'use client';

import useSWR from 'swr';
// Updated with optimized data fetching - 30 minute refresh interval
import { dataService } from '@/lib/supabase';

// API endpoints (these would be real API endpoints in a production app)
const API_ENDPOINTS = {
  ORDERS: '/api/orders',
  EXPENSES: '/api/expenses',
  MATERIALS: '/api/material-purchases',
  TASKS: '/api/tasks',
  DASHBOARD: '/api/dashboard',
};

// Custom fetcher functions that use our data service
const fetchers = {
  orders: async () => await dataService.getOrders(),
  order: async (id: string) => await dataService.getOrderById(id),
  expenses: async () => await dataService.getExpenses(),
  expense: async (id: string) => await dataService.getExpenseById(id),
  materials: async () => await dataService.getMaterials(),
  material: async (id: string) => await dataService.getMaterialById(id),
  tasks: async () => await dataService.getTasks(),
  task: async (id: string) => await dataService.getTaskById(id),
  dashboardStats: async () => await dataService.getDashboardStats(),
};

// Custom hooks
export function useOrders() {
  const { data, error, isLoading, mutate } = useSWR(
    API_ENDPOINTS.ORDERS,
    () => fetchers.orders(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30 * 60 * 1000, // 30 minutes (increased to reduce API calls)
      revalidateIfStale: false, // Don't automatically revalidate stale data
      keepPreviousData: true, // Keep previous data while fetching new data
    }
  );

  return {
    orders: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useOrder(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `${API_ENDPOINTS.ORDERS}/${id}` : null,
    () => fetchers.order(id),
    {
      revalidateOnFocus: false,
      dedupingInterval: 15 * 60 * 1000, // 15 minutes (increased to reduce API calls)
      revalidateIfStale: false, // Don't automatically revalidate stale data
      keepPreviousData: true, // Keep previous data while fetching new data
    }
  );

  return {
    order: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useExpenses() {
  const { data, error, isLoading, mutate } = useSWR(
    API_ENDPOINTS.EXPENSES,
    () => fetchers.expenses(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30 * 60 * 1000, // 30 minutes (increased to reduce API calls)
      revalidateIfStale: false, // Don't automatically revalidate stale data
      keepPreviousData: true, // Keep previous data while fetching new data
    }
  );

  return {
    expenses: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useExpense(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `${API_ENDPOINTS.EXPENSES}/${id}` : null,
    () => fetchers.expense(id),
    {
      revalidateOnFocus: false,
      dedupingInterval: 15 * 60 * 1000, // 15 minutes (increased to reduce API calls)
      revalidateIfStale: false, // Don't automatically revalidate stale data
      keepPreviousData: true, // Keep previous data while fetching new data
    }
  );

  return {
    expense: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useMaterials() {
  const { data, error, isLoading, mutate } = useSWR(
    API_ENDPOINTS.MATERIALS,
    () => fetchers.materials(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30 * 60 * 1000, // 30 minutes (increased to reduce API calls)
      revalidateIfStale: false, // Don't automatically revalidate stale data
      keepPreviousData: true, // Keep previous data while fetching new data
    }
  );

  return {
    materials: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useMaterial(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `${API_ENDPOINTS.MATERIALS}/${id}` : null,
    () => fetchers.material(id),
    {
      revalidateOnFocus: false,
      dedupingInterval: 15 * 60 * 1000, // 15 minutes (increased to reduce API calls)
      revalidateIfStale: false, // Don't automatically revalidate stale data
      keepPreviousData: true, // Keep previous data while fetching new data
    }
  );

  return {
    material: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useTasks() {
  const { data, error, isLoading, mutate } = useSWR(
    API_ENDPOINTS.TASKS,
    () => fetchers.tasks(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30 * 60 * 1000, // 30 minutes (increased to reduce API calls)
      revalidateIfStale: false, // Don't automatically revalidate stale data
      keepPreviousData: true, // Keep previous data while fetching new data
    }
  );

  return {
    tasks: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useTask(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `${API_ENDPOINTS.TASKS}/${id}` : null,
    () => fetchers.task(id),
    {
      revalidateOnFocus: false,
      dedupingInterval: 15 * 60 * 1000, // 15 minutes (increased to reduce API calls)
      revalidateIfStale: false, // Don't automatically revalidate stale data
      keepPreviousData: true, // Keep previous data while fetching new data
    }
  );

  return {
    task: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useDashboardStats() {
  const { data, error, isLoading, mutate } = useSWR(
    API_ENDPOINTS.DASHBOARD,
    () => fetchers.dashboardStats(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30 * 60 * 1000, // 30 minutes (increased to reduce API calls)
      revalidateIfStale: false, // Don't automatically revalidate stale data
      keepPreviousData: true, // Keep previous data while fetching new data
    }
  );

  return {
    stats: data,
    isLoading,
    isError: error,
    mutate,
  };
}
