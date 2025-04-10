import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client using environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// This is a placeholder until we have actual Supabase integration
// For now, we'll simulate data fetching with delays
const SIMULATED_DELAY = 800; // ms

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data
const mockOrders = Array(20).fill(0).map((_, i) => ({
  id: `ORD-${1000 + i}`,
  customer: `Customer ${i + 1}`,
  total: Math.floor(Math.random() * 10000) / 100,
  status: ['Pending', 'Processing', 'Completed', 'Cancelled'][Math.floor(Math.random() * 4)],
  date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  items: Math.floor(Math.random() * 5) + 1
}));

const mockExpenses = Array(15).fill(0).map((_, i) => ({
  id: `EXP-${1000 + i}`,
  description: `Expense ${i + 1}`,
  amount: Math.floor(Math.random() * 5000) / 100,
  category: ['Materials', 'Utilities', 'Rent', 'Salaries', 'Other'][Math.floor(Math.random() * 5)],
  date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
}));

const mockMaterials = Array(12).fill(0).map((_, i) => ({
  id: `MAT-${1000 + i}`,
  name: `Material ${i + 1}`,
  quantity: Math.floor(Math.random() * 100) + 1,
  price: Math.floor(Math.random() * 2000) / 100,
  supplier: `Supplier ${Math.floor(Math.random() * 5) + 1}`,
  lastPurchased: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()
}));

const mockTasks = Array(10).fill(0).map((_, i) => ({
  id: `TASK-${1000 + i}`,
  title: `Task ${i + 1}`,
  description: `Description for task ${i + 1}`,
  status: ['Todo', 'In Progress', 'Completed'][Math.floor(Math.random() * 3)],
  priority: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
  dueDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString()
}));

// Data service
export const dataService = {
  // Orders
  getOrders: async () => {
    await delay(SIMULATED_DELAY);
    return mockOrders;
  },

  getOrderById: async (id: string) => {
    await delay(SIMULATED_DELAY);
    return mockOrders.find(order => order.id === id);
  },

  // Expenses
  getExpenses: async () => {
    await delay(SIMULATED_DELAY);
    return mockExpenses;
  },

  getExpenseById: async (id: string) => {
    await delay(SIMULATED_DELAY);
    return mockExpenses.find(expense => expense.id === id);
  },

  // Materials
  getMaterials: async () => {
    await delay(SIMULATED_DELAY);
    return mockMaterials;
  },

  getMaterialById: async (id: string) => {
    await delay(SIMULATED_DELAY);
    return mockMaterials.find(material => material.id === id);
  },

  // Tasks
  getTasks: async () => {
    await delay(SIMULATED_DELAY);
    return mockTasks;
  },

  getTaskById: async (id: string) => {
    await delay(SIMULATED_DELAY);
    return mockTasks.find(task => task.id === id);
  },

  // Dashboard stats
  getDashboardStats: async () => {
    await delay(SIMULATED_DELAY);
    return {
      totalOrders: mockOrders.length,
      totalRevenue: mockOrders.reduce((sum, order) => sum + order.total, 0),
      totalExpenses: mockExpenses.reduce((sum, expense) => sum + expense.amount, 0),
      pendingTasks: mockTasks.filter(task => task.status !== 'Completed').length
    };
  }
};
