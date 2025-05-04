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
  RECURRING_EXPENSES: '/api/expenses/recurring',

  // Materials
  MATERIALS: '/api/material-purchases',
  MATERIAL_PURCHASE: (id: string) => `/api/material-purchases/${id}`,
  MATERIAL_PURCHASE_OPTIMIZED: (id: string) => `/api/material-purchases/${id}/optimized`,
  MATERIAL_PAYMENTS: (id: string) => `/api/material-purchases/${id}/payments`,
  MATERIAL_NOTES: (id: string) => `/api/material-purchases/${id}/notes`,
  MATERIAL_INSTALLMENTS: (id: string) => `/api/material-purchases/${id}/installments`,

  // Tasks
  TASKS: '/api/tasks',

  // Dashboard
  DASHBOARD: '/api/dashboard',

  // Analytics
  ANALYTICS_SUMMARY: '/api/analytics/summary',
  ANALYTICS_REVENUE: '/api/analytics/revenue',
  ANALYTICS_PROFIT: '/api/analytics/profit',
  ANALYTICS_CLIENTS: '/api/analytics/clients',
  ANALYTICS_EXPENSES: '/api/analytics/expenses',
  ANALYTICS_MATERIALS: '/api/analytics/materials',
  ANALYTICS_CASH_FLOW: '/api/analytics/cash-flow',
  ANALYTICS_CATEGORIES: '/api/analytics/categories',
  ANALYTICS_RETENTION: '/api/analytics/retention',
  ANALYTICS_EXPENSE_RATIO: '/api/analytics/expense-ratio',
  ANALYTICS_DELINQUENCY: '/api/analytics/delinquency',
  ANALYTICS_CLIENT_SEGMENTS: '/api/analytics/client-segments',
  ANALYTICS_CLIENT_PERFORMANCE: '/api/analytics/client-performance',
  ANALYTICS_CLIENT_FREQUENCY: '/api/analytics/client-frequency',
  ANALYTICS_CLIENT_LIFETIME_VALUE: '/api/analytics/client-lifetime-value',

  // Dropdown data
  DROPDOWN_CLIENTS: '/api/dropdown/clients',
  DROPDOWN_CATEGORIES: '/api/dropdown/categories',
  DROPDOWN_ITEMS: '/api/dropdown/items',
  DROPDOWN_SIZES: '/api/dropdown/sizes',
  DROPDOWN_SUPPLIERS: '/api/dropdown/suppliers',

  // Announcements
  ANNOUNCEMENTS: '/api/announcements',
  ANNOUNCEMENT_ACTIVE: '/api/announcements/active',
};
