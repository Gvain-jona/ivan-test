/**
 * Hook for creating installment plans
 * This is a dedicated hook to avoid circular dependencies and infinite loops
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

/**
 * Hook for creating an installment plan for a material purchase
 * @param purchaseId The ID of the material purchase
 */
export function useCreateInstallmentPlan(purchaseId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createInstallmentPlan = async (installmentData: {
    total_installments: number;
    payment_frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
    first_payment_date: string;
    reminder_days?: number;
  }) => {
    if (!purchaseId) throw new Error('Material purchase ID is required');

    setIsLoading(true);
    setError(null);

    try {
      // Make the API request
      const response = await fetch(`${API_ENDPOINTS.MATERIALS}/${purchaseId}/installments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(installmentData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to create installment plan');
      }

      // Show success message
      toast.success('Installment plan created successfully');

      return result.data?.installments || result.installments;
    } catch (error: any) {
      // Log error in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating installment plan:', error);
      }

      // Set error state
      setError(error);

      // Show error message
      toast.error(error.message || 'Failed to create installment plan');

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createInstallmentPlan,
    isLoading,
    error
  };
}
