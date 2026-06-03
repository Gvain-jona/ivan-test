/**
 * Material Purchases List Hook
 * Hook for fetching and managing material purchases list
 */

import { useState, useCallback, useEffect } from 'react';
import { useLoadingSWR } from '../useLoadingSWR';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import { SWR_CACHE_TIMES } from '@/lib/swr-config';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { createMaterialSWRConfig } from './swr-config';
import {
  MaterialPurchase,
  MaterialPurchaseFilters,
  PaginationParams,
  MaterialPurchasesResponse
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
    dedupingInterval: SWR_CACHE_TIMES.LIST_DEDUPE,
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
