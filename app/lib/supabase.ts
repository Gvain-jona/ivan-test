// Import the createClient function from our centralized client file
import { createClient as createSupabaseClient } from './supabase/client';

// Re-export the client creation function to maintain compatibility
export const createClient = createSupabaseClient;

// Create a singleton instance for direct imports
export const supabase = createSupabaseClient();

// API endpoints
const API_ENDPOINTS = {
  ORDERS: '/api/orders',
  EXPENSES: '/api/expenses',
  MATERIALS: '/api/materials',
  TASKS: '/api/tasks',
  DASHBOARD: '/api/dashboard',
};

// Helper function to handle fetch errors
async function fetchWithErrorHandling(url: string, options?: RequestInit) {
  try {
    console.log(`Fetching data from: ${url}`);
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching from ${url}:`, errorText);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch from ${url}:`, error);
    throw error;
  }
}

// Real data service that fetches from API endpoints
export const dataService = {
  // Orders
  getOrders: async () => {
    try {
      const response = await fetchWithErrorHandling(API_ENDPOINTS.ORDERS);
      console.log('Orders data received:', response);
      return response.orders || [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  },

  getOrderById: async (id: string) => {
    try {
      return await fetchWithErrorHandling(`${API_ENDPOINTS.ORDERS}/${id}`);
    } catch (error) {
      console.error(`Error fetching order ${id}:`, error);
      return null;
    }
  },

  // Expenses
  getExpenses: async () => {
    try {
      const response = await fetchWithErrorHandling(API_ENDPOINTS.EXPENSES);
      return response.expenses || [];
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return [];
    }
  },

  getExpenseById: async (id: string) => {
    try {
      return await fetchWithErrorHandling(`${API_ENDPOINTS.EXPENSES}/${id}`);
    } catch (error) {
      console.error(`Error fetching expense ${id}:`, error);
      return null;
    }
  },

  // Materials
  getMaterials: async () => {
    try {
      const response = await fetchWithErrorHandling(API_ENDPOINTS.MATERIALS);
      return response.materials || [];
    } catch (error) {
      console.error('Error fetching materials:', error);
      return [];
    }
  },

  getMaterialById: async (id: string) => {
    try {
      return await fetchWithErrorHandling(`${API_ENDPOINTS.MATERIALS}/${id}`);
    } catch (error) {
      console.error(`Error fetching material ${id}:`, error);
      return null;
    }
  },

  // Tasks
  getTasks: async () => {
    try {
      const response = await fetchWithErrorHandling(API_ENDPOINTS.TASKS);
      return response.tasks || [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  },

  getTaskById: async (id: string) => {
    try {
      return await fetchWithErrorHandling(`${API_ENDPOINTS.TASKS}/${id}`);
    } catch (error) {
      console.error(`Error fetching task ${id}:`, error);
      return null;
    }
  },

  // Dashboard stats
  getDashboardStats: async () => {
    try {
      return await fetchWithErrorHandling(API_ENDPOINTS.DASHBOARD);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalOrders: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        pendingTasks: 0
      };
    }
  }
};
