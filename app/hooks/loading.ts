// Export all loading hooks from a single file
// This makes it easier to import loading hooks

// Export the SWR hooks
export { useLoadingSWR, useFetch } from './useLoadingSWR';

// Export specific data hooks instead of using wildcard export
// This prevents attempting to export Next.js metadata functions that don't exist
export {
  useOrders,
  useOrder,
  useMaterials,
  useMaterial,
  useTasks,
  useTask,
  useDashboardStats,
  useClients,
  useCategories,
  useItems,
  useSizes,
  useSuppliers,
  useApiData,
  useDropdownClients,
  useDropdownCategories,
  useDropdownItems,
  useDropdownSizes,
  useDropdownSuppliers,
  useOrderPayments
} from './useData';
