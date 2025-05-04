/**
 * Material Purchases Hooks
 * This file provides hooks for managing material purchases
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useLoadingSWR } from '../useLoadingSWR';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { createMaterialSWRConfig } from './swr-config';
import {
  MaterialPurchase,
  MaterialPayment,
  MaterialNote,
  MaterialInstallment,
  MaterialPurchaseFilters,
  PaginationParams,
  MaterialPurchasesResponse,
  MaterialPurchaseResponse,
  MaterialPaymentFormData,
  MaterialNoteFormData
} from '@/types/materials';

/**
 * Hook for fetching and managing material purchases list
 * @param filters Optional filters for the material purchases
 * @param pagination Pagination parameters
 * @param options Additional options for data fetching
 */
export function useMaterialPurchasesList(
  filters: MaterialPurchaseFilters = {},
  pagination: PaginationParams = { page: 1, limit: 10 },
  options = { includePayments: true, includeNotes: true, includeInstallments: true }
) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Build query string
  const queryParams = new URLSearchParams();
  queryParams.append('page', pagination.page.toString());
  queryParams.append('limit', pagination.limit.toString());

  // Add filters to query string
  if (filters.supplier) queryParams.append('supplier', filters.supplier);
  if (filters.startDate) queryParams.append('start_date', filters.startDate);
  if (filters.endDate) queryParams.append('end_date', filters.endDate);
  if (filters.paymentStatus) queryParams.append('payment_status', filters.paymentStatus);

  // Add options to query string
  if (options.includePayments) queryParams.append('include_payments', 'true');
  if (options.includeNotes) queryParams.append('include_notes', 'true');
  if (options.includeInstallments) queryParams.append('include_installments', 'true');

  // Create the URL
  const url = `${API_ENDPOINTS.MATERIALS}/optimized?${queryParams.toString()}`;

  // Create a cache key for SWR
  const cacheKey = `material-purchases-list-${queryParams.toString()}`;

  // Use our standardized SWR config with improved settings for initial load
  const swrConfig = {
    ...createMaterialSWRConfig('list'),
    // Improve revalidation settings to ensure data is loaded on initial render
    revalidateOnFocus: true,
    revalidateIfStale: true,
    revalidateOnReconnect: true,
    // Reduce deduping interval to ensure fresher data
    dedupingInterval: 5 * 60 * 1000, // 5 minutes
    // Add a fallback to ensure we always have data
    fallbackData: { purchases: [], total: 0, page: 1, limit: 10 }
  };

  // Fetch material purchases with standardized error handling
  const { data, error, isLoading, mutate } = useLoadingSWR<MaterialPurchasesResponse>(
    url,
    async (url) => {
      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch material purchases: ${response.status}`);
        }

        const result = await response.json();

        // Ensure the result has the expected structure
        if (!result || typeof result !== 'object') {
          return { purchases: [], total: 0, page: 1, limit: 10 };
        }

        // The API wraps the response in a 'data' property
        const responseData = result.data || result;

        // Ensure purchases is an array
        if (!responseData.purchases) {
          responseData.purchases = [];
        } else if (!Array.isArray(responseData.purchases)) {
          responseData.purchases = [];
        }

        return {
          purchases: responseData.purchases || [],
          total: responseData.total || 0,
          page: responseData.page || 1,
          limit: responseData.limit || 10
        };
      } catch (error) {
        // Log error in development only
        if (process.env.NODE_ENV === 'development') {
          console.error('Error in material purchases fetcher:', error);
        }
        // Throw the error to be handled by SWR's error boundary
        throw error;
      }
    },
    cacheKey,
    swrConfig
  );

  /**
   * Create a new material purchase with optimistic update
   * @param purchaseData The material purchase data to create
   */
  const createMaterialPurchase = useCallback(async (purchaseData: Partial<MaterialPurchase>) => {
    setIsSubmitting(true);

    try {
      // Create a temporary ID for optimistic update
      const tempId = uuidv4();

      // Create an optimistic purchase object
      const optimisticPurchase: MaterialPurchase = {
        id: tempId,
        supplier_name: purchaseData.supplier_name || '',
        material_name: purchaseData.material_name || '',
        date: purchaseData.date || new Date().toISOString(),
        quantity: purchaseData.quantity || 0,
        total_amount: purchaseData.total_amount || 0,
        amount_paid: purchaseData.amount_paid || 0,
        balance: (purchaseData.total_amount || 0) - (purchaseData.amount_paid || 0),
        payment_status: (purchaseData.amount_paid || 0) >= (purchaseData.total_amount || 0)
          ? 'paid'
          : (purchaseData.amount_paid || 0) > 0
            ? 'partially_paid'
            : 'unpaid',
        created_by: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        installment_plan: purchaseData.installment_plan || false,
        total_installments: purchaseData.total_installments,
        installments_paid: 0,
        next_payment_date: purchaseData.next_payment_date,
        payment_frequency: purchaseData.payment_frequency,
        reminder_days: purchaseData.reminder_days,
        payments: [],
        installments: [],
        purchase_notes: []
      };

      // Optimistically update the UI
      mutate(prevData => {
        if (!prevData) return { purchases: [optimisticPurchase], total: 1, page: 1, limit: 10 };

        return {
          ...prevData,
          purchases: [optimisticPurchase, ...prevData.purchases],
          total: prevData.total + 1
        };
      }, false);

      // Make the API request
      const response = await fetch(API_ENDPOINTS.MATERIALS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to create material purchase');
      }

      // Update with the real data
      mutate();

      // Show success message
      toast.success('Material purchase created successfully');

      return result.data?.purchase || result.purchase;
    } catch (error: any) {
      // Log error in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating material purchase:', error);
      }

      // Revert optimistic update
      mutate();

      // Show error message
      toast.error(error.message || 'Failed to create material purchase');

      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [mutate]);

  /**
   * Update an existing material purchase with optimistic update
   * @param id The ID of the material purchase to update
   * @param purchaseData The updated material purchase data
   */
  const updateMaterialPurchase = useCallback(async (id: string, purchaseData: Partial<MaterialPurchase>) => {
    setIsSubmitting(true);

    try {
      // Find the current purchase
      const currentPurchase = data?.purchases.find(p => p.id === id);

      if (!currentPurchase) {
        throw new Error('Material purchase not found');
      }

      // Create an optimistic updated purchase
      const optimisticPurchase: MaterialPurchase = {
        ...currentPurchase,
        ...purchaseData,
        balance: (purchaseData.total_amount || currentPurchase.total_amount) -
                 (purchaseData.amount_paid || currentPurchase.amount_paid),
        payment_status: (purchaseData.amount_paid || currentPurchase.amount_paid) >=
                        (purchaseData.total_amount || currentPurchase.total_amount)
          ? 'paid'
          : (purchaseData.amount_paid || currentPurchase.amount_paid) > 0
            ? 'partially_paid'
            : 'unpaid',
        updated_at: new Date().toISOString()
      };

      // Optimistically update the UI
      mutate(prevData => {
        if (!prevData) return { purchases: [optimisticPurchase], total: 1, page: 1, limit: 10 };

        return {
          ...prevData,
          purchases: prevData.purchases.map(p => p.id === id ? optimisticPurchase : p)
        };
      }, false);

      // Make the API request
      const response = await fetch(`${API_ENDPOINTS.MATERIALS}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to update material purchase');
      }

      // Update with the real data
      mutate();

      // Show success message
      toast.success('Material purchase updated successfully');

      return result.data?.purchase || result.purchase;
    } catch (error: any) {
      // Log error in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating material purchase:', error);
      }

      // Revert optimistic update
      mutate();

      // Show error message
      toast.error(error.message || 'Failed to update material purchase');

      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [data, mutate]);

  /**
   * Delete a material purchase with optimistic update
   * @param id The ID of the material purchase to delete
   */
  const deleteMaterialPurchase = useCallback(async (id: string) => {
    setIsSubmitting(true);

    try {
      // Find the current purchase
      const currentPurchase = data?.purchases.find(p => p.id === id);

      if (!currentPurchase) {
        throw new Error('Material purchase not found');
      }

      // Optimistically update the UI
      mutate(prevData => {
        if (!prevData) return { purchases: [], total: 0, page: 1, limit: 10 };

        return {
          ...prevData,
          purchases: prevData.purchases.filter(p => p.id !== id),
          total: prevData.total - 1
        };
      }, false);

      // Make the API request
      const response = await fetch(`${API_ENDPOINTS.MATERIALS}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || 'Failed to delete material purchase');
      }

      // Update with the real data
      mutate();

      // Show success message
      toast.success('Material purchase deleted successfully');

      return true;
    } catch (error: any) {
      // Log error in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting material purchase:', error);
      }

      // Revert optimistic update
      mutate();

      // Show error message
      toast.error(error.message || 'Failed to delete material purchase');

      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [data, mutate]);

  // Ensure data is loaded on initial render
  useEffect(() => {
    // If we don't have data and we're not loading, trigger a fetch
    if (!data && !isLoading && !error) {
      console.log('useMaterialPurchasesList - No data available, triggering initial data load');
      mutate();
    }
  }, [data, isLoading, error, mutate]);

  return {
    purchases: data?.purchases || [],
    total: data?.total || 0,
    page: data?.page || pagination.page,
    limit: data?.limit || pagination.limit,
    isLoading,
    isError: !!error,
    isSubmitting,
    mutate,
    createMaterialPurchase,
    updateMaterialPurchase,
    deleteMaterialPurchase,
  };
}

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
    errorRetryCount: 3,
    // Reduce deduping interval to ensure fresher data
    dedupingInterval: 5 * 60 * 1000 // 5 minutes
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

/**
 * Compatibility hook for the old API
 * @deprecated Use useMaterialPurchasesList instead
 */
export function useMaterialPurchases(
  page = 1,
  limit = 10,
  supplier?: string,
  startDate?: string,
  endDate?: string,
  paymentStatus?: string
) {
  const {
    purchases,
    total,
    isLoading,
    isError,
    mutate
  } = useMaterialPurchasesList(
    {
      supplier,
      startDate,
      endDate,
      paymentStatus
    },
    { page, limit }
  );

  return {
    purchases,
    total,
    isLoading,
    isError,
    mutate
  };
}

/**
 * Compatibility hook for the old API
 * @deprecated Use useMaterialPurchaseDetails instead
 */
export function useMaterialPurchase(id: string) {
  const {
    purchase,
    isLoading,
    isError,
    mutate
  } = useMaterialPurchaseDetails(id);

  return {
    purchase,
    isLoading,
    isError,
    mutate
  };
}

/**
 * Compatibility hook for the old API
 * @deprecated Use useMaterialPurchaseDetails instead
 */
export function useMaterialPayments(purchaseId: string) {
  // Use the optimized endpoint through useMaterialPurchaseDetails
  const {
    purchase,
    isLoading,
    isError,
    mutate
  } = useMaterialPurchaseDetails(purchaseId);

  // Ensure we always return an array, even if purchase is null or payments is undefined
  const payments = purchase?.payments || [];

  // Log for debugging
  React.useEffect(() => {
    console.log(`useMaterialPayments - purchaseId: ${purchaseId}, found ${payments.length} payments`);
  }, [purchaseId, payments.length]);

  return {
    payments,
    isLoading,
    isError,
    mutate
  };
}

/**
 * Compatibility hook for the old API
 * @deprecated Use useMaterialPurchaseDetails instead
 */
export function useMaterialInstallments(purchaseId: string) {
  const [isDirectFetching, setIsDirectFetching] = useState(false);

  // Use the optimized endpoint through useMaterialPurchaseDetails
  const {
    purchase,
    isLoading: isPurchaseLoading,
    isError: isPurchaseError,
    mutate: mutatePurchase
  } = useMaterialPurchaseDetails(purchaseId);

  // Create a direct SWR fetcher for installments only
  const directInstallmentsKey = purchaseId ? `${API_ENDPOINTS.MATERIALS}/${purchaseId}/installments` : null;

  const { data: directData, error: directError, isLoading: isDirectLoading, mutate: mutateDirectInstallments } =
    useLoadingSWR(
      directInstallmentsKey,
      async (url) => {
        try {
          setIsDirectFetching(true);
          console.log('Directly fetching installments from:', url);
          const response = await fetch(url);

          if (!response.ok) {
            throw new Error(`Failed to fetch installments: ${response.status}`);
          }

          const result = await response.json();
          console.log('Direct installments fetch result:', result);

          return result.data?.installments || result.installments || [];
        } catch (error) {
          console.error('Error fetching installments directly:', error);
          throw error;
        } finally {
          setIsDirectFetching(false);
        }
      },
      {
        dedupingInterval: 5 * 60 * 1000, // 5 minutes
        revalidateOnFocus: true,
        revalidateIfStale: true
      }
    );

  // Combine installments from both sources, preferring the purchase source if available
  const installments = React.useMemo(() => {
    if (purchase?.installments && purchase.installments.length > 0) {
      return purchase.installments;
    }

    return directData || [];
  }, [purchase?.installments, directData]);

  // Combined loading state
  const isLoading = isPurchaseLoading || isDirectLoading || isDirectFetching;

  // Combined error state
  const isError = !!(isPurchaseError || directError);

  // Simplified mutate function - only mutate the purchase data
  // This prevents circular dependencies and infinite loops
  const mutate = useCallback(async () => {
    try {
      console.log('Mutating purchase data for installments');
      return await mutatePurchase();
    } catch (error) {
      console.error('Error mutating installments data:', error);
    }
  }, [mutatePurchase]);

  // Log for debugging - only in development and only when values change
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`useMaterialInstallments - purchaseId: ${purchaseId}, found ${installments.length} installments`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseId, installments.length]);

  return {
    installments,
    isLoading,
    isError,
    mutate
  };
}

/**
 * Compatibility hook for the old API
 * @deprecated Use useMaterialPurchaseDetails instead
 */
export function useMaterialPurchaseNotes(purchaseId: string) {
  // Use the optimized endpoint through useMaterialPurchaseDetails
  const {
    purchase,
    isLoading,
    isError,
    mutate
  } = useMaterialPurchaseDetails(purchaseId);

  // Ensure we always return an array, even if purchase is null or purchase_notes is undefined
  const notes = purchase?.purchase_notes || [];

  // Log for debugging
  React.useEffect(() => {
    console.log(`useMaterialPurchaseNotes - purchaseId: ${purchaseId}, found ${notes.length} notes`);
  }, [purchaseId, notes.length]);

  return {
    notes,
    isLoading,
    isError,
    mutate
  };
}
