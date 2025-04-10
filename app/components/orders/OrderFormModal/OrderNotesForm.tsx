import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Order, OrderNote, NoteType } from '@/types/orders';
import { Plus, Trash2 } from 'lucide-react';
import { DeletionType } from '@/components/ui/approval-dialog';
import { InlineNoteForm } from '@/components/orders/forms/InlineNoteForm';

interface OrderNotesFormProps {
  active: boolean;
  order: Partial<Order>;
  updateOrderFields: (fields: Partial<Order>) => void;
  openDeleteDialog: (id: string, index: number, name: string, type: DeletionType) => void;
  errors?: Record<string, string[]>;
}

/**
 * Component for the notes tab of the order form
 */
const OrderNotesForm: React.FC<OrderNotesFormProps> = ({
  active,
  order,
  updateOrderFields,
  openDeleteDialog,
  errors = {},
}) => {
  const [noteForms, setNoteForms] = useState([0]); // Start with one form
  const [formIdCounter, setFormIdCounter] = useState(1); // Counter for generating unique form IDs
  // Add another note form
  const handleAddNote = () => {
    setNoteForms([...noteForms, formIdCounter]);
    setFormIdCounter(formIdCounter + 1);
  };

  // Remove a form
  const handleRemoveForm = (index: number) => {
    setNoteForms(noteForms.filter(formId => formId !== index));
  };

  // Handle adding a new note from the form
  const handleAddNoteFromForm = (newNote: OrderNote) => {
    const existingNotes = order.notes || [];

    // Check if this note already exists (by ID)
    const existingNoteIndex = existingNotes.findIndex(note => note.id === newNote.id);

    let newNotes;
    if (existingNoteIndex >= 0) {
      // Update existing note
      newNotes = [...existingNotes];
      newNotes[existingNoteIndex] = newNote;
    } else {
      // Add new note
      newNotes = [...existingNotes, newNote];
    }

    updateOrderFields({ notes: newNotes });
  };

  return (
    <div>
      <div className="mb-5 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">
          Order Notes {(order.notes?.length || 0) > 0 && <span className="text-sm text-muted-foreground ml-2">({order.notes?.length} added)</span>}
        </h3>
        <Button
          variant="outline"
          size="sm"
          className="border-primary/70 text-primary hover:bg-primary/10"
          onClick={handleAddNote}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Another Note
        </Button>
      </div>

      {noteForms.map((formIndex) => (
        <InlineNoteForm
          key={formIndex}
          onAddNote={handleAddNoteFromForm}
          onRemoveForm={handleRemoveForm}
          formIndex={formIndex}
        />
      ))}

      {noteForms.length === 0 && (order.notes?.length || 0) === 0 && (
        <div className="text-center py-8 bg-card/30 rounded-md border border-border/50 shadow-sm">
          <p className="text-muted-foreground">No notes added to this order yet</p>
          <p className="text-muted-foreground/70 text-sm mt-1">Click "Add Another Note" to add notes</p>
        </div>
      )}
    </div>
  );
};

export default OrderNotesForm;