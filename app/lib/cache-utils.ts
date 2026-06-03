import { mutate } from 'swr';
import { API_ENDPOINTS } from './api-endpoints';

function isOrderCacheKey(key: unknown, orderId: string): boolean {
  if (typeof key !== 'string') return false;
  return (
    key === API_ENDPOINTS.ORDERS ||
    key === `${API_ENDPOINTS.ORDERS}/${orderId}` ||
    key.startsWith(`${API_ENDPOINTS.ORDERS}?`) ||
    key.includes('/api/orders/optimized') ||
    key.includes(orderId)
  );
}

export function invalidateOrderCache(orderId: string, optimisticData?: unknown): void {
  if (optimisticData) {
    mutate(`${API_ENDPOINTS.ORDERS}/${orderId}`, optimisticData, false);
  }
  mutate((key) => isOrderCacheKey(key, orderId), undefined, { revalidate: true });
}
