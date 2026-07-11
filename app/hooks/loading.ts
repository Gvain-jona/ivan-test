// Central barrel export for data hooks.
// Each domain has its own file; this barrel keeps consumer imports stable.

export { useLoadingSWR, useFetch } from './useLoadingSWR';

// Orders domain (legacy root hooks; the v2 order hooks live in ./orders/)
export { useOrders, useOrder } from './useOrders';

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
