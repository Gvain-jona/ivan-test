import React, { useState } from 'react';
import { Order, OrderPayment } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';
import BottomOverlayForm from './BottomOverlayForm';
import AddOrderPaymentForm from './AddOrderPaymentForm.simplified';
import { invalidateOrderCache } from '@/lib/cache-utils';
import { useOrder } from '@/hooks/useData';
import { useNotifications } from '@/components/ui/notification';

interface AddOrderPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSuccess?: () => void;
  order?: Order;
}

const AddOrderPaymentModal: React.FC<AddOrderPaymentModalProps> = ({
  isOpen,
  onClose,
  orderId,
  onSuccess,
  order: initialOrder
}) => {
  const { toast } = useToast();
  const { success: showSuccess, error: showError } = useNotifications();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch the order data if not provided
  const { order: fetchedOrder } = useOrder(orderId ? `/api/orders/${orderId}` : null);

  // Use the provided order or the fetched order
  const order = initialOrder || fetchedOrder;

  // Handle form submission
  const handleSubmit = async (payment: Partial<OrderPayment>) => {
    if (!orderId) {
      // Show error notification with improved styling
      showError('Order ID is required', 'Error');
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

      // Show success notification with improved styling
      showSuccess(
        `Payment of ${new Intl.NumberFormat('en-UG', {
          style: 'currency',
          currency: 'UGX',
          minimumFractionDigits: 0
        }).format(payment.amount || 0)} has been added to the order.`,
        'Payment Added'
      );

      // Create optimistic data for the order with the new payment
      const optimisticData = {
        id: orderId,
        payments: [...(order?.payments || []), payment],
        // Update the payment status and amount_paid
        amount_paid: ((order?.amount_paid || 0) + (payment.amount || 0)),
        payment_status: ((order?.amount_paid || 0) + (payment.amount || 0)) >= (order?.total_amount || 0) ? 'paid' : 'partially_paid'
      };

      // Invalidate the cache for this order with optimistic data
      // This will update the UI immediately while the revalidation happens in the background
      invalidateOrderCache(orderId, optimisticData);

      // Close the modal immediately - the optimistic update will keep the UI updated
      onClose();

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      // Show error notification with improved styling
      showError(error instanceof Error ? error.message : 'Failed to add payment', 'Error');
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
