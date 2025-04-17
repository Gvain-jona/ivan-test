'use client';

// This is a barrel file for hooks
// Note: In Next.js, it's often better to import directly from the source files
// rather than using barrel files to avoid potential issues with tree-shaking
// and module resolution.

// Export loading hooks
export { useLoadingSWR, useFetch } from './useLoadingSWR';

// Export utility hooks
export { useDebounce } from './useDebounce';

// Note: For data hooks, import directly from './useData' in your components
// Example: import { useOrders } from '@/hooks/useData';

// This comment serves as a reminder for developers to import directly
// from the source files rather than using this barrel file.
