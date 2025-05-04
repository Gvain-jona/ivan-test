import useSWR, { SWRConfiguration } from 'swr';
import { ClientSegment } from '@/lib/services/analytics-service';
import { DateRange } from '@/types/date-range';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

// Default SWR configuration for analytics data
const DEFAULT_CONFIG: SWRConfiguration = {
  revalidateOnFocus: false,
  dedupingInterval: 60 * 60 * 1000, // 1 hour
  revalidateIfStale: false,
  keepPreviousData: true
};

/**
 * Hook to fetch client segments data
 *
 * @param dateRange - Date range for the metrics
 * @param config - SWR configuration
 * @returns Client segments data and loading state
 */
export function useClientSegments(dateRange: DateRange, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    `${API_ENDPOINTS.ANALYTICS_CLIENT_SEGMENTS}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch client segments: ${response.status}`);
      }
      return response.json();
    },
    { ...DEFAULT_CONFIG, ...config }
  );

  return {
    segments: data as ClientSegment[],
    isLoading,
    isError: !!error,
    mutate
  };
}
