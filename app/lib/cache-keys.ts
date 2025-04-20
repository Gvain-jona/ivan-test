/**
 * Centralized cache key management for the application
 * This ensures consistent cache keys across components and prevents duplicate API calls
 */

import { API_ENDPOINTS } from './api-endpoints';
import { OrdersFilters, PaginationParams } from '@/hooks/useData';

/**
 * Generate a consistent cache key for orders list with filters and pagination
 */
export function getOrdersListKey(
  filters?: OrdersFilters,
  pagination?: PaginationParams
): string {
  // Base key
  let key = API_ENDPOINTS.ORDERS;

  // Add optimized flag if using the optimized endpoint
  key = `${key}/optimized`;

  // Add query parameters
  const params = new URLSearchParams();

  // Add pagination parameters
  if (pagination) {
    if (pagination.page) params.append('page', pagination.page.toString());
    if (pagination.pageSize) params.append('pageSize', pagination.pageSize.toString());
  }

  // Add filter parameters
  if (filters) {
    if (filters.status) params.append('status', filters.status);
    if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
    if (filters.clientId) params.append('clientId', filters.clientId);
    if (filters.clientType) params.append('clientType', filters.clientType);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.search) params.append('search', filters.search);
    if (filters.isDelivered !== undefined) params.append('isDelivered', filters.isDelivered.toString());
  }

  // Add query string to key if there are parameters
  const queryString = params.toString();
  if (queryString) {
    key = `${key}?${queryString}`;
  }

  return key;
}

/**
 * Generate a consistent cache key for a single order
 */
export function getOrderKey(orderId: string): string {
  return `${API_ENDPOINTS.ORDERS}/${orderId}`;
}

/**
 * Generate a consistent cache key for order items
 */
export function getOrderItemsKey(orderId: string): string {
  return `${API_ENDPOINTS.ORDERS}/${orderId}/items`;
}

/**
 * Generate a consistent cache key for order payments
 */
export function getOrderPaymentsKey(orderId: string): string {
  return `${API_ENDPOINTS.ORDERS}/${orderId}/payments`;
}

/**
 * Generate a consistent cache key for order notes
 */
export function getOrderNotesKey(orderId: string): string {
  return `${API_ENDPOINTS.ORDERS}/${orderId}/notes`;
}

/**
 * Generate a consistent cache key for clients list
 */
export function getClientsListKey(): string {
  return API_ENDPOINTS.CLIENTS;
}

/**
 * Generate a consistent cache key for items list
 */
export function getItemsListKey(): string {
  return API_ENDPOINTS.ITEMS;
}

/**
 * Generate a consistent cache key for categories list
 */
export function getCategoriesListKey(): string {
  return API_ENDPOINTS.CATEGORIES;
}

/**
 * Generate a consistent cache key for sizes list
 */
export function getSizesListKey(): string {
  return API_ENDPOINTS.SIZES;
}
