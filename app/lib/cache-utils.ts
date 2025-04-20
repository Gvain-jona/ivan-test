import { mutate } from 'swr';
import { API_ENDPOINTS } from './api-endpoints';

/**
 * Invalidates the SWR cache for a specific order
 * @param orderId The ID of the order to invalidate
 * @param optimisticData Optional data to update the cache with immediately
 */
export function invalidateOrderCache(orderId: string, optimisticData?: any) {
  console.log(`[Cache] Invalidating cache for order: ${orderId}`);

  // Invalidate the specific order detail
  // If optimistic data is provided, update the cache immediately
  if (optimisticData) {
    mutate(`${API_ENDPOINTS.ORDERS}/${orderId}`, optimisticData, false);
  } else {
    mutate(`${API_ENDPOINTS.ORDERS}/${orderId}`);
  }

  // Invalidate the orders list - force revalidation
  mutate(API_ENDPOINTS.ORDERS, undefined, { revalidate: true });

  // Invalidate any cached orders list with filters
  // This is important for the OrdersTable which might be using a filtered list
  mutate((key) => {
    if (typeof key === 'string') {
      // Match the main orders endpoint
      if (key === API_ENDPOINTS.ORDERS) return true;

      // Match specific order endpoints
      if (key === `${API_ENDPOINTS.ORDERS}/${orderId}`) return true;

      // Match any orders endpoint with query parameters (filtered lists)
      if (key.startsWith(`${API_ENDPOINTS.ORDERS}?`)) return true;

      // Match optimized orders endpoint
      if (key.includes('/api/orders/optimized')) return true;

      // Match any key that includes the order ID
      if (key.includes(orderId)) return true;
    }
    return false;
  }, undefined, { revalidate: true });

  // Use a more targeted approach to invalidate only the necessary cache keys
  setTimeout(() => {
    // Only invalidate the specific order endpoint and the orders list
    // This is less aggressive but still ensures the necessary data is refreshed
    mutate((key) => {
      if (typeof key === 'string') {
        // Only match the specific order endpoint and the main orders list
        return key === `${API_ENDPOINTS.ORDERS}/${orderId}` ||
               key === API_ENDPOINTS.ORDERS ||
               key.startsWith(`${API_ENDPOINTS.ORDERS}?`) ||
               key.includes('/api/orders/optimized');
      }
      return false;
    }, undefined, { revalidate: true });
  }, 100);

  console.log(`[Cache] Cache invalidation complete for order: ${orderId}`);
}
