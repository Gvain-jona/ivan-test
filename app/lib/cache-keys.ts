/**
 * Centralized cache key management for the application
 * This ensures consistent cache keys across components and prevents duplicate API calls
 */

import { API_ENDPOINTS } from './api-endpoints';
import { OrdersTableFilters, PaginationParams } from '@/types/orders';

export function getOrdersListKey(filters?: OrdersTableFilters, pagination?: PaginationParams): string {
  const params = new URLSearchParams();

  if (pagination) {
    if (pagination.page) params.set('limit', String(pagination.pageSize ?? 50));
    if (pagination.pageSize) params.set('offset', String(((pagination.page ?? 1) - 1) * (pagination.pageSize ?? 50)));
  }

  if (filters) {
    filters.status?.forEach(s => params.append('status', s));
    filters.paymentStatus?.forEach(s => params.append('paymentStatus', s));
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.search) params.set('search', filters.search);
  }

  const qs = params.toString();
  return qs ? `${API_ENDPOINTS.ORDERS}?${qs}` : API_ENDPOINTS.ORDERS;
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
