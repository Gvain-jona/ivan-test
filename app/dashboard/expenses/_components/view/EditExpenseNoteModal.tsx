import React, { useState } from 'react';
import { ExpenseNote } from '@/hooks/expenses';
import BottomOverlayForm from './BottomOverlayForm';
import AddExpenseNoteForm from './AddExpenseNoteForm';
import { toast } from 'sonner';

interface EditExpenseNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseId: string;
  note: ExpenseNote;
  onSuccess: (note: ExpenseNote) => void;
}

function EditExpenseNoteModal({
  isOpen,
  onClose,
  expenseId,
  note,
  onSuccess
}: EditExpenseNoteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (updatedNote: Partial<ExpenseNote>) => {
    try {
      setIsSubmitting(true);
      // Make an API call to update the note
      const response = await fetch(`/api/expenses/${expenseId}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note: {
            type: updatedNote.type || 'info',
            text: updatedNote.text || '',
          },
          noteId: note.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update note');
      }

      const result = await response.json();

      // Use the note from the API response if available, otherwise create a fallback
      const editedNote = result.data?.note || {
        ...note,
        id: note.id, // Ensure ID is included
        expense_id: expenseId, // Ensure expense_id is included
        type: updatedNote.type || 'info',
        text: updatedNote.text || '',
        updated_at: new Date().toISOString(),
      } as ExpenseNote;

      // Log the note data for debugging
      console.log('Note updated successfully:', editedNote);

      // Call the onSuccess callback with the updated note
      onSuccess(editedNote);

      // Show success toast
      toast.success('Note updated successfully');
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update note');
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
      title="Edit Note"
    >
      <AddExpenseNoteForm
        expenseId={expenseId}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        defaultValues={note}
      />
    </BottomOverlayForm>
  );
}

export default EditExpenseNoteModal;
