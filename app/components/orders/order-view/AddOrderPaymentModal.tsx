import React, { useState } from 'react';
import { OrderPayment } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';
import BottomOverlayForm from './BottomOverlayForm';
import AddOrderPaymentForm from './AddOrderPaymentForm';

interface AddOrderPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSuccess?: () => void;
}

const AddOrderPaymentModal: React.FC<AddOrderPaymentModalProps> = ({
  isOpen,
  onClose,
  orderId,
  onSuccess
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submission
  const handleSubmit = async (payment: Partial<OrderPayment>) => {
    if (!orderId) {
      toast({
        title: 'Error',
        description: 'Order ID is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Adding payment to order:', orderId, payment);

      // Make API call to add payment
      const response = await fetch(`/api/orders/${orderId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payment }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add payment');
      }

      const result = await response.json();
      console.log('Payment added successfully:', result);

      // Show success toast
      toast({
        title: 'Payment Added',
        description: `Payment of ${new Intl.NumberFormat('en-UG', {
          style: 'currency',
          currency: 'UGX',
          minimumFractionDigits: 0
        }).format(payment.amount || 0)} has been added to the order.`,
      });

      // Close the modal
      onClose();

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add payment',
        variant: 'destructive'
      });
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
      <AddOrderPaymentForm
        orderId={orderId}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </BottomOverlayForm>
  );
};

export default AddOrderPaymentModal;
