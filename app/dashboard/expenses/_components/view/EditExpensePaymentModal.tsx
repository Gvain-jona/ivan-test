import React, { useState } from 'react';
import { ExpensePayment } from '@/hooks/expenses';
import BottomOverlayForm from './BottomOverlayForm';
import AddExpensePaymentForm from './AddExpensePaymentForm';
import { toast } from 'sonner';

interface EditExpensePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseId: string;
  payment: ExpensePayment;
  onSuccess: (payment: ExpensePayment) => void;
}

function EditExpensePaymentModal({
  isOpen,
  onClose,
  expenseId,
  payment,
  onSuccess
}: EditExpensePaymentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (updatedPayment: Partial<ExpensePayment>) => {
    try {
      setIsSubmitting(true);
      // Make an API call to update the payment
      const response = await fetch(`/api/expenses/${expenseId}/payments`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment: {
            amount: updatedPayment.amount || 0,
            // Ensure date is in ISO format
            date: updatedPayment.date
              ? updatedPayment.date.includes('T')
                ? updatedPayment.date
                : new Date(updatedPayment.date).toISOString()
              : new Date().toISOString(),
            payment_method: updatedPayment.payment_method || 'cash',
          },
          paymentId: payment.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update payment');
      }

      const result = await response.json();

      // Use the payment from the API response if available, otherwise create a fallback
      const editedPayment = result.data?.payment || {
        ...payment,
        id: payment.id, // Ensure ID is included
        expense_id: expenseId, // Ensure expense_id is included
        amount: updatedPayment.amount || 0,
        date: updatedPayment.date || new Date().toISOString(),
        payment_method: updatedPayment.payment_method || 'cash',
        updated_at: new Date().toISOString(),
      } as ExpensePayment;

      // Log the payment data for debugging
      console.log('Payment updated successfully:', editedPayment);

      // Call the onSuccess callback with the updated payment
      onSuccess(editedPayment);

      // Show success toast
      toast.success('Payment updated successfully');
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update payment');
      // Re-throw the error to allow the parent component to handle it
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomOverlayForm
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Payment"
    >
      <AddExpensePaymentForm
        expenseId={expenseId}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        defaultValues={payment}
      />
    </BottomOverlayForm>
  );
}

export default EditExpensePaymentModal;
