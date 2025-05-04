import { useState, useEffect } from 'react';
import { useLoadingSWR } from '../useLoadingSWR';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import { toast } from 'sonner';
import { Expense, ExpenseFilters, ExpenseNote, ExpensePayment } from './types';
import { createSWRConfig } from '@/lib/swr-config';
import {
  calculateAmountPaid,
  calculateBalance,
  calculatePaymentStatus
} from '@/utils/expense-calculations';
import { logDebug } from '@/utils/error-handling';
import { createExpenseSWRConfig } from './swr-config';

// Use the standardized SWR configuration from swr-config.ts
// This ensures consistent caching behavior across the application
export const EXPENSE_SWR_CONFIG = createExpenseSWRConfig('list');

/**
 * Hook to fetch all expenses with optional filtering
 * @param filters Optional filters to apply to the expenses query
 * @returns Expenses data and operations
 *
 * If filters is null, no data will be fetched (conditional fetching)
 */
export function useExpensesList(filters?: ExpenseFilters | null) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Instead of early return, we'll use a disabled flag to control fetching
  // This ensures hooks are always called in the same order
  const disabled = filters === null;

  // Build query string from filters
  const queryParams = new URLSearchParams();

  // Add category filter if provided
  if (filters?.category && filters.category.length > 0) {
    filters.category.forEach(cat => queryParams.append('category', cat));
  }

  if (filters?.paymentStatus && filters.paymentStatus.length > 0) {
    filters.paymentStatus.forEach(status => queryParams.append('paymentStatus', status));
  }

  if (filters?.is_recurring !== undefined) {
    queryParams.append('is_recurring', filters.is_recurring.toString());
  }

  if (filters?.startDate) {
    queryParams.append('startDate', filters.startDate);
  }

  if (filters?.endDate) {
    queryParams.append('endDate', filters.endDate);
  }

  if (filters?.search) {
    queryParams.append('search', filters.search);
  }

  if (filters?.limit) {
    queryParams.append('limit', filters.limit.toString());
  }

  if (filters?.offset) {
    queryParams.append('offset', filters.offset.toString());
  }

  // Ensure we have a valid API endpoint
  if (!API_ENDPOINTS.EXPENSES) {
    console.error('API_ENDPOINTS.EXPENSES is not defined');
  }

  const queryString = queryParams.toString();
  // If disabled, set URL to null to prevent fetching
  const url = disabled || !API_ENDPOINTS.EXPENSES ? null :
    (queryString ? `${API_ENDPOINTS.EXPENSES}?${queryString}` : API_ENDPOINTS.EXPENSES);

  // Create a standardized SWR config for list data with optimized caching
  const swrConfig = {
    ...EXPENSE_SWR_CONFIG,
    // Provide fallback data to prevent errors
    fallbackData: { expenses: [], count: 0, limit: 50, offset: 0 },
    // Increase timeout for slow connections
    dedupingInterval: 60 * 1000, // 1 minute
    // Increase retry count for better reliability
    errorRetryCount: 3,
    // Add a slight delay between retries
    errorRetryInterval: 2000,
    // Keep previous data while loading new data to prevent UI flashing
    keepPreviousData: true,
  };

  // Fetch expenses with improved error handling and reduced logging
  const { data, error, isLoading, mutate } = useLoadingSWR(
    url,
    async (url) => {
      const startTime = Date.now();
      try {
        // Use the logDebug utility for conditional logging
        logDebug('Fetching expenses with filters:', filters);

        if (!url) {
          return { expenses: [], count: 0, limit: 50, offset: 0 };
        }

        // Add timeout to fetch to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        try {
          const response = await fetch(url, {
            signal: controller.signal,
            // Add cache control headers to improve caching
            headers: {
              'Cache-Control': 'max-age=300', // 5 minutes
            }
          });

          // Clear the timeout
          clearTimeout(timeoutId);

          if (!response.ok) {
            console.warn(`Expenses API returned status ${response.status}`);
            throw new Error(`Failed to fetch expenses: ${response.status}`);
          }

          const result = await response.json();

          // Log performance metrics
          const endTime = Date.now();
          console.log(`Expenses API call completed in ${endTime - startTime}ms`);

          // Ensure the result has the expected structure
          if (!result || typeof result !== 'object') {
            console.warn('Expenses API returned invalid data structure');
            return { expenses: [], count: 0, limit: 50, offset: 0 };
          }

          // The API wraps the response in a 'data' property
          const responseData = result.data || result;

          // Ensure expenses is an array
          if (!responseData.expenses) {
            console.warn('No expenses array in API response');
            responseData.expenses = [];
          } else if (!Array.isArray(responseData.expenses)) {
            console.warn('Expenses is not an array in API response');
            responseData.expenses = [];
          }

          return {
            expenses: responseData.expenses || [],
            count: responseData.count || 0,
            limit: responseData.limit || 50,
            offset: responseData.offset || 0
          };
        } catch (fetchError) {
          // Clear the timeout to prevent memory leaks
          clearTimeout(timeoutId);
          throw fetchError;
        }
      } catch (error) {
        const endTime = Date.now();
        console.error(`Error in expenses fetcher after ${endTime - startTime}ms:`, error);

        // Check if it's an abort error (timeout)
        if (error.name === 'AbortError') {
          console.error('Expenses API request timed out');
        }

        // Return empty data to prevent errors, but don't swallow the error
        // This allows SWR to retry the request
        throw error;
      }
    },
    'expenses',
    swrConfig
  );

  // Create a new expense with optimistic update
  const createExpense = async (expense: Partial<Expense>, payments: Partial<ExpensePayment>[] = [], notes: Partial<ExpenseNote>[] = []) => {
    // Check if already submitting to prevent duplicate submissions
    if (isSubmitting) {
      console.log('Already submitting in useExpensesList, ignoring duplicate request');
      return null;
    }

    // Set loading state to true
    setIsSubmitting(true);
    console.log('Setting isSubmitting to true for expense creation in useExpensesList');

    // Create a temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;

    // Log the expense category
    console.log('Category in useExpensesList:', expense.category);

    // Calculate payment-related values using utility functions
    const totalAmount = expense.total_amount || 0;
    const amountPaid = calculateAmountPaid(payments);
    const balance = calculateBalance(totalAmount, amountPaid);
    const paymentStatus = calculatePaymentStatus(totalAmount, amountPaid);

    // Create optimistic expense object
    const optimisticExpense: Expense = {
      id: tempId,
      category: expense.category === 'fixed' ? 'fixed' : 'variable',
      item_name: expense.item_name || '',
      quantity: expense.quantity || 1,
      unit_cost: expense.unit_cost || 0,
      total_amount: totalAmount,
      amount_paid: amountPaid,
      balance: balance,
      date: expense.date || new Date().toISOString(),
      payment_status: paymentStatus,
      is_recurring: expense.is_recurring || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      payments: payments.map(p => ({
        id: `temp-payment-${Date.now()}-${Math.random()}`,
        expense_id: tempId,
        amount: Number(p.amount) || 0,
        date: p.date || new Date().toISOString(),
        payment_method: p.payment_method || 'cash',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })) as ExpensePayment[],
      notes: notes.map(n => ({
        id: `temp-note-${Date.now()}-${Math.random()}`,
        linked_item_type: 'expense',
        linked_item_id: tempId,
        type: n.type || '',
        text: n.text || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })) as ExpenseNote[],
    };

    try {
      // Optimistically update the UI
      mutate(
        prev => {
          const updatedExpenses = prev ?
            {
              ...prev,
              expenses: [optimisticExpense, ...(prev.expenses || [])]
            } :
            {
              expenses: [optimisticExpense],
              count: 1,
              limit: 50,
              offset: 0
            };
          return updatedExpenses;
        },
        { revalidate: false } // Don't revalidate yet
      );

      // Make the actual API call
      console.log('Making API call to create expense...');
      const response = await fetch(API_ENDPOINTS.EXPENSES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expense, payments, notes }),
      });

      console.log('API response received, status:', response.status);
      const result = await response.json();
      console.log('API response parsed');

      if (!response.ok) {
        // Handle API error response
        if (result.error) {
          const errorMessage = typeof result.error === 'string'
            ? result.error
            : result.error.message || 'Failed to create expense';

          console.error('API Error:', result.error);
          throw new Error(errorMessage);
        } else {
          throw new Error(`Failed to create expense: ${response.status}`);
        }
      }

      console.log('API call successful, updating UI with real data');

      // Update with the real data from the server
      mutate(
        prev => {
          // Extract expense from the API response (which might be wrapped in a 'data' property)
          const expense = result.data?.expense || result.expense;

          if (!expense) {
            console.error('No expense found in API response:', result);
            return prev || { expenses: [], count: 0, limit: 50, offset: 0 };
          }

          if (!prev) return { expenses: [expense], count: 1, limit: 50, offset: 0 };

          const updatedExpenses = prev.expenses.map(exp =>
            exp.id === tempId ? expense : exp
          );

          return {
            ...prev,
            expenses: updatedExpenses,
            count: prev.count < 1 ? 1 : prev.count
          };
        },
        { revalidate: false } // No need to revalidate as we have the latest data
      );

      // Show success toast with the expense name for better user feedback
      const expenseName = result.expense?.item_name || 'New expense';
      toast.success('Expense Created', {
        description: `Created expense "${expenseName}" successfully`,
        duration: 4000,
      });

      console.log('Expense creation completed successfully');
      return result.expense;
    } catch (error) {
      console.error('Error creating expense:', error);

      // Revert the optimistic update
      mutate(
        prev => {
          if (!prev) return { expenses: [], count: 0, limit: 50, offset: 0 };

          return {
            ...prev,
            expenses: prev.expenses.filter(exp => exp.id !== tempId),
            count: prev.count > 0 ? prev.count - 1 : 0
          };
        },
        { revalidate: true } // Revalidate to ensure we have the correct data
      );

      // Improved error handling
      let errorMessage = 'Failed to create expense';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      }

      // Show error toast with more details
      toast.error('Error Creating Expense', {
        description: errorMessage,
        duration: 5000,
      });

      console.error('Expense creation failed with error:', errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update an expense with optimistic update
  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    // Check if already submitting to prevent duplicate submissions
    if (isSubmitting) {
      console.log('Already submitting in useExpensesList, ignoring duplicate request');
      return null;
    }

    // Set loading state to true
    setIsSubmitting(true);
    console.log('Setting isSubmitting to true for expense update in useExpensesList');

    try {
      // Find the current expense in the cache
      const currentData = data || { expenses: [], count: 0, limit: 50, offset: 0 };
      const currentExpense = currentData.expenses.find(exp => exp.id === id);

      if (!currentExpense) {
        console.error('Expense not found in cache, id:', id);
        throw new Error('Expense not found in cache');
      }

      console.log('Found expense in cache, preparing optimistic update');

      // Create optimistic expense object
      const optimisticExpense: Expense = {
        ...currentExpense,
        ...expense,
        updated_at: new Date().toISOString()
      };

      // Optimistically update the UI
      mutate(
        prev => {
          if (!prev) return currentData;

          const updatedExpenses = prev.expenses.map(exp =>
            exp.id === id ? optimisticExpense : exp
          );

          return {
            ...prev,
            expenses: updatedExpenses
          };
        },
        { revalidate: false } // Don't revalidate yet
      );

      // Make the actual API call
      console.log('Making API call to update expense...');
      const response = await fetch(`${API_ENDPOINTS.EXPENSES}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expense }),
      });

      console.log('API response received, status:', response.status);
      const result = await response.json();
      console.log('API response parsed');

      if (!response.ok) {
        console.error('API error updating expense:', result.error);
        throw new Error(result.error || 'Failed to update expense');
      }

      console.log('API call successful, updating UI with real data');

      // Update with the real data from the server
      mutate(
        prev => {
          // Extract expense from the API response (which might be wrapped in a 'data' property)
          const expense = result.data?.expense || result.expense;

          if (!expense) {
            console.error('No expense found in API response:', result);
            return prev || currentData;
          }

          if (!prev) return currentData;

          const updatedExpenses = prev.expenses.map(exp =>
            exp.id === id ? expense : exp
          );

          return {
            ...prev,
            expenses: updatedExpenses
          };
        },
        { revalidate: false } // No need to revalidate as we have the latest data
      );

      // Show success toast with the expense name for better user feedback
      const expenseName = result.expense?.item_name || 'Expense';
      toast.success('Expense Updated', {
        description: `Updated expense "${expenseName}" successfully`,
        duration: 4000,
      });

      console.log('Expense update completed successfully');
      return result.expense;
    } catch (error) {
      console.error('Error updating expense:', error);

      // Revert the optimistic update by revalidating
      console.log('Reverting optimistic update due to error');
      mutate();

      // Improved error handling
      let errorMessage = 'Failed to update expense';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        try {
          errorMessage = JSON.stringify(error);
        } catch (e) {
          console.error('Error stringifying error object:', e);
        }
      }

      // Show error toast with more details
      toast.error('Error Updating Expense', {
        description: errorMessage,
        duration: 5000,
      });

      console.error('Expense update failed with error:', errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete an expense with optimistic update
  const deleteExpense = async (id: string) => {
    // Check if already submitting to prevent duplicate submissions
    if (isSubmitting) {
      console.log('Already submitting, ignoring duplicate request');
      return null;
    }

    // Set loading state to true
    setIsSubmitting(true);
    console.log('Setting isSubmitting to true for expense deletion');

    let optimisticUpdateApplied = false;
    let deletedExpense: Expense | undefined;

    try {
      // Find the current data in the cache
      const currentData = data || { expenses: [], count: 0, limit: 50, offset: 0 };

      // Find the expense to be deleted (for notification purposes)
      deletedExpense = currentData.expenses.find(exp => exp.id === id);

      // Optimistically update the UI
      mutate(
        prev => {
          if (!prev) return currentData;

          // Mark that we've applied an optimistic update
          optimisticUpdateApplied = true;

          const updatedExpenses = prev.expenses.filter(exp => exp.id !== id);

          return {
            ...prev,
            expenses: updatedExpenses,
            count: prev.count > 0 ? prev.count - 1 : 0
          };
        },
        { revalidate: false } // Don't revalidate yet
      );

      // Make the actual API call
      logDebug(`Attempting to delete expense with ID: ${id}`);

      const response = await fetch(`${API_ENDPOINTS.EXPENSES}/${id}`, {
        method: 'DELETE',
      });

      logDebug(`Delete API response status: ${response.status}`);

      const result = await response.json();

      logDebug(`Delete API response data:`, result);

      if (!response.ok) {
        console.error(`Error deleting expense: ${result.error || 'Unknown error'}`);
        throw new Error(result.error || 'Failed to delete expense');
      }

      logDebug(`Successfully deleted expense with ID: ${id}`);

      // No need to revalidate or refetch data since we've already
      // optimistically updated the UI and the deletion was successful.
      // The optimistic update we did earlier is sufficient.
      logDebug(`Using optimistic update only, no refetching needed`);

      // Show success notification
      const { showExpenseDeletionNotification } = await import('@/utils/expense-notifications');
      showExpenseDeletionNotification(
        true, // success
        deletedExpense?.item_name || id.substring(0, 8)
      );

      return result;
    } catch (error) {
      console.error('Error deleting expense:', error);

      // If there's an error and we applied an optimistic update, revalidate to restore the data
      if (optimisticUpdateApplied) {
        mutate();
      }

      // Show error notification
      const { showExpenseDeletionNotification } = await import('@/utils/expense-notifications');
      showExpenseDeletionNotification(
        false, // error
        deletedExpense?.item_name || id.substring(0, 8),
        error instanceof Error ? error.message : 'Failed to delete expense'
      );

      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ensure we have valid data with proper fallbacks
  const safeData = data || { expenses: [], count: 0, limit: 50, offset: 0 };

  // Log any errors for debugging
  useEffect(() => {
    if (error) {
      console.error('Error in useExpensesList:', error);
    }
  }, [error]);

  // Ensure expenses is an array
  const safeExpenses = Array.isArray(safeData.expenses) ? safeData.expenses : [];

  // If disabled, return empty data with disabled operations
  if (disabled) {
    return {
      expenses: [],
      count: 0,
      limit: 50,
      offset: 0,
      isLoading: false,
      isError: false,
      isEmpty: true,
      isSubmitting: false,
      // Provide no-op functions that log warnings when called
      mutate: () => Promise.resolve(),
      createExpense: async () => {
        console.warn('Data fetching is disabled');
        return Promise.reject(new Error('Data fetching is disabled'));
      },
      updateExpense: async () => {
        console.warn('Data fetching is disabled');
        return Promise.reject(new Error('Data fetching is disabled'));
      },
      deleteExpense: async () => {
        console.warn('Data fetching is disabled');
        return Promise.reject(new Error('Data fetching is disabled'));
      },
    };
  }

  // Return normal data and operations when not disabled
  return {
    expenses: safeExpenses,
    count: safeData.count || 0,
    limit: safeData.limit || 50,
    offset: safeData.offset || 0,
    isLoading,
    isError: !!error,
    isEmpty: !safeExpenses.length,
    isSubmitting,
    mutate,
    createExpense,
    updateExpense,
    deleteExpense,
  };
}
