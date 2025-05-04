import React, { useState } from 'react';
import { ExpenseNote } from '@/hooks/expenses';
import BottomOverlayForm from './BottomOverlayForm';
import AddExpenseNoteForm from './AddExpenseNoteForm';

interface AddExpenseNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseId: string;
  onSuccess: (note: ExpenseNote) => void;
}

function AddExpenseNoteModal({
  isOpen,
  onClose,
  expenseId,
  onSuccess
}: AddExpenseNoteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (note: Partial<ExpenseNote>) => {
    try {
      setIsSubmitting(true);
      // Make an API call to add the note
      const response = await fetch(`/api/expenses/${expenseId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note: {
            type: note.type || 'info',
            text: note.text || '',
            linked_item_type: 'expense',
            linked_item_id: expenseId
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add note');
      }

      const result = await response.json();

      // Use the note from the API response if available, otherwise create a fallback
      const newNote = result.data?.note || {
        id: `temp-${Date.now()}`,
        linked_item_type: 'expense',
        linked_item_id: expenseId,
        type: note.type || 'info',
        text: note.text || '',
        created_at: new Date().toISOString(),
        ...note
      } as ExpenseNote;

      // Log the note data for debugging
      console.log('Note added successfully:', newNote);

      // Call the onSuccess callback with the new note
      onSuccess(newNote);
    } catch (error) {
      console.error('Error adding note:', error);
      // Re-throw the error to allow the parent component to handle it
      throw error;
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
      <AddExpenseNoteForm
        expenseId={expenseId}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
      />
    </BottomOverlayForm>
  );
}

export default AddExpenseNoteModal;
