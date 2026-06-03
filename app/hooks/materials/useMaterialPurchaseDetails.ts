/**
 * Material Purchase Details Hook
 * Hook for fetching and managing a single material purchase with all related data
 */

import { useState, useCallback } from 'react';
import { useLoadingSWR } from '../useLoadingSWR';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import { SWR_CACHE_TIMES, SWR_RETRY } from '@/lib/swr-config';
import { toast } from 'sonner';
import { createMaterialSWRConfig } from './swr-config';
import {
  MaterialPayment,
  MaterialNote,
  MaterialInstallment,
  MaterialPurchaseResponse,
  MaterialPaymentFormData,
  MaterialNoteFormData
} from '@/types/materials';

/**
 * Hook for fetching and managing a single material purchase with all related data
 * @param id The ID of the material purchase to fetch
 */
export function useMaterialPurchaseDetails(id?: string) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper function to fetch from regular endpoint as fallback
  const fetchFromRegularEndpoint = async (purchaseId: string): Promise<MaterialPurchaseResponse> => {
    console.log('Attempting to fetch from regular endpoint...');

    try {
      // Fetch the main purchase data
      const purchaseResponse = await fetch(`${API_ENDPOINTS.MATERIALS}/${purchaseId}`);

      if (!purchaseResponse.ok) {
        throw new Error(`Failed to fetch purchase from regular endpoint: ${purchaseResponse.status}`);
      }

      const purchaseResult = await purchaseResponse.json();
      const purchaseData = purchaseResult.data?.purchase || purchaseResult.purchase;

      if (!purchaseData) {
        throw new Error('No purchase data returned from regular endpoint');
      }

      // Fetch related data in parallel
      const [paymentsResponse, notesResponse, installmentsResponse] = await Promise.all([
        fetch(`${API_ENDPOINTS.MATERIALS}/${purchaseId}/payments`),
        fetch(`${API_ENDPOINTS.MATERIALS}/${purchaseId}/notes`),
        fetch(`${API_ENDPOINTS.MATERIALS}/${purchaseId}/installments`)
      ]);

      // Process payments
      let payments: MaterialPayment[] = [];
      if (paymentsResponse.ok) {
        const paymentsResult = await paymentsResponse.json();
        payments = paymentsResult.data?.payments || paymentsResult.payments || [];
      }

      // Process notes
      let notes: MaterialNote[] = [];
      if (notesResponse.ok) {
        const notesResult = await notesResponse.json();
        notes = notesResult.data?.notes || notesResult.notes || [];
      }

      // Process installments
      let installments: MaterialInstallment[] = [];
      if (installmentsResponse.ok) {
        const installmentsResult = await installmentsResponse.json();
        installments = installmentsResult.data?.installments || installmentsResult.installments || [];
      }

      // Combine all data
      const combinedPurchase = {
        ...purchaseData,
        payments,
        purchase_notes: notes,
        installments
      };

      console.log('Successfully fetched from regular endpoint with combined data');

      return { purchase: combinedPurchase };
    } catch (error) {
      console.error('Error in fetchFromRegularEndpoint:', error);
      throw error;
    }
  };

  // Use our standardized SWR config with improved settings
  const swrConfig = {
    ...createMaterialSWRConfig('detail'),
    // Improve revalidation settings
    revalidateOnFocus: true,
    revalidateIfStale: true,
    revalidateOnReconnect: true,
    errorRetryCount: SWR_RETRY.DEFAULT_COUNT,
    dedupingInterval: SWR_CACHE_TIMES.LIST_DEDUPE
  };

  // Create a cache key
  const cacheKey = id ? `material-purchase-${id}` : null;

  // Build query string for optimized endpoint
  const queryParams = new URLSearchParams();
  queryParams.append('include_payments', 'true');
  queryParams.append('include_notes', 'true');
  queryParams.append('include_installments', 'true');

  // Fetch material purchase with standardized error handling using the optimized endpoint
  const { data, error, isLoading, mutate } = useLoadingSWR<MaterialPurchaseResponse>(
    id ? `${API_ENDPOINTS.MATERIALS}/${id}/optimized?${queryParams.toString()}` : null,
    async (url) => {
      try {
        console.log('Fetching material purchase from optimized endpoint:', url);
        const response = await fetch(url);

        if (!response.ok) {
          console.warn(`Optimized endpoint failed: ${response.status}. Falling back to regular endpoint.`);
          // Try fallback to regular endpoint
          return await fetchFromRegularEndpoint(id!);
        }

        const result = await response.json();

        // Ensure the result has the expected structure
        if (!result || typeof result !== 'object') {
          console.warn('Invalid response structure from optimized endpoint. Falling back to regular endpoint.');
          return await fetchFromRegularEndpoint(id!);
        }

        // The API wraps the response in a 'data' property
        const responseData = result.data || result;

        console.log('Material purchase data from optimized endpoint:', responseData);

        // Ensure the purchase has all required arrays
        const purchase = responseData.purchase || null;
        if (purchase) {
          purchase.payments = Array.isArray(purchase.payments) ? purchase.payments : [];
          purchase.purchase_notes = Array.isArray(purchase.purchase_notes) ? purchase.purchase_notes : [];
          purchase.installments = Array.isArray(purchase.installments) ? purchase.installments : [];
        }

        return { purchase };
      } catch (error) {
        // Log error in development only
        if (process.env.NODE_ENV === 'development') {
          console.error(`Error fetching material purchase ${id}:`, error);
        }

        // Try fallback to regular endpoint
        try {
          console.warn('Error with optimized endpoint. Falling back to regular endpoint.');
          return await fetchFromRegularEndpoint(id!);
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          // Throw the original error to be handled by SWR's error boundary
          throw error;
        }
      }
    },
    cacheKey,
    swrConfig
  );

  /**
   * Add a payment to a material purchase with optimistic update
   * @param paymentData The payment data to add
   */
  const addPayment = useCallback(async (paymentData: MaterialPaymentFormData) => {
    if (!id) throw new Error('Material purchase ID is required');

    setIsSubmitting(true);

    try {
      // Create an optimistic payment object
      const optimisticPayment: MaterialPayment = {
        id: 'temp-' + Date.now(),
        purchase_id: id,
        amount: paymentData.amount || 0,
        date: paymentData.date || new Date().toISOString(),
        payment_method: paymentData.payment_method || 'cash',
        notes: paymentData.notes,
        created_by: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Calculate new amount paid and payment status
      const currentPurchase = data?.purchase;
      if (!currentPurchase) throw new Error('Material purchase not found');

      const newAmountPaid = currentPurchase.amount_paid + (paymentData.amount || 0);
      const newPaymentStatus =
        newAmountPaid >= currentPurchase.total_amount
          ? 'paid'
          : newAmountPaid > 0
            ? 'partially_paid'
            : 'unpaid';

      // Optimistically update the UI
      mutate(prevData => {
        if (!prevData || !prevData.purchase) return prevData;

        const updatedPurchase = {
          ...prevData.purchase,
          amount_paid: newAmountPaid,
          payment_status: newPaymentStatus,
          balance: prevData.purchase.total_amount - newAmountPaid,
          payments: [...(prevData.purchase.payments || []), optimisticPayment]
        };

        return {
          ...prevData,
          purchase: updatedPurchase
        };
      }, false);

      // Make the API request
      const response = await fetch(`${API_ENDPOINTS.MATERIALS}/${id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payment: paymentData }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to add payment');
      }

      // Update with the real data
      mutate();

      // Show success message
      toast.success('Payment added successfully');

      return result.data?.payment || result.payment;
    } catch (error: any) {
      // Log error in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Error adding payment:', error);
      }

      // Revert optimistic update
      mutate();

      // Show error message
      toast.error(error.message || 'Failed to add payment');

      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [id, data, mutate]);

  /**
   * Delete a payment from a material purchase with optimistic update
   * @param paymentId The ID of the payment to delete
   */
  const deletePayment = useCallback(async (paymentId: string) => {
    if (!id) throw new Error('Material purchase ID is required');

    setIsSubmitting(true);

    try {
      // Find the current purchase and payment
      const currentPurchase = data?.purchase;
      if (!currentPurchase) throw new Error('Material purchase not found');

      const payment = currentPurchase.payments?.find(p => p.id === paymentId);
      if (!payment) throw new Error('Payment not found');

      // Calculate new amount paid and payment status
      const newAmountPaid = currentPurchase.amount_paid - payment.amount;
      const newPaymentStatus =
        newAmountPaid >= currentPurchase.total_amount
          ? 'paid'
          : newAmountPaid > 0
            ? 'partially_paid'
            : 'unpaid';

      // Optimistically update the UI
      mutate(prevData => {
        if (!prevData || !prevData.purchase) return prevData;

        const updatedPurchase = {
          ...prevData.purchase,
          amount_paid: newAmountPaid,
          payment_status: newPaymentStatus,
          balance: prevData.purchase.total_amount - newAmountPaid,
          payments: prevData.purchase.payments?.filter(p => p.id !== paymentId) || []
        };

        return {
          ...prevData,
          purchase: updatedPurchase
        };
      }, false);

      // Make the API request
      const response = await fetch(`${API_ENDPOINTS.MATERIALS}/${id}/payments?paymentId=${paymentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || 'Failed to delete payment');
      }

      // Update with the real data
      mutate();

      // Show success message
      toast.success('Payment deleted successfully');

      return true;
    } catch (error: any) {
      // Log error in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting payment:', error);
      }

      // Revert optimistic update
      mutate();

      // Show error message
      toast.error(error.message || 'Failed to delete payment');

      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [id, data, mutate]);

  /**
   * Add a note to a material purchase with optimistic update
   * @param noteData The note data to add
   */
  const addNote = useCallback(async (noteData: MaterialNoteFormData) => {
    if (!id) throw new Error('Material purchase ID is required');

    setIsSubmitting(true);

    try {
      // Create an optimistic note object
      const optimisticNote: MaterialNote = {
        id: 'temp-' + Date.now(),
        purchase_id: id,
        type: noteData.type || 'general',
        text: noteData.text || '',
        created_by: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Optimistically update the UI
      mutate(prevData => {
        if (!prevData || !prevData.purchase) return prevData;

        const updatedPurchase = {
          ...prevData.purchase,
          purchase_notes: [...(prevData.purchase.purchase_notes || []), optimisticNote]
        };

        return {
          ...prevData,
          purchase: updatedPurchase
        };
      }, false);

      // Make the API request
      const response = await fetch(`${API_ENDPOINTS.MATERIALS}/${id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note: noteData }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to add note');
      }

      // Update with the real data
      mutate();

      // Show success message
      toast.success('Note added successfully');

      return result.data?.note || result.note;
    } catch (error: any) {
      // Log error in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Error adding note:', error);
      }

      // Revert optimistic update
      mutate();

      // Show error message
      toast.error(error.message || 'Failed to add note');

      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [id, mutate]);

  /**
   * Delete a note from a material purchase with optimistic update
   * @param noteId The ID of the note to delete
   */
  const deleteNote = useCallback(async (noteId: string) => {
    if (!id) throw new Error('Material purchase ID is required');

    setIsSubmitting(true);

    try {
      // Optimistically update the UI
      mutate(prevData => {
        if (!prevData || !prevData.purchase) return prevData;

        const updatedPurchase = {
          ...prevData.purchase,
          purchase_notes: prevData.purchase.purchase_notes?.filter(n => n.id !== noteId) || []
        };

        return {
          ...prevData,
          purchase: updatedPurchase
        };
      }, false);

      // Make the API request
      const response = await fetch(`${API_ENDPOINTS.MATERIALS}/${id}/notes?noteId=${noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || 'Failed to delete note');
      }

      // Update with the real data
      mutate();

      // Show success message
      toast.success('Note deleted successfully');

      return true;
    } catch (error: any) {
      // Log error in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting note:', error);
      }

      // Revert optimistic update
      mutate();

      // Show error message
      toast.error(error.message || 'Failed to delete note');

      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [id, mutate]);

  /**
   * Create an installment plan for a material purchase
   * @param installmentData The installment plan data
   */
  const createInstallmentPlan = useCallback(async (installmentData: {
    total_installments: number;
    payment_frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
    first_payment_date: string;
    reminder_days?: number;
  }) => {
    if (!id) throw new Error('Material purchase ID is required');

    setIsSubmitting(true);

    try {
      // Make the API request
      const response = await fetch(`${API_ENDPOINTS.MATERIALS}/${id}/installments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ installment_plan: installmentData }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to create installment plan');
      }

      // Update with the real data
      mutate();

      // Show success message
      toast.success('Installment plan created successfully');

      return result.data?.installments || result.installments;
    } catch (error: any) {
      // Log error in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating installment plan:', error);
      }

      // Show error message
      toast.error(error.message || 'Failed to create installment plan');

      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [id, mutate]);

  /**
   * Update an installment in a material purchase
   * @param installmentId The ID of the installment to update
   * @param installmentData The updated installment data
   */
  const updateInstallment = useCallback(async (installmentId: string, installmentData: {
    status: 'pending' | 'paid' | 'overdue';
    payment_id?: string;
  }) => {
    if (!id) throw new Error('Material purchase ID is required');

    setIsSubmitting(true);

    try {
      // Make the API request
      const response = await fetch(`${API_ENDPOINTS.MATERIALS}/${id}/installments/${installmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ installment: installmentData }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to update installment');
      }

      // Update with the real data
      mutate();

      // Show success message
      toast.success('Installment updated successfully');

      return result.data?.installment || result.installment;
    } catch (error: any) {
      // Log error in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating installment:', error);
      }

      // Revert optimistic update
      mutate();

      // Show error message
      toast.error(error.message || 'Failed to update installment');

      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [id, mutate]);

  return {
    purchase: data?.purchase,
    isLoading,
    isError: !!error,
    isSubmitting,
    mutate,
    addPayment,
    deletePayment,
    addNote,
    deleteNote,
    createInstallmentPlan,
    updateInstallment
  };
}
