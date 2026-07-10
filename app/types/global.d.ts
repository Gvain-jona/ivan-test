// Global type definitions

interface Window {
  __fetchedOptions?: Record<string, boolean>;
}

declare global {
  // eslint-disable-next-line no-var -- globalThis augmentation requires var
  var __orderCacheInvalidationNeeded: boolean;
  // eslint-disable-next-line no-var -- globalThis augmentation requires var
  var __invalidatedOrderId: string;
}
