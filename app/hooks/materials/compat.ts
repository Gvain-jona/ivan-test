/**
 * Material Purchases Compatibility Hooks
 * Deprecated compatibility wrappers for the old API
 */

import React, { useState, useCallback } from 'react';
import { useLoadingSWR } from '../useLoadingSWR';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import { SWR_CACHE_TIMES } from '@/lib/swr-config';
import { useMaterialPurchasesList } from './useMaterialPurchasesList';
import { useMaterialPurchaseDetails } from './useMaterialPurchaseDetails';

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
        dedupingInterval: SWR_CACHE_TIMES.LIST_DEDUPE,
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
