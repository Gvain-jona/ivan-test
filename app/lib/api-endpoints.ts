/**
 * API endpoints for the application
 * This file centralizes all API endpoints to avoid hardcoding them in multiple places
 */
export const API_ENDPOINTS = {
  // Orders
  ORDERS: '/api/orders',
  ORDER_ITEMS: '/api/order-items',
  ORDER_PAYMENTS: '/api/order-payments',
  ORDER_NOTES: '/api/notes',
  
  // Clients
  CLIENTS: '/api/clients',
  
  // Items and Categories
  ITEMS: '/api/items',
  CATEGORIES: '/api/categories',
  SIZES: '/api/sizes',
  
  // Suppliers
  SUPPLIERS: '/api/suppliers',
  
  // Expenses
  EXPENSES: '/api/expenses',
  
  // Materials
  MATERIALS: '/api/materials',
  
  // Tasks
  TASKS: '/api/tasks',
  
  // Dashboard
  DASHBOARD: '/api/dashboard',
  
  // Dropdown data
  DROPDOWN_CLIENTS: '/api/dropdown/clients',
  DROPDOWN_CATEGORIES: '/api/dropdown/categories',
  DROPDOWN_ITEMS: '/api/dropdown/items',
  DROPDOWN_SIZES: '/api/dropdown/sizes',
  DROPDOWN_SUPPLIERS: '/api/dropdown/suppliers',
};
