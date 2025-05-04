import { useLoadingSWR } from '../useLoadingSWR';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import { createSWRConfig } from '@/lib/swr-config';
import { EXPENSE_SWR_CONFIG } from './useExpensesList';

/**
 * Hook to fetch expense categories
 */
export function useExpenseCategories() {
  // Create a standardized SWR config for dropdown data with longer cache time
  const swrConfig = createSWRConfig('dropdown', {
    ...EXPENSE_SWR_CONFIG,
    // Use a longer cache time for dropdown data since it changes less frequently
    dedupingInterval: 60 * 60 * 1000, // 60 minutes
  });

  // Fetch categories with improved error handling
  const { data, error, isLoading } = useLoadingSWR(
    `${API_ENDPOINTS.EXPENSES}/categories`,
    async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch expense categories: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching expense categories:', error);
        throw error;
      }
    },
    'expense-categories',
    swrConfig
  );

  return {
    categories: data?.categories || [],
    isLoading,
    isError: !!error,
    isEmpty: !data?.categories || data.categories.length === 0,
  };
}
