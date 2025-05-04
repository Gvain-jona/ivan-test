import { useState } from 'react';
import { useLoadingSWR } from '../useLoadingSWR';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import { toast } from 'sonner';
import { ExpenseNote, ExpensePayment } from './types';
import { createSWRConfig } from '@/lib/swr-config';
import { EXPENSE_SWR_CONFIG } from './useExpensesList';

/**
 * Hook to fetch a single expense by ID
 */
export function useExpenseDetails(id?: string) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create a standardized SWR config for detail data
  const swrConfig = createSWRConfig('detail', EXPENSE_SWR_CONFIG);

  // Fetch expense with improved error handling
  const { data, error, isLoading, mutate } = useLoadingSWR(
    id ? `${API_ENDPOINTS.EXPENSES}/${id}` : null,
    async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch expense: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error(`Error fetching expense ${id}:`, error);
        throw error;
      }
    },
    `expense-${id}`,
    swrConfig
  );

  // Add a payment to the expense
  const addPayment = async (payment: Partial<ExpensePayment>) => {
    if (!id) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.EXPENSES}/${id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payment }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add payment');
      }

      // Refresh the expense
      mutate();
      toast.success('Payment added successfully');
      return result;
    } catch (error) {
      console.error('Error adding payment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add payment');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update a payment
  const updatePayment = async (paymentId: string, payment: Partial<ExpensePayment>) => {
    if (!id) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.EXPENSES}/${id}/payments`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payment, paymentId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update payment');
      }

      // Refresh the expense
      mutate();
      toast.success('Payment updated successfully');
      return result;
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update payment');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a payment
  const deletePayment = async (paymentId: string) => {
    if (!id) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.EXPENSES}/${id}/payments?paymentId=${paymentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete payment');
      }

      // Refresh the expense
      mutate();
      toast.success('Payment deleted successfully');
      return result;
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete payment');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add a note to the expense
  const addNote = async (note: Partial<ExpenseNote>) => {
    if (!id) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.EXPENSES}/${id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add note');
      }

      // Refresh the expense
      mutate();
      toast.success('Note added successfully');
      return result;
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add note');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update a note
  const updateNote = async (noteId: string, note: Partial<ExpenseNote>) => {
    if (!id) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.EXPENSES}/${id}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note, noteId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update note');
      }

      // Refresh the expense
      mutate();
      toast.success('Note updated successfully');
      return result;
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update note');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a note
  const deleteNote = async (noteId: string) => {
    if (!id) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.EXPENSES}/${id}/notes?noteId=${noteId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete note');
      }

      // Refresh the expense
      mutate();
      toast.success('Note deleted successfully');
      return result;
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete note');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    expense: data?.expense,
    isLoading,
    isError: !!error,
    isEmpty: !data?.expense,
    isSubmitting,
    mutate,
    addPayment,
    updatePayment,
    deletePayment,
    addNote,
    updateNote,
    deleteNote,
  };
}
