import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Order, OrderPayment, PaymentMethod } from '@/types/orders';
import { formatCurrency } from '@/utils/formatting.utils';
import { Plus, Trash2 } from 'lucide-react';
import { DeletionType } from '@/components/ui/approval-dialog';
import { InlinePaymentForm } from '@/components/orders/forms/InlinePaymentForm';

interface OrderPaymentsFormProps {
  active: boolean;
  order: Partial<Order>;
  updateOrderFields: (fields: Partial<Order>) => void;
  openDeleteDialog: (id: string, index: number, name: string, type: DeletionType) => void;
  recalculateOrder: () => void;
  toast: any; // Using any for simplicity, but ideally should use a proper type
  errors?: Record<string, string[]>;
  // Updated props for enhanced form state management
  formState?: number[];
  partialData?: Record<number, any>;
  onAddForm?: () => void;
  onRemoveForm?: (index: number) => void;
  onUpdatePartialData?: (index: number, data: any) => void;
}

/**
 * Component for the payments tab of the order form
 */
const OrderPaymentsForm: React.FC<OrderPaymentsFormProps> = ({
  active,
  order,
  updateOrderFields,
  openDeleteDialog,
  recalculateOrder,
  toast,
  errors = {},
  // Updated props with defaults
  formState = [0],
  partialData = {},
  onAddForm,
  onRemoveForm,
  onUpdatePartialData,
}) => {
  // Get payments from order, handling potentially missing field in type
  const payments = (order as any).payments || [];

  // Use provided form state or local state as fallback
  const [localPaymentForms, setLocalPaymentForms] = useState([0]); // Local fallback
  const [localFormIdCounter, setLocalFormIdCounter] = useState(1); // Local fallback

  // Use either provided form state or local state
  const paymentForms = formState || localPaymentForms;

  // Initialize with an empty form if no payments and none are being added
  // Only use this if we're using local state
  useEffect(() => {
    if (paymentForms.length === 0 && payments.length === 0) {
      // Use a unique ID for the form to prevent duplicates
      const uniqueFormId = Date.now();
      setLocalPaymentForms([uniqueFormId]);
      setLocalFormIdCounter(uniqueFormId + 1); // Update the counter to be higher than our unique ID
    }
  }, [paymentForms.length, payments.length]); // Depend on actual data to prevent re-running unnecessarily

  // Add another payment form
  const handleAddPaymentForm = () => {
    if (onAddForm) {
      // Use the external add form function if provided
      onAddForm();
    } else {
      // Otherwise use local state
      setLocalPaymentForms([...localPaymentForms, localFormIdCounter]);
      setLocalFormIdCounter(localFormIdCounter + 1);
    }
  };

  // Remove a form
  const handleRemoveForm = (index: number) => {
    if (onRemoveForm) {
      // Use the external remove form function if provided
      onRemoveForm(index);
    } else {
      // Otherwise use local state
      setLocalPaymentForms(localPaymentForms.filter(formId => formId !== index));
    }
  };

  // Remove an existing payment
  const handleRemovePayment = (paymentId: string) => {
    const paymentIndex = payments.findIndex(payment => payment.id === paymentId);
    if (paymentIndex !== -1) {
      console.log('Removing payment with ID:', paymentId, 'at index:', paymentIndex);

      const newPayments = [...payments];
      newPayments.splice(paymentIndex, 1);

      console.log('Updated payments array:', newPayments);

      // Update the order with the new payments array
      // No need to map fields here since we're just removing an item
      updateOrderFields({ payments: newPayments });

      // Recalculate totals and balance
      recalculateOrder();
    }
  };

  // Handle adding a new payment from the form
  const handleAddPaymentFromForm = (newPayment: OrderPayment) => {
    // Ensure amount is a number
    if (typeof newPayment.amount !== 'number' || isNaN(newPayment.amount)) {
      console.error('Invalid payment amount:', newPayment.amount);
      return;
    }

    console.log('Adding payment with amount:', newPayment.amount, newPayment);

    // Check if this payment already exists by ID
    const existingPaymentIndex = payments.findIndex(payment => payment.id === newPayment.id);

    // Also check if we have a payment with the same amount and date (potential duplicate)
    const potentialDuplicateIndex = payments.findIndex(payment =>
      payment.id !== newPayment.id && // Not the same payment
      payment.amount === newPayment.amount && // Same amount
      payment.date === newPayment.date && // Same date (using the correct field name)
      payment.payment_method === newPayment.payment_method // Same method
    );

    // If this looks like a duplicate, log a warning and don't add it
    if (potentialDuplicateIndex >= 0 && existingPaymentIndex < 0) {
      console.warn('Potential duplicate payment detected - not adding:', newPayment);
      return;
    }

    let newPayments;
    if (existingPaymentIndex >= 0) {
      // Update existing payment
      newPayments = [...payments];
      newPayments[existingPaymentIndex] = newPayment;
    } else {
      // Add new payment
      newPayments = [...payments, newPayment];
      // No toast notification - removed as requested
    }

    console.log('Updating order with payments:', newPayments);

    // Ensure all payments have a date field for database compatibility
    console.log('Original payments before mapping:', JSON.stringify(newPayments));

    const mappedPayments = newPayments.map(payment => {
      // If payment already has a date field, use it
      if (payment.date) {
        console.log('Payment already has date field:', payment.date);
        return payment;
      }

      // If payment has a payment_date field, map it to date
      if ((payment as any).payment_date) {
        console.log('Payment has payment_date field:', (payment as any).payment_date);
        const { payment_date, ...rest } = payment as any;
        return {
          ...rest,
          date: payment_date || new Date().toISOString().split('T')[0], // Map payment_date to date with fallback
        };
      }

      // If payment has neither, add a default date
      console.log('Payment has neither date nor payment_date field, adding default date');
      const today = new Date().toISOString().split('T')[0];
      return {
        ...payment,
        date: today, // Ensure date is set
      };
    });

    console.log('Mapped payments for database:', mappedPayments);

    // Update the order with the new payments array
    updateOrderFields({ payments: mappedPayments });

    // Recalculate totals and balance
    recalculateOrder();

    // If we added a new payment (not updating), remove the form to prevent duplicates
    if (existingPaymentIndex < 0) {
      console.log('Added new payment, attempting to remove form:', newPayment);
      console.log('Available empty forms:', paymentForms);

      // Remove the most recently added form
      if (paymentForms.length > 0) {
        // Get the last form ID (most recently added)
        const lastFormId = paymentForms[paymentForms.length - 1];
        console.log('Removing payment form with ID:', lastFormId);
        handleRemoveForm(lastFormId);
      }
    }
  };

  return (
    <div>
      <div className="mb-5 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">
          Payments {payments.length > 0 && <span className="text-sm text-muted-foreground ml-2">({payments.length} added)</span>}
        </h3>
        <Button
          variant="outline"
          size="sm"
          className="border-primary/70 text-primary hover:bg-primary/10"
          onClick={handleAddPaymentForm}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Another Payment
        </Button>
      </div>

      {/* Render existing payments with proper numbering */}
      {payments.map((payment, index) => (
        <InlinePaymentForm
          key={`existing-${payment.id}`}
          onAddPayment={handleAddPaymentFromForm}
          onRemoveForm={() => handleRemovePayment(payment.id)}
          formIndex={index}
          displayNumber={index + 1} // Pass explicit display number
          existingPayment={payment}
        />
      ))}

      {/* Render empty forms for new payments with proper numbering */}
      {paymentForms.map((formIndex) => (
        <InlinePaymentForm
          key={formIndex}
          formIndex={formIndex}
          displayNumber={payments.length + paymentForms.indexOf(formIndex) + 1}
          onAddPayment={handleAddPaymentFromForm}
          onRemoveForm={handleRemoveForm}
          initialData={partialData[formIndex]}
          onUpdatePartialData={onUpdatePartialData ? 
            (index, data) => onUpdatePartialData(index, data) : 
            undefined}
          isOpen={active}
        />
      ))}

      {paymentForms.length === 0 && payments.length === 0 && (
        <div className="text-center py-8 bg-card/30 rounded-md border border-border/50 shadow-sm">
          <p className="text-muted-foreground">No payments recorded yet</p>
          <p className="text-muted-foreground/70 text-sm mt-1">Click "Add Another Payment" to record payments</p>
        </div>
      )}
    </div>
  );
};

export default OrderPaymentsForm;