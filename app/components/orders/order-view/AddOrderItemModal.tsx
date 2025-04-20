import React, { useState } from 'react';
import { OrderItem } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';
import BottomOverlayForm from './BottomOverlayForm';
import AddOrderItemForm from './AddOrderItemForm';

interface AddOrderItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSuccess?: () => void;
}

const AddOrderItemModal: React.FC<AddOrderItemModalProps> = ({
  isOpen,
  onClose,
  orderId,
  onSuccess
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submission
  const handleSubmit = async (item: Partial<OrderItem>) => {
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

      // Show success toast
      toast({
        title: 'Item Added',
        description: `${item.item_name} has been added to the order.`,
      });

      // Close the modal
      onClose();

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add item',
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
