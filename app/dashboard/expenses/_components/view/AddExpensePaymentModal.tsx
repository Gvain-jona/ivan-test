import React, { useState } from 'react';
import { ExpensePayment } from '@/hooks/expenses';
import BottomOverlayForm from './BottomOverlayForm';
import AddExpensePaymentForm from './AddExpensePaymentForm';

interface AddExpensePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseId: string;
  onSuccess: (payment: ExpensePayment) => void;
}

function AddExpensePaymentModal({
  isOpen,
  onClose,
  expenseId,
  onSuccess
}: AddExpensePaymentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (payment: Partial<ExpensePayment>) => {
    try {
      setIsSubmitting(true);
      // Make an API call to add the payment
      const response = await fetch(`/api/expenses/${expenseId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment: {
            amount: payment.amount || 0,
            date: payment.date || new Date().toISOString(),
            payment_method: payment.payment_method || 'cash',
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add payment');
      }

      const result = await response.json();

      // Use the payment from the API response if available, otherwise create a fallback
      const newPayment = result.data?.payment || {
        id: `temp-${Date.now()}`,
        expense_id: expenseId,
        amount: payment.amount || 0,
        date: payment.date || new Date().toISOString(),
        payment_method: payment.payment_method || 'cash',
        created_at: new Date().toISOString(),
        ...payment
      } as ExpensePayment;

      // Log the payment data for debugging
      console.log('Payment added successfully:', newPayment);

      // Call the onSuccess callback with the new payment
      onSuccess(newPayment);
    } catch (error) {
      console.error('Error adding payment:', error);
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
      title="Add New Payment"
    >
      <AddExpensePaymentForm
        expenseId={expenseId}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
      />
    </BottomOverlayForm>
  );
}

export default AddExpensePaymentModal;
