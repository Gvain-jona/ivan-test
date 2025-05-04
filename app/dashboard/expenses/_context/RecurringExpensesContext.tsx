'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import { useLoadingSWR } from '@/hooks/useLoadingSWR';
import { createSWRConfig } from '@/lib/swr-config';

// Define types for our context
interface RecurringExpense {
  id: string;
  item_name: string;
  amount: number;
  category: string;
  date: string;
  is_recurring: boolean;
  recurrence_frequency: string;
  next_occurrence_date: string;
  [key: string]: any;
}

interface RecurringExpenseOccurrence {
  id: string;
  parent_expense_id: string;
  occurrence_date: string;
  status: 'pending' | 'completed' | 'skipped';
  expense?: RecurringExpense;
  [key: string]: any;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

interface RecurringExpensesContextType {
  // Data
  occurrences: RecurringExpenseOccurrence[];
  occurrencesByDate: Record<string, RecurringExpenseOccurrence[]>;

  // State
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  currentMonth: Date;
  selectedDate: Date | null;

  // Client-side filtering
  useClientSideFiltering: boolean;
  setUseClientSideFiltering: (value: boolean) => void;

  // Actions
  setCurrentMonth: (date: Date) => void;
  setSelectedDate: (date: Date | null) => void;
  updateOccurrenceStatus: (occurrenceId: string, status: 'pending' | 'completed' | 'skipped') => Promise<void>;
  refreshData: () => Promise<void>;
  generateOccurrences: () => Promise<void>;
}

// Create the context
const RecurringExpensesContext = createContext<RecurringExpensesContextType | undefined>(undefined);

// Custom hook to use the context
export function useRecurringExpenses() {
  const context = useContext(RecurringExpensesContext);
  if (context === undefined) {
    throw new Error('useRecurringExpenses must be used within a RecurringExpensesProvider');
  }
  return context;
}

// Provider component
export function RecurringExpensesProvider({ children }: { children: ReactNode }) {
  // State
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isGeneratingOccurrences, setIsGeneratingOccurrences] = useState<boolean>(false);

  // Client-side filtering state
  const [useClientSideFiltering, setUseClientSideFiltering] = useState<boolean>(true);

  // Calculate date ranges for current, previous, and next months
  const currentMonthStart = startOfMonth(currentMonth);
  const currentMonthEnd = endOfMonth(currentMonth);
  const prevMonthStart = startOfMonth(subMonths(currentMonth, 1));
  const prevMonthEnd = endOfMonth(subMonths(currentMonth, 1));
  const nextMonthStart = startOfMonth(addMonths(currentMonth, 1));
  const nextMonthEnd = endOfMonth(addMonths(currentMonth, 1));

  // Create a combined date range that includes previous, current, and next month
  const dateRange: DateRange = {
    startDate: format(prevMonthStart, 'yyyy-MM-dd'),
    endDate: format(nextMonthEnd, 'yyyy-MM-dd'),
  };

  // Build query string for the API
  const queryParams = new URLSearchParams();
  queryParams.append('startDate', dateRange.startDate);
  queryParams.append('endDate', dateRange.endDate);
  const queryString = queryParams.toString();
  const url = `${API_ENDPOINTS.RECURRING_EXPENSES}?${queryString}`;

  // Configure SWR with optimized settings
  const swrConfig = createSWRConfig('list', {
    dedupingInterval: 30 * 60 * 1000, // 30 minutes - increased to reduce API calls
    revalidateOnFocus: false,
    revalidateIfStale: false, // Don't automatically revalidate stale data
    revalidateOnReconnect: false, // Don't revalidate on reconnect to reduce API calls
    errorRetryCount: 2, // Reduced retry count
  });

  // Fetch recurring expenses with SWR
  const { data, error, isLoading, mutate } = useLoadingSWR(
    url,
    async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch recurring expenses: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching recurring expenses:', error);
        throw error;
      }
    },
    'recurring-expenses',
    swrConfig
  );

  // Process occurrences
  const occurrences = data?.occurrences || [];
  const isEmpty = occurrences.length === 0;

  // Group occurrences by date for easier access
  const occurrencesByDate = occurrences.reduce((acc: Record<string, RecurringExpenseOccurrence[]>, occurrence: RecurringExpenseOccurrence) => {
    const date = new Date(occurrence.occurrence_date);
    const dateKey = format(date, 'yyyy-MM-dd');

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }

    acc[dateKey].push(occurrence);
    return acc;
  }, {});

  // Function to update occurrence status
  const updateOccurrenceStatus = useCallback(async (occurrenceId: string, status: 'pending' | 'completed' | 'skipped') => {
    try {
      // Use the main endpoint instead of the status endpoint
      const response = await fetch(`${API_ENDPOINTS.RECURRING_EXPENSES}/${occurrenceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update occurrence status: ${response.status}`);
      }

      const result = await response.json();

      // Optimistically update the local data
      mutate(
        (currentData: any) => {
          if (!currentData || !currentData.occurrences) return currentData;

          const updatedOccurrences = currentData.occurrences.map((occ: RecurringExpenseOccurrence) =>
            occ.id === occurrenceId ? {
              ...occ,
              status,
              // If completed, add linked expense info
              ...(status === 'completed' && result.expense ? {
                linked_expense_id: result.expense.id,
                completed_date: new Date().toISOString()
              } : {})
            } : occ
          );

          return {
            ...currentData,
            occurrences: updatedOccurrences,
          };
        },
        false // Don't revalidate immediately
      );

      // We no longer need to dispatch an event for expense creation
      // The expense is still created in the backend, but we don't need to notify other components

      return result;
    } catch (error) {
      console.error('Error updating occurrence status:', error);
      throw error;
    }
  }, [mutate]);

  // Function to refresh data
  const refreshData = useCallback(async () => {
    try {
      await mutate();
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, [mutate]);

  // Function to generate occurrences
  const generateOccurrences = useCallback(async () => {
    try {
      setIsGeneratingOccurrences(true);
      toast.loading('Generating recurring expense occurrences...');

      const response = await fetch(API_ENDPOINTS.RECURRING_EXPENSES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to generate occurrences (${response.status}):`, errorText);
        toast.dismiss();
        toast.error('Failed to generate occurrences');
        return;
      }

      const data = await response.json();
      toast.dismiss();
      toast.success(`Generated ${data.generatedOccurrences?.length || 0} occurrences`);

      // Refresh the data
      await refreshData();
    } catch (error) {
      console.error('Error generating occurrences:', error);
      toast.dismiss();
      toast.error('An error occurred while generating occurrences');
    } finally {
      setIsGeneratingOccurrences(false);
    }
  }, [refreshData]);

  // Set up event listener for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      console.log('Refreshing recurring expenses data from event...');
      refreshData();
    };

    window.addEventListener('refresh-recurring-expenses', handleRefresh);

    return () => {
      window.removeEventListener('refresh-recurring-expenses', handleRefresh);
    };
  }, [refreshData]);

  // Context value
  const value: RecurringExpensesContextType = {
    occurrences,
    occurrencesByDate,
    isLoading,
    isError: !!error,
    isEmpty,
    currentMonth,
    selectedDate,
    useClientSideFiltering,
    setUseClientSideFiltering,
    setCurrentMonth,
    setSelectedDate,
    updateOccurrenceStatus,
    refreshData,
    generateOccurrences,
  };

  return (
    <RecurringExpensesContext.Provider value={value}>
      {children}
    </RecurringExpensesContext.Provider>
  );
}
