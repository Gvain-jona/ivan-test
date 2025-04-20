import { useEffect } from 'react';
import { mutate } from 'swr';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

/**
 * Custom hook to check for cache invalidation needs
 * This hook will check if the global flag for cache invalidation is set
 * and trigger a revalidation if needed
 */
export function useCacheInvalidation() {
  useEffect(() => {
    // Check if the global flag is set
    if (global.__orderCacheInvalidationNeeded) {
      const orderId = global.__invalidatedOrderId;
      
      // Invalidate the specific order
      if (orderId) {
        mutate(`${API_ENDPOINTS.ORDERS}/${orderId}`);
      }
      
      // Invalidate the orders list
      mutate(API_ENDPOINTS.ORDERS);
      
      // Invalidate any other order-related endpoints
      mutate(
        (key) => typeof key === 'string' && key.includes(API_ENDPOINTS.ORDERS),
        undefined,
        { revalidate: true }
      );
      
      console.log(`[Cache] Invalidated cache for order: ${orderId || 'all orders'}`);
      
      // Reset the flag
      global.__orderCacheInvalidationNeeded = false;
      global.__invalidatedOrderId = '';
    }
  }, []);
}
