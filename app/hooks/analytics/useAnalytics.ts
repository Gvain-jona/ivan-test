'use client';

import useSWR, { SWRConfiguration } from 'swr';
import { DateRange } from '@/types/date-range';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

// Add the new endpoint for normalized categories
const ANALYTICS_NORMALIZED_CATEGORIES = '/api/analytics/normalized-categories';
import {
  SummaryMetrics,
  RevenueByPeriod,
  ProfitByPeriod,
  ClientPerformance,
  ExpensesByCategory,
  MaterialsBySupplier,
  CashFlowAnalysis,
  CategoryPerformance,
  ClientRetentionRate,
  ExpenseToRevenueRatio,
  InstallmentDelinquencyRate,
  SpendingSummary
} from '@/lib/services/analytics-service';

// Default SWR configuration for analytics data
const DEFAULT_CONFIG: SWRConfiguration = {
  revalidateOnFocus: false,
  dedupingInterval: 60 * 60 * 1000, // 1 hour
  revalidateIfStale: false,
  keepPreviousData: true
};

/**
 * Hook to fetch summary metrics
 *
 * @param dateRange - Date range for the metrics
 * @param config - SWR configuration
 * @returns Summary metrics
 */
export function useSummaryMetrics(dateRange: DateRange, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    `${API_ENDPOINTS.ANALYTICS_SUMMARY}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch summary metrics: ${response.status}`);
      }
      return response.json();
    },
    { ...DEFAULT_CONFIG, ...config }
  );

  return {
    metrics: data as SummaryMetrics,
    isLoading,
    isError: !!error,
    mutate
  };
}

/**
 * Hook to fetch revenue by period
 *
 * @param period - Period type (day, week, month, year)
 * @param dateRange - Date range for the metrics
 * @param config - SWR configuration
 * @returns Revenue by period
 */
export function useRevenueByPeriod(
  period: 'day' | 'week' | 'month' | 'year',
  dateRange: DateRange,
  config?: SWRConfiguration
) {
  const { data, error, isLoading, mutate } = useSWR(
    `${API_ENDPOINTS.ANALYTICS_REVENUE}?period=${period}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch revenue by period: ${response.status}`);
      }
      return response.json();
    },
    { ...DEFAULT_CONFIG, ...config }
  );

  return {
    data: data as RevenueByPeriod[],
    isLoading,
    isError: !!error,
    mutate
  };
}

/**
 * Hook to fetch profit by period
 *
 * @param period - Period type (day, week, month, year)
 * @param dateRange - Date range for the metrics
 * @param config - SWR configuration
 * @returns Profit by period
 */
export function useProfitByPeriod(
  period: 'day' | 'week' | 'month' | 'year',
  dateRange: DateRange,
  config?: SWRConfiguration
) {
  const { data, error, isLoading, mutate } = useSWR(
    `${API_ENDPOINTS.ANALYTICS_PROFIT}?period=${period}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch profit by period: ${response.status}`);
      }
      return response.json();
    },
    { ...DEFAULT_CONFIG, ...config }
  );

  return {
    data: data as ProfitByPeriod[],
    isLoading,
    isError: !!error,
    mutate
  };
}

/**
 * Hook to fetch client performance
 *
 * @param dateRange - Date range for the metrics
 * @param limit - Maximum number of clients to return
 * @param config - SWR configuration
 * @returns Client performance metrics
 */
export function useClientPerformance(
  dateRange: DateRange,
  limit: number = 10,
  config?: SWRConfiguration
) {
  const { data, error, isLoading, mutate } = useSWR(
    `${API_ENDPOINTS.ANALYTICS_CLIENTS}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&limit=${limit}`,
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch client performance: ${response.status}`);
      }
      return response.json();
    },
    { ...DEFAULT_CONFIG, ...config }
  );

  return {
    clients: data as ClientPerformance[],
    isLoading,
    isError: !!error,
    mutate
  };
}

/**
 * Hook to fetch expenses by category
 *
 * @param dateRange - Date range for the metrics
 * @param config - SWR configuration
 * @returns Expenses by category
 */
export function useExpensesByCategory(dateRange: DateRange, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    `${API_ENDPOINTS.ANALYTICS_EXPENSES}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch expenses by category: ${response.status}`);
      }
      return response.json();
    },
    { ...DEFAULT_CONFIG, ...config }
  );

  return {
    expenses: data as ExpensesByCategory[],
    isLoading,
    isError: !!error,
    mutate
  };
}

/**
 * Hook to fetch materials by supplier
 *
 * @param dateRange - Date range for the metrics
 * @param limit - Maximum number of suppliers to return
 * @param config - SWR configuration
 * @returns Materials by supplier
 */
export function useMaterialsBySupplier(
  dateRange: DateRange,
  limit: number = 10,
  config?: SWRConfiguration
) {
  const { data, error, isLoading, mutate } = useSWR(
    `${API_ENDPOINTS.ANALYTICS_MATERIALS}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&limit=${limit}`,
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch materials by supplier: ${response.status}`);
      }
      return response.json();
    },
    { ...DEFAULT_CONFIG, ...config }
  );

  return {
    suppliers: data as MaterialsBySupplier[],
    isLoading,
    isError: !!error,
    mutate
  };
}

