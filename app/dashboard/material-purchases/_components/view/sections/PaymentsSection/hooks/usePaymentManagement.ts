'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { MaterialPayment } from '@/types/materials';
import { useMaterialPurchaseView } from '../../../context/MaterialPurchaseViewContext';
import { v4 as uuidv4 } from 'uuid';

interface LoadingStates {
  addPayment: boolean;
  editPayment: string | null;
  deletePayment: string | null;
}

export function usePaymentManagement() {
  const { purchase, onEdit, refreshPurchase } = useMaterialPurchaseView();

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    addPayment: false,
    editPayment: null,
    deletePayment: null
  });

  // Add a new payment
  const handleAddPayment = useCallback(async (paymentData: Omit<MaterialPayment, 'id' | 'material_purchase_id'>) => {
    if (!purchase) return false;

    try {
      setLoadingStates(prev => ({ ...prev, addPayment: true }));

      // Create a new payment with a temporary ID
      const newPayment: MaterialPayment = {
        id: uuidv4(), // Temporary ID
        material_purchase_id: purchase.id,
        ...paymentData
      };

      // Get current payments array or initialize if not exists
      const currentPayments = Array.isArray(purchase.payments) ? purchase.payments : [];

      // Calculate new amount_paid and balance
      const newAmountPaid = currentPayments.reduce(
        (sum, payment) => sum + (payment.amount || 0),
        0
      ) + (newPayment.amount || 0);

      const newBalance = (purchase.total_amount || 0) - newAmountPaid;

      // Determine payment status
      let newPaymentStatus = 'unpaid';
      if (newAmountPaid >= (purchase.total_amount || 0)) {
        newPaymentStatus = 'paid';
      } else if (newAmountPaid > 0) {
        newPaymentStatus = 'partially_paid';
      }

      // Create updated purchase object with new payment
      const updatedPurchase = {
        ...purchase,
        payments: [...currentPayments, newPayment],
        amount_paid: newAmountPaid,
        balance: newBalance,
        payment_status: newPaymentStatus
      };

      // Optimistically update the local data
      refreshPurchase(updatedPurchase, { revalidate: false });

      // Show loading toast
      const toastId = toast.loading('Adding payment...');

      try {
        // Call the onEdit function from context
        await onEdit(updatedPurchase);

        // Update toast to success
        toast.success('Payment Added', {
          description: `Payment of ${paymentData.amount} has been added.`,
          id: toastId
        });

        // Refresh the purchase data in the background
        refreshPurchase();

        return true;
      } catch (error) {
        // If the API call fails, revert the optimistic update
        refreshPurchase();

        // Update toast to error
        toast.error('Failed to Add Payment', {
          description: error instanceof Error ? error.message : 'An error occurred while adding the payment.',
          id: toastId
        });

        return false;
      }
    } catch (error) {
      console.error('Error adding payment:', error);

      // Show error toast
      toast.error('Failed to Add Payment', {
        description: error instanceof Error ? error.message : 'An error occurred while adding the payment.'
      });

      return false;
    } finally {
      setLoadingStates(prev => ({ ...prev, addPayment: false }));
    }
  }, [purchase, onEdit, refreshPurchase]);

  // Edit an existing payment
  const handleEditPayment = useCallback(async (updatedPayment: MaterialPayment) => {
    if (!purchase) return false;

    try {
      setLoadingStates(prev => ({ ...prev, editPayment: updatedPayment.id }));

      // Get current payments array
      const currentPayments = Array.isArray(purchase.payments) ? purchase.payments : [];

      // Find the payment to update
      const paymentIndex = currentPayments.findIndex(p => p.id === updatedPayment.id);
      if (paymentIndex === -1) {
        throw new Error('Payment not found');
      }

      // Get the old payment amount
      const oldAmount = currentPayments[paymentIndex].amount || 0;

      // Update the payment in the array
      const updatedPayments = [...currentPayments];
      updatedPayments[paymentIndex] = updatedPayment;

      // Calculate new amount_paid and balance
      const newAmountPaid = currentPayments.reduce(
        (sum, payment) => sum + (payment.id === updatedPayment.id ? 0 : (payment.amount || 0)),
        0
      ) + (updatedPayment.amount || 0);

      const newBalance = (purchase.total_amount || 0) - newAmountPaid;

      // Determine payment status
      let newPaymentStatus = 'unpaid';
      if (newAmountPaid >= (purchase.total_amount || 0)) {
        newPaymentStatus = 'paid';
      } else if (newAmountPaid > 0) {
        newPaymentStatus = 'partially_paid';
      }

      // Create updated purchase object with updated payment
      const updatedPurchase = {
        ...purchase,
        payments: updatedPayments,
        amount_paid: newAmountPaid,
        balance: newBalance,
        payment_status: newPaymentStatus
      };

      // Optimistically update the local data
      refreshPurchase(updatedPurchase, { revalidate: false });

      // Show loading toast
      const toastId = toast.loading('Updating payment...');

      try {
        // Call the onEdit function from context
        await onEdit(updatedPurchase);

        // Update toast to success
        toast.success('Payment Updated', {
          description: `Payment has been updated successfully.`,
          id: toastId
        });

        // Refresh the purchase data in the background
        refreshPurchase();

        return true;
      } catch (error) {
        // If the API call fails, revert the optimistic update
        refreshPurchase();

        // Update toast to error
        toast.error('Failed to Update Payment', {
          description: error instanceof Error ? error.message : 'An error occurred while updating the payment.',
          id: toastId
        });

        return false;
      }
    } catch (error) {
      console.error('Error updating payment:', error);

      // Show error toast
      toast.error('Failed to Update Payment', {
        description: error instanceof Error ? error.message : 'An error occurred while updating the payment.'
      });

      return false;
    } finally {
      setLoadingStates(prev => ({ ...prev, editPayment: null }));
    }
  }, [purchase, onEdit, refreshPurchase]);

  // Delete a payment
  const handleDeletePayment = useCallback(async (paymentId: string) => {
    if (!purchase) return false;

    try {
      setLoadingStates(prev => ({ ...prev, deletePayment: paymentId }));

      // Get current payments array
      const currentPayments = Array.isArray(purchase.payments) ? purchase.payments : [];

      // Find the payment to delete
      const paymentToDelete = currentPayments.find(p => p.id === paymentId);
      if (!paymentToDelete) {
        throw new Error('Payment not found');
      }

      // Store the original payments for potential rollback
      const originalPayments = [...currentPayments];

      // Remove the payment from the array
      const updatedPayments = currentPayments.filter(p => p.id !== paymentId);

      // Calculate new amount_paid and balance
      const newAmountPaid = updatedPayments.reduce(
        (sum, payment) => sum + (payment.amount || 0),
        0
      );

      const newBalance = (purchase.total_amount || 0) - newAmountPaid;

      // Determine payment status
      let newPaymentStatus = 'unpaid';
      if (newAmountPaid >= (purchase.total_amount || 0)) {
        newPaymentStatus = 'paid';
      } else if (newAmountPaid > 0) {
        newPaymentStatus = 'partially_paid';
      }

      // Create updated purchase object without the deleted payment
      const updatedPurchase = {
        ...purchase,
        payments: updatedPayments,
        amount_paid: newAmountPaid,
        balance: newBalance,
        payment_status: newPaymentStatus
      };

      // Optimistically update the local data
      refreshPurchase(updatedPurchase, { revalidate: false });

      // Show loading toast
      const toastId = toast.loading('Deleting payment...');

      try {
        // Call the onEdit function from context
        await onEdit(updatedPurchase);

        // Update toast to success
        toast.success('Payment Deleted', {
          description: `Payment has been deleted successfully.`,
          id: toastId
        });

        // Refresh the purchase data in the background
        refreshPurchase();

        return true;
      } catch (error) {
        // If the API call fails, revert the optimistic update
        const revertedPurchase = {
          ...purchase,
          payments: originalPayments
        };
        refreshPurchase(revertedPurchase, { revalidate: false });

        // Then trigger a full refresh
        refreshPurchase();

        // Update toast to error
        toast.error('Failed to Delete Payment', {
          description: error instanceof Error ? error.message : 'An error occurred while deleting the payment.',
          id: toastId
        });

        return false;
      }
    } catch (error) {
      console.error('Error deleting payment:', error);

      // Show error toast
      toast.error('Failed to Delete Payment', {
        description: error instanceof Error ? error.message : 'An error occurred while deleting the payment.'
      });

      return false;
    } finally {
      setLoadingStates(prev => ({ ...prev, deletePayment: null }));
    }
  }, [purchase, onEdit, refreshPurchase]);

  return {
    handleAddPayment,
    handleEditPayment,
    handleDeletePayment,
    loadingStates
  };
}
