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

  const disabled = filters === null;

  const queryParams = new URLSearchParams();

  if (filters?.category && filters.category.length > 0) {
    filters.category.forEach(cat => queryParams.append('category', cat));
  }

  if (filters?.paymentStatus && filters.paymentStatus.length > 0) {
    filters.paymentStatus.forEach(status => queryParams.append('paymentStatus', status));
  }

  if (filters?.is_recurring !== undefined) {
    queryParams.append('is_recurring', filters.is_recurring.toString());
  }

  if (filters?.startDate) queryParams.append('startDate', filters.startDate);
  if (filters?.endDate) queryParams.append('endDate', filters.endDate);
  if (filters?.search) queryParams.append('search', filters.search);
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  if (filters?.offset) queryParams.append('offset', filters.offset.toString());

  const queryString = queryParams.toString();
  const url = disabled || !API_ENDPOINTS.EXPENSES ? null :
    (queryString ? `${API_ENDPOINTS.EXPENSES}?${queryString}` : API_ENDPOINTS.EXPENSES);

  const swrConfig = {
    ...EXPENSE_SWR_CONFIG,
    fallbackData: { expenses: [], count: 0, limit: 50, offset: 0 },
    dedupingInterval: 60 * 1000,
    errorRetryCount: 3,
    errorRetryInterval: 2000,
    keepPreviousData: true,
  };

  const { data, error, isLoading, mutate } = useLoadingSWR(
    url,
    async (url) => {
      const startTime = Date.now();
      try {
        logDebug('Fetching expenses with filters:', filters);

        if (!url) {
          return { expenses: [], count: 0, limit: 50, offset: 0 };
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
          const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'Cache-Control': 'max-age=300' }
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Failed to fetch expenses: ${response.status}`);
          }

          const result = await response.json();

          if (!result || typeof result !== 'object') {
            return { expenses: [], count: 0, limit: 50, offset: 0 };
          }

          const responseData = result.data || result;

          if (!responseData.expenses) {
            responseData.expenses = [];
          } else if (!Array.isArray(responseData.expenses)) {
            responseData.expenses = [];
          }

          return {
            expenses: responseData.expenses || [],
            count: responseData.count || 0,
            limit: responseData.limit || 50,
            offset: responseData.offset || 0
          };
        } catch (fetchError) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
      } catch (error) {
        const endTime = Date.now();
        console.error(`Error in expenses fetcher after ${endTime - startTime}ms:`, error);

        if ((error as any).name === 'AbortError') {
          console.error('Expenses API request timed out');
        }

        throw error;
      }
    },
    'expenses',
    swrConfig
  );

  const createExpense = async (expense: Partial<Expense>, payments: Partial<ExpensePayment>[] = [], notes: Partial<ExpenseNote>[] = []) => {
    if (isSubmitting) return null;

    setIsSubmitting(true);

    const tempId = `temp-${Date.now()}`;

    const totalAmount = expense.total_amount || 0;
    const amountPaid = calculateAmountPaid(payments);
    const balance = calculateBalance(totalAmount, amountPaid);
    const paymentStatus = calculatePaymentStatus(totalAmount, amountPaid);

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
      mutate(
        prev => {
          const updatedExpenses = prev ?
            { ...prev, expenses: [optimisticExpense, ...(prev.expenses || [])] } :
            { expenses: [optimisticExpense], count: 1, limit: 50, offset: 0 };
          return updatedExpenses;
        },
        { revalidate: false }
      );

      const response = await fetch(API_ENDPOINTS.EXPENSES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expense, payments, notes }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = typeof result.error === 'string'
          ? result.error
          : result.error?.message || 'Failed to create expense';
        throw new Error(errorMessage);
      }

      mutate(
        prev => {
          const createdExpense = result.data?.expense || result.expense;

          if (!createdExpense) {
            console.error('No expense found in API response:', result);
            return prev || { expenses: [], count: 0, limit: 50, offset: 0 };
          }

          if (!prev) return { expenses: [createdExpense], count: 1, limit: 50, offset: 0 };

          const updatedExpenses = prev.expenses.map(exp =>
            exp.id === tempId ? createdExpense : exp
          );

          return { ...prev, expenses: updatedExpenses, count: prev.count < 1 ? 1 : prev.count };
        },
        { revalidate: false }
      );

      const expenseName = result.expense?.item_name || 'New expense';
      toast.success('Expense Created', {
        description: `Created expense "${expenseName}" successfully`,
        duration: 4000,
      });

      return result.expense;
    } catch (error) {
      console.error('Error creating expense:', error);

      mutate(
        prev => {
          if (!prev) return { expenses: [], count: 0, limit: 50, offset: 0 };
          return {
            ...prev,
            expenses: prev.expenses.filter(exp => exp.id !== tempId),
            count: prev.count > 0 ? prev.count - 1 : 0
          };
        },
        { revalidate: true }
      );

      let errorMessage = 'Failed to create expense';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      }

      toast.error('Error Creating Expense', { description: errorMessage, duration: 5000 });
      throw new Error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    if (isSubmitting) return null;

    setIsSubmitting(true);

    try {
      const currentData = data || { expenses: [], count: 0, limit: 50, offset: 0 };
      const currentExpense = currentData.expenses.find(exp => exp.id === id);

      if (!currentExpense) {
        throw new Error('Expense not found in cache');
      }

      const optimisticExpense: Expense = {
        ...currentExpense,
        ...expense,
        updated_at: new Date().toISOString()
      };

      mutate(
        prev => {
          if (!prev) return currentData;
          const updatedExpenses = prev.expenses.map(exp => exp.id === id ? optimisticExpense : exp);
          return { ...prev, expenses: updatedExpenses };
        },
        { revalidate: false }
      );

      const response = await fetch(`${API_ENDPOINTS.EXPENSES}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expense }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('API error updating expense:', result.error);
        throw new Error(result.error || 'Failed to update expense');
      }

      mutate(
        prev => {
          const updatedExpense = result.data?.expense || result.expense;

          if (!updatedExpense) {
            console.error('No expense found in API response:', result);
            return prev || currentData;
          }

          if (!prev) return currentData;

          const updatedExpenses = prev.expenses.map(exp => exp.id === id ? updatedExpense : exp);
          return { ...prev, expenses: updatedExpenses };
        },
        { revalidate: false }
      );

      const expenseName = result.expense?.item_name || 'Expense';
      toast.success('Expense Updated', {
        description: `Updated expense "${expenseName}" successfully`,
        duration: 4000,
      });

      return result.expense;
    } catch (error) {
      console.error('Error updating expense:', error);
      mutate();

      let errorMessage = 'Failed to update expense';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        try {
          errorMessage = JSON.stringify(error);
        } catch (e) {
          // ignore
        }
      }

      toast.error('Error Updating Expense', { description: errorMessage, duration: 5000 });
      throw new Error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteExpense = async (id: string) => {
    if (isSubmitting) return null;

    setIsSubmitting(true);

    let optimisticUpdateApplied = false;
    let deletedExpense: Expense | undefined;

    try {
      const currentData = data || { expenses: [], count: 0, limit: 50, offset: 0 };
      deletedExpense = currentData.expenses.find(exp => exp.id === id);

      mutate(
        prev => {
          if (!prev) return currentData;
          optimisticUpdateApplied = true;
          const updatedExpenses = prev.expenses.filter(exp => exp.id !== id);
          return { ...prev, expenses: updatedExpenses, count: prev.count > 0 ? prev.count - 1 : 0 };
        },
        { revalidate: false }
      );

      logDebug(`Attempting to delete expense with ID: ${id}`);

      const response = await fetch(`${API_ENDPOINTS.EXPENSES}/${id}`, { method: 'DELETE' });
      const result = await response.json();

      if (!response.ok) {
        console.error(`Error deleting expense: ${result.error || 'Unknown error'}`);
        throw new Error(result.error || 'Failed to delete expense');
      }

      const { showExpenseDeletionNotification } = await import('@/utils/expense-notifications');
      showExpenseDeletionNotification(true, deletedExpense?.item_name || id.substring(0, 8));

      return result;
    } catch (error) {
      console.error('Error deleting expense:', error);

      if (optimisticUpdateApplied) mutate();

      const { showExpenseDeletionNotification } = await import('@/utils/expense-notifications');
      showExpenseDeletionNotification(
        false,
        deletedExpense?.item_name || id.substring(0, 8),
        error instanceof Error ? error.message : 'Failed to delete expense'
      );

      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const safeData = data || { expenses: [], count: 0, limit: 50, offset: 0 };

  useEffect(() => {
    if (error) console.error('Error in useExpensesList:', error);
  }, [error]);

  const safeExpenses = Array.isArray(safeData.expenses) ? safeData.expenses : [];

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
      mutate: () => Promise.resolve(),
      createExpense: async () => Promise.reject(new Error('Data fetching is disabled')),
      updateExpense: async () => Promise.reject(new Error('Data fetching is disabled')),
      deleteExpense: async () => Promise.reject(new Error('Data fetching is disabled')),
    };
  }

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
