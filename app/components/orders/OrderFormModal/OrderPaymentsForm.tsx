import React, { useState } from 'react';
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
}) => {
  const [paymentForms, setPaymentForms] = useState([0]); // Start with one form
  const [formIdCounter, setFormIdCounter] = useState(1); // Counter for generating unique form IDs
  // Get payments from order, handling potentially missing field in type
  const payments = (order as any).payments || [];

  // Add another payment form
  const handleAddPayment = () => {
    setPaymentForms([...paymentForms, formIdCounter]);
    setFormIdCounter(formIdCounter + 1);
  };

  // Remove a form
  const handleRemoveForm = (index: number) => {
    setPaymentForms(paymentForms.filter(formId => formId !== index));
  };

  // Handle adding a new payment from the form
  const handleAddPaymentFromForm = (newPayment: OrderPayment) => {
    const existingPaymentIndex = payments.findIndex(payment => payment.id === newPayment.id);

    let newPayments;
    if (existingPaymentIndex >= 0) {
      // Update existing payment
      newPayments = [...payments];
      newPayments[existingPaymentIndex] = newPayment;
    } else {
      // Add new payment
      newPayments = [...payments, newPayment];

      // Only show toast for new payments
      toast({
        title: "Payment Added",
        description: `Payment of ${formatCurrency(newPayment.amount)} has been recorded.`,
      });
    }

    // Use type assertion to update payments
    updateOrderFields({ payments: newPayments } as any);
    recalculateOrder();
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
          onClick={handleAddPayment}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Another Payment
        </Button>
      </div>

      {paymentForms.map((formIndex) => (
        <InlinePaymentForm
          key={formIndex}
          onAddPayment={handleAddPaymentFromForm}
          onRemoveForm={handleRemoveForm}
          formIndex={formIndex}
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