/**
 * Hook to fetch cash flow analysis
 *
 * @param period - Period type (day, week, month, year)
 * @param dateRange - Date range for the metrics
 * @param config - SWR configuration
 * @returns Cash flow analysis
 */
export function useCashFlowAnalysis(
  period: 'day' | 'week' | 'month' | 'year',
  dateRange: DateRange,
  config?: SWRConfiguration
) {
  const { data, error, isLoading, mutate } = useSWR(
    `${API_ENDPOINTS.ANALYTICS_CASH_FLOW}?period=${period}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch cash flow analysis: ${response.status}`);
      }
      return response.json();
    },
    { ...DEFAULT_CONFIG, ...config }
  );

  return {
    cashFlow: data as CashFlowAnalysis[],
    isLoading,
    isError: !!error,
    mutate
  };
}

/**
 * Hook to fetch category performance
 *
 * @param dateRange - Date range for the metrics
 * @param config - SWR configuration
 * @returns Category performance metrics
 */
export function useCategoryPerformance(dateRange: DateRange, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    `${API_ENDPOINTS.ANALYTICS_CATEGORIES}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch category performance: ${response.status}`);
      }
      return response.json();
    },
    { ...DEFAULT_CONFIG, ...config }
  );

  return {
    categories: data as CategoryPerformance[],
    isLoading,
    isError: !!error,
    mutate
  };
}

/**
 * Hook to fetch normalized category performance
 *
 * This hook fetches category data that has been normalized to combine similar categories
 * and adds percentage of total revenue for each category.
 *
 * @param dateRange - Date range for the metrics
 * @param config - SWR configuration
 * @returns Normalized category performance metrics
 */
export function useNormalizedCategoryPerformance(dateRange: DateRange, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    `${ANALYTICS_NORMALIZED_CATEGORIES}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch normalized category performance: ${response.status}`);
      }
      return response.json();
    },
    { ...DEFAULT_CONFIG, ...config }
  );

  return {
    categories: data as (CategoryPerformance & { percentage: number })[],
    isLoading,
    isError: !!error,
    mutate
  };
}

/**
 * Hook to fetch client retention rate
 *
 * @param currentRange - Current date range
 * @param previousRange - Previous date range for comparison
 * @param config - SWR configuration
 * @returns Client retention rate
 */
export function useClientRetentionRate(
  currentRange: DateRange,
  previousRange: DateRange,
  config?: SWRConfiguration
) {
  const { data, error, isLoading, mutate } = useSWR(
    `${API_ENDPOINTS.ANALYTICS_RETENTION}?currentStartDate=${currentRange.startDate}&currentEndDate=${currentRange.endDate}&previousStartDate=${previousRange.startDate}&previousEndDate=${previousRange.endDate}`,
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch client retention rate: ${response.status}`);
      }
      return response.json();
    },
    { ...DEFAULT_CONFIG, ...config }
  );

  return {
    retention: data as ClientRetentionRate,
    isLoading,
    isError: !!error,
    mutate
  };
}

/**
 * Hook to fetch expense to revenue ratio
 *
 * @param period - Period type (day, week, month, year)
 * @param dateRange - Date range for the metrics
 * @param config - SWR configuration
 * @returns Expense to revenue ratio
 */
export function useExpenseToRevenueRatio(
  period: 'day' | 'week' | 'month' | 'year',
  dateRange: DateRange,
  config?: SWRConfiguration
) {
  const { data, error, isLoading, mutate } = useSWR(
    `${API_ENDPOINTS.ANALYTICS_EXPENSE_RATIO}?period=${period}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch expense to revenue ratio: ${response.status}`);
      }
      return response.json();
    },
    { ...DEFAULT_CONFIG, ...config }
  );

  return {
    ratios: data as ExpenseToRevenueRatio[],
    isLoading,
    isError: !!error,
    mutate
  };
}

/**
 * Hook to fetch installment delinquency rate
 *
 * @param asOfDate - Date to calculate delinquency as of
 * @param config - SWR configuration
 * @returns Installment delinquency rate
 */
export function useInstallmentDelinquencyRate(
  asOfDate: string = new Date().toISOString().split('T')[0],
  config?: SWRConfiguration
) {
  const { data, error, isLoading, mutate } = useSWR(
    `${API_ENDPOINTS.ANALYTICS_DELINQUENCY}?asOfDate=${asOfDate}`,
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch installment delinquency rate: ${response.status}`);
      }
      return response.json();
    },
    { ...DEFAULT_CONFIG, ...config }
  );

  return {
    delinquency: data as InstallmentDelinquencyRate,
    isLoading,
    isError: !!error,
    mutate
  };
}

