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
      date: new Date().toISOString(),
      amount: parseFloat(paymentAmount),
      method: paymentMethod,
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
  };

  return {
    paymentAmount,
    setPaymentAmount,
    paymentMethod,
    setPaymentMethod,

    handleSubmit,
    resetForm
  };
};

export default useOrderPayments;
