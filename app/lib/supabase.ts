// Import the createClient function from our centralized client file
import { createClient as createSupabaseClient } from '@/utils/supabase/client';

// Re-export the client creation function to maintain compatibility
export const createClient = createSupabaseClient;

// Create a singleton instance for direct imports
export const supabase = createSupabaseClient();

// API endpoints
const API_ENDPOINTS = {
  ORDERS: '/api/orders',
  EXPENSES: '/api/expenses',
  MATERIALS: '/api/material-purchases',
  TASKS: '/api/tasks',
  DASHBOARD: '/api/dashboard',
};

// Helper function to handle fetch errors
async function fetchWithErrorHandling(url: string, options?: RequestInit) {
  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status} ${response.statusText}: ${errorText}`);
  }

  return await response.json();
}

// Data service that fetches from API endpoints.
// All methods throw on failure — callers are responsible for error handling.
// SWR hooks receive isError=true; server components should catch and log.
export const dataService = {
  getOrders: async () => {
    const response = await fetchWithErrorHandling(API_ENDPOINTS.ORDERS);
    return response.orders || [];
  },

  getOrderById: async (id: string) => {
    return await fetchWithErrorHandling(`${API_ENDPOINTS.ORDERS}/${id}`);
  },

  getExpenses: async () => {
    const response = await fetchWithErrorHandling(API_ENDPOINTS.EXPENSES);
    return response.expenses || [];
  },

  getExpenseById: async (id: string) => {
    return await fetchWithErrorHandling(`${API_ENDPOINTS.EXPENSES}/${id}`);
  },

  getMaterials: async () => {
    const response = await fetchWithErrorHandling(API_ENDPOINTS.MATERIALS);
    return response.materials || [];
  },

  getMaterialById: async (id: string) => {
    return await fetchWithErrorHandling(`${API_ENDPOINTS.MATERIALS}/${id}`);
  },

  getTasks: async () => {
    const response = await fetchWithErrorHandling(API_ENDPOINTS.TASKS);
    return response.tasks || [];
  },

  getTaskById: async (id: string) => {
    return await fetchWithErrorHandling(`${API_ENDPOINTS.TASKS}/${id}`);
  },

  getDashboardStats: async () => {
    return await fetchWithErrorHandling(API_ENDPOINTS.DASHBOARD);
  },
};
