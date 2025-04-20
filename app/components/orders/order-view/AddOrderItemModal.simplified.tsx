import React, { useState } from 'react';
import { Order, OrderItem } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';
import BottomOverlayForm from './BottomOverlayForm';
import AddOrderItemForm from './AddOrderItemForm.simplified';
import { invalidateOrderCache } from '@/lib/cache-utils';
import { useOrder } from '@/hooks/useData';
import { useNotifications } from '@/components/ui/notification';

interface AddOrderItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSuccess?: () => void;
  order?: Order;
}

const AddOrderItemModal: React.FC<AddOrderItemModalProps> = ({
  isOpen,
  onClose,
  orderId,
  onSuccess,
  order: initialOrder
}) => {
  const { toast } = useToast();
  const { success: showSuccess, error: showError } = useNotifications();

  // Fetch the order data if not provided
  const { order: fetchedOrder } = useOrder(orderId ? `/api/orders/${orderId}` : null);

  // Use the provided order or the fetched order
  const order = initialOrder || fetchedOrder;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submission
  const handleSubmit = async (item: Partial<OrderItem>) => {
    if (!orderId) {
      // Show error notification with improved styling
      showError('Order ID is required', 'Error');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Adding item to order:', orderId, item);

      // Make API call to add item
      const response = await fetch(`/api/orders/${orderId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ item }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add item');
      }

      const result = await response.json();
      console.log('Item added successfully:', result);

      // Show success notification with improved styling
      showSuccess(`${item.item_name} has been added to the order.`, 'Item Added');

      // Create optimistic data for the order with the new item
      const optimisticData = {
        id: orderId,
        items: [...(order?.items || []), item]
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
      console.error('Error adding item:', error);
      // Show error notification with improved styling
      showError(error instanceof Error ? error.message : 'Failed to add item', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomOverlayForm
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Item"
    >
      <AddOrderItemForm
        orderId={orderId}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </BottomOverlayForm>
  );
};

export default AddOrderItemModal;
