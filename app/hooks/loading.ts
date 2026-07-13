// Central barrel export for data hooks.
// Each domain has its own file; this barrel keeps consumer imports stable.

export { useLoadingSWR, useFetch } from './useLoadingSWR';

// Orders hooks live in ./orders/ (v2); the legacy root useOrders.ts was
// deleted at cutover cleanup (docs/v2-migration/ORDERS_CLEANUP.md Phase 1).

// Domain data hooks
export { useDashboardStats } from './useDashboardStats';

// Reference data hooks (clients, categories, items, sizes, suppliers) + generic
export {
  useClients,
  useCategories,
  useItems,
  useSizes,
  useSuppliers,
  useApiData,
} from './useData';

// Dropdown hooks
export {
  useDropdownClients,
  useDropdownCategories,
  useDropdownItems,
  useDropdownSizes,
  useDropdownSuppliers,
} from './useDropdownHooks';
