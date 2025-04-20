import React, { useState } from 'react';
import { OrderNote } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';
import BottomOverlayForm from './BottomOverlayForm';
import AddOrderNoteForm from './AddOrderNoteForm';

interface AddOrderNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSuccess?: () => void;
}

const AddOrderNoteModal: React.FC<AddOrderNoteModalProps> = ({
  isOpen,
  onClose,
  orderId,
  onSuccess
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submission
  const handleSubmit = async (note: Partial<OrderNote>) => {
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
        throw new Error(errorData.message || 'Failed to add note');
      }

      const result = await response.json();
      console.log('Note added successfully:', result);

      // Show success toast
      toast({
        title: 'Note Added',
        description: 'Your note has been added to the order.',
      });

      // Close the modal
      onClose();

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add note',
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
