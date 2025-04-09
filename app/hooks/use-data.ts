'use client';

import useSWR from 'swr';
import { dataService } from '@/lib/supabase';

// API endpoints (these would be real API endpoints in a production app)
const API_ENDPOINTS = {
  ORDERS: '/api/orders',
  EXPENSES: '/api/expenses',
  MATERIALS: '/api/materials',
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
      dedupingInterval: 60000, // 1 minute
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
      dedupingInterval: 60000, // 1 minute
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
      dedupingInterval: 60000, // 1 minute
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
      dedupingInterval: 60000, // 1 minute
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
      dedupingInterval: 60000, // 1 minute
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
      dedupingInterval: 60000, // 1 minute
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
      dedupingInterval: 60000, // 1 minute
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
      dedupingInterval: 60000, // 1 minute
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
      dedupingInterval: 300000, // 5 minutes
    }
  );
  
  return {
    stats: data,
    isLoading,
    isError: error,
    mutate,
  };
}
