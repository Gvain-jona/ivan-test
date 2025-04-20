import React, { useState } from 'react';
import { Order, OrderNote } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';
import BottomOverlayForm from './BottomOverlayForm';
import AddOrderNoteForm from './AddOrderNoteForm.simplified';
import { invalidateOrderCache } from '@/lib/cache-utils';
import { useOrder } from '@/hooks/useData';
import { useNotifications } from '@/components/ui/notification';

interface AddOrderNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSuccess?: () => void;
  order?: Order;
}

const AddOrderNoteModal: React.FC<AddOrderNoteModalProps> = ({
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
  const handleSubmit = async (note: Partial<OrderNote>) => {
    if (!orderId) {
      // Show error notification with improved styling
      showError('Order ID is required', 'Error');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Adding note to order:', orderId, note);

      // Make API call to add note
      const response = await fetch(`/api/orders/${orderId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);

        // Check if it's an RLS error
        if (errorData.details && errorData.details.code === '42501') {
          throw new Error('Permission denied: Row-level security policy violation. Please contact your administrator.');
        }

        throw new Error(errorData.error || errorData.message || 'Failed to add note');
      }

      const result = await response.json();
      console.log('Note added successfully:', result);

      // Show success notification with improved styling
      showSuccess('Your note has been added to the order.', 'Note Added');

      // Create optimistic data for the order with the new note
      // Add an id to the note for optimistic updates
      const optimisticNote = {
        ...note,
        id: result.id || crypto.randomUUID(),
        created_at: new Date().toISOString()
      };

      const optimisticData = {
        id: orderId,
        notes: [...(order?.notes || []), optimisticNote]
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
      console.error('Error adding note:', error);
      // Show error notification with improved styling
      showError(error instanceof Error ? error.message : 'Failed to add note', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomOverlayForm
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Note"
    >
      <AddOrderNoteForm
        orderId={orderId}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </BottomOverlayForm>
  );
};

export default AddOrderNoteModal;