/**
 * Hook to fetch spending summary data for the Spending Summary card
 *
 * This hook combines data from expenses and materials to provide a comprehensive
 * spending summary for the selected time range.
 *
 * @param timeRange - Time range string (e.g., 'Last Week', 'Last Month')
 * @param config - SWR configuration
 * @returns Spending summary data
 */
export function useSpendingSummary(
  timeRange: string = 'Last Week',
  config?: SWRConfiguration
) {
  // Convert time range to actual date range
  const dateRange = getDateRangeFromTimeRange(timeRange);

  // Fetch expenses by category
  const { expenses, isLoading: isLoadingExpenses, isError: isErrorExpenses } = useExpensesByCategory(dateRange);

  // Fetch summary metrics to get total expenses and materials
  const { metrics, isLoading: isLoadingSummary, isError: isErrorSummary } = useSummaryMetrics(dateRange);

  // Calculate total spend and spending limit
  const totalSpend = (metrics?.totalExpenses || 0) + (metrics?.totalMaterials || 0);

  // For spending limit, we'll use a simple calculation based on historical data
  // In a real app, this would come from a budget setting
  const spendingLimit = totalSpend > 0 ? Math.round(totalSpend * 1.2) : 2000000; // 20% buffer

  // Process expenses into categories
  const categories = processExpenseCategories(expenses);

  return {
    totalSpend,
    spendingLimit,
    categories,
    isLoading: isLoadingExpenses || isLoadingSummary,
    isError: isErrorExpenses || isErrorSummary
  };
}

/**
 * Helper function to convert a time range string to a DateRange object
 */
function getDateRangeFromTimeRange(timeRange: string): DateRange {
  const today = new Date();
  const startDate = new Date(today);

  switch (timeRange) {
    case 'Last Week':
      startDate.setDate(today.getDate() - 7);
      break;
    case 'Last Month':
      startDate.setMonth(today.getMonth() - 1);
      break;
    case 'Last Quarter':
      startDate.setMonth(today.getMonth() - 3);
      break;
    case 'Last Year':
      startDate.setFullYear(today.getFullYear() - 1);
      break;
    default:
      startDate.setDate(today.getDate() - 7); // Default to last week
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0]
  };
}

/**
 * Helper function to process expenses into categories for the Spending Summary card
 */
function processExpenseCategories(expenses: ExpensesByCategory[] = []): { name: string; amount: number; icon: string; color: string }[] {
  // Define icon names instead of JSX elements
  const ICONS = {
    SHOPPING_BAG: 'ShoppingBag',
    ZAP: 'Zap',
    CIRCLE_DOLLAR: 'CircleDollarSign'
  };

  // If no expenses, return default categories
  if (!expenses || expenses.length === 0) {
    return [
      {
        name: 'Fixed',
        amount: 0,
        icon: ICONS.SHOPPING_BAG,
        color: 'bg-blue-600 dark:bg-blue-600'
      },
      {
        name: 'Variable',
        amount: 0,
        icon: ICONS.ZAP,
        color: 'bg-sky-400 dark:bg-sky-400'
      },
      {
        name: 'Others',
        amount: 0,
        icon: ICONS.CIRCLE_DOLLAR,
        color: 'bg-gray-600 dark:bg-gray-600'
      }
    ];
  }

  // Map expense categories to UI categories
  const categoryMap: Record<string, { name: string; amount: number; icon: string; color: string }> = {
    'fixed': {
      name: 'Fixed',
      amount: 0,
      icon: ICONS.SHOPPING_BAG,
      color: 'bg-blue-600 dark:bg-blue-600'
    },
    'variable': {
      name: 'Variable',
      amount: 0,
      icon: ICONS.ZAP,
      color: 'bg-sky-400 dark:bg-sky-400'
    }
  };

  // Process expenses into categories
  expenses.forEach(expense => {
    if (categoryMap[expense.category]) {
      categoryMap[expense.category].amount += expense.total_amount;
    } else {
      // If category doesn't exist, add to Others
      if (!categoryMap['others']) {
        categoryMap['others'] = {
          name: 'Others',
          amount: 0,
          icon: ICONS.CIRCLE_DOLLAR,
          color: 'bg-gray-600 dark:bg-gray-600'
        };
      }
      categoryMap['others'].amount += expense.total_amount;
    }
  });

  // Convert to array and sort by amount
  return Object.values(categoryMap).sort((a, b) => b.amount - a.amount);
}
