// Central barrel export for data hooks.
// Each domain has its own file; this barrel keeps consumer imports stable.

export { useLoadingSWR, useFetch } from './useLoadingSWR';

// Orders domain
export { useOrders, useOrder } from './useOrders';
export { useOrderPayments } from './orders/useOrderPayments';

// Domain data hooks
export { useMaterials, useMaterial } from './useMaterialsData';
export { useTasks, useTask } from './useTasksData';
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
