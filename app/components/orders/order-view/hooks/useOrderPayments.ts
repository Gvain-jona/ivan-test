import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import { OrderPayment } from '@/types/orders';
import { UseOrderPaymentsProps, UseOrderPaymentsReturn } from '../types';

/**
 * Custom hook for managing payment form state and logic
 */
const useOrderPayments = ({
  order,
  onAddPayment
}: UseOrderPaymentsProps): UseOrderPaymentsReturn => {
  const { toast } = useToast();
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]); // Default to today's date in YYYY-MM-DD format


  /**
   * Handle payment form submission
   */
  const handleSubmit = () => {
    // Validate amount
    if (!paymentAmount || isNaN(parseFloat(paymentAmount)) || parseFloat(paymentAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount.",
        variant: "destructive",
      });
      return;
    }

    // Create new payment object
    const newPayment: OrderPayment = {
      id: `payment-${Date.now()}`,
      order_id: order.id,
      payment_date: paymentDate,
      amount: parseFloat(paymentAmount),
      payment_method: paymentMethod as any,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Call the onAddPayment callback
    onAddPayment(newPayment);

    // Reset form
    resetForm();

    // Show success message
    toast({
      title: "Payment Added",
      description: `${formatCurrency(parseFloat(paymentAmount))} payment has been added to the order.`,
    });
  };

  /**
   * Reset the payment form
   */
  const resetForm = () => {
    setPaymentAmount('');
    setPaymentMethod('cash');
    setPaymentDate(new Date().toISOString().split('T')[0]); // Reset to today's date
  };

  return {
    paymentAmount,
    setPaymentAmount,
    paymentMethod,
    setPaymentMethod,
    paymentDate,
    setPaymentDate,

    handleSubmit,
    resetForm
  };
};

export default useOrderPayments;
