/**
 * Re-export from the materials directory
 * For backward compatibility, we're keeping the same exports
 * but they now come from the consolidated hooks
 *
 * @deprecated Use imports from '@/hooks/materials' instead
 */

import {
  MaterialPurchase,
  MaterialInstallment,
  useMaterialPurchasesList,
  useMaterialPurchaseDetails
} from './materials';

export * from './materials';

// Re-export CRUD operations for backward compatibility
export function useCreateMaterialPurchase() {
  const { createMaterialPurchase, isSubmitting: isLoading, isError } = useMaterialPurchasesList();

  return {
    createPurchase: createMaterialPurchase,
    isLoading,
    error: isError ? new Error('Failed to create material purchase') : null
  };
}

export function useUpdateMaterialPurchase(id: string) {
  const { updateMaterialPurchase, isSubmitting: isLoading, isError } = useMaterialPurchasesList();

  return {
    updatePurchase: (purchaseData: Partial<MaterialPurchase>) =>
      updateMaterialPurchase(id, purchaseData),
    isLoading,
    error: isError ? new Error('Failed to update material purchase') : null
  };
}

export function useDeleteMaterialPurchase() {
  const { deleteMaterialPurchase, isSubmitting: isLoading, isError } = useMaterialPurchasesList();

  return {
    deletePurchase: deleteMaterialPurchase,
    isLoading,
    error: isError ? new Error('Failed to delete material purchase') : null
  };
}

export function useAddMaterialPayment(purchaseId: string) {
  const { addPayment, isSubmitting: isLoading, isError } = useMaterialPurchaseDetails(purchaseId);

  return {
    addPayment,
    isLoading,
    error: isError ? new Error('Failed to add payment') : null
  };
}

export function useDeleteMaterialPayment(purchaseId: string) {
  const { deletePayment, isSubmitting: isLoading, isError } = useMaterialPurchaseDetails(purchaseId);

  return {
    deletePayment,
    isLoading,
    error: isError ? new Error('Failed to delete payment') : null
  };
}

export function useCreateMaterialInstallmentPlan(purchaseId: string) {
  const { createInstallmentPlan, isSubmitting: isLoading, isError } = useMaterialPurchaseDetails(purchaseId);

  return {
    createInstallmentPlan,
    isLoading,
    error: isError ? new Error('Failed to create installment plan') : null
  };
}

export function useUpdateMaterialInstallment(purchaseId: string, installmentId: string) {
  const { updateInstallment, isSubmitting: isLoading, isError } = useMaterialPurchaseDetails(purchaseId);

  return {
    updateInstallment: (installmentData: Partial<MaterialInstallment>) =>
      updateInstallment(installmentId, installmentData),
    isLoading,
    error: isError ? new Error('Failed to update installment') : null
  };
}
