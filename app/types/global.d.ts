// Global type definitions

interface Window {
  __fetchedOptions?: Record<string, boolean>;
}

declare global {
  var __orderCacheInvalidationNeeded: boolean;
  var __invalidatedOrderId: string;
}
