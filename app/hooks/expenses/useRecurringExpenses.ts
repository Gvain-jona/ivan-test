import { useLoadingSWR } from '../useLoadingSWR';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import { toast } from 'sonner';
import { createSWRConfig } from '@/lib/swr-config';
import { EXPENSE_SWR_CONFIG } from './useExpensesList';
import { useEffect } from 'react';

/**
 * Hook to fetch recurring expense occurrences
 * @param startDate Optional start date for filtering occurrences
 * @param endDate Optional end date for filtering occurrences
 * @returns Recurring expense occurrences and operations
 *
 * If both startDate and endDate are null, no data will be fetched (conditional fetching)
 */
export function useRecurringExpenses(startDate?: string | null, endDate?: string | null) {
  // Instead of early return, we'll use a disabled flag to control fetching
  // This ensures hooks are always called in the same order
  const disabled = startDate === null && endDate === null;

  // Build query string
  const queryParams = new URLSearchParams();

  if (startDate) {
    queryParams.append('startDate', startDate);
  }

  if (endDate) {
    queryParams.append('endDate', endDate);
  }

  const queryString = queryParams.toString();
  // If disabled, set URL to null to prevent fetching
  const url = disabled ? null : (
    queryString
      ? `${API_ENDPOINTS.RECURRING_EXPENSES}?${queryString}`
      : API_ENDPOINTS.RECURRING_EXPENSES
  );

  // Create a standardized SWR config for recurring expenses
  const swrConfig = createSWRConfig('list', EXPENSE_SWR_CONFIG);

  // Fetch recurring expenses with improved error handling
  const { data, error, isLoading, mutate } = useLoadingSWR(
    url,
    async (url) => {
      try {
        console.log(`Fetching recurring expenses from: ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch recurring expenses (${response.status}):`, errorText);
          throw new Error(`Failed to fetch recurring expenses: ${response.status}`);
        }

        const jsonData = await response.json();
        console.log('Successfully fetched recurring expenses data');
        return jsonData;
      } catch (error) {
        console.error('Error fetching recurring expenses:', error);
        throw error;
      }
    },
    'recurring-expenses',
    swrConfig
  );

  // Update occurrence status
  const updateOccurrenceStatus = async (occurrenceId: string, status: 'pending' | 'completed' | 'skipped') => {
    try {
      const response = await fetch(`${API_ENDPOINTS.RECURRING_EXPENSES}/${occurrenceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update occurrence status');
      }

      // Refresh the occurrences list
      mutate();
      toast.success('Occurrence status updated successfully');
      return result;
    } catch (error) {
      console.error('Error updating occurrence status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update occurrence status');
      throw error;
    }
  };

  // Set up event listener for refresh events
  useEffect(() => {
    if (disabled) return; // Don't set up listener if fetching is disabled

    const handleRefresh = () => {
      console.log('Refreshing recurring expenses data from event...');
      mutate();
    };

    window.addEventListener('refresh-recurring-expenses', handleRefresh);

    return () => {
      window.removeEventListener('refresh-recurring-expenses', handleRefresh);
    };
  }, [mutate, disabled]);

  // If disabled, return empty data with disabled operations
  if (disabled) {
    return {
      occurrences: [],
      isLoading: false,
      isError: false,
      isEmpty: true,
      mutate: () => Promise.resolve(),
      updateOccurrenceStatus: async () => {
        console.warn('Data fetching is disabled');
        return Promise.reject(new Error('Data fetching is disabled'));
      },
    };
  }

  // Return normal data and operations when not disabled
  return {
    occurrences: data?.occurrences || [],
    isLoading,
    isError: !!error,
    isEmpty: !data?.occurrences || data.occurrences.length === 0,
    mutate,
    updateOccurrenceStatus,
  };
}
