import { useLoadingSWR } from '../useLoadingSWR';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import { createSWRConfig } from '@/lib/swr-config';
import { EXPENSE_SWR_CONFIG } from './useExpensesList';

/**
 * Hook to fetch expense statistics
 */
export function useExpenseStats() {
  // Create a standardized SWR config for stats data
  const swrConfig = createSWRConfig('stats', EXPENSE_SWR_CONFIG);

  // Fetch stats with improved error handling
  const { data, error, isLoading } = useLoadingSWR(
    `${API_ENDPOINTS.EXPENSES}/stats`,
    async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch expense stats: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching expense stats:', error);
        throw error;
      }
    },
    'expense-stats',
    swrConfig
  );

  return {
    stats: data?.stats || {},
    isLoading,
    isError: !!error,
  };
}
