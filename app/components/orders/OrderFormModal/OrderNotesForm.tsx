import React, { useState, useEffect } from 'react';
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
  // New props for form state management
  formState?: number[];
  partialData?: Record<number, any>;
  onAddForm?: () => void;
  onRemoveForm?: (index: number) => void;
  onUpdatePartialData?: (index: number, data: any) => void;
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
  // New props with defaults
  formState = [0],
  partialData = {},
  onAddForm,
  onRemoveForm,
  onUpdatePartialData,
}) => {
  // Use provided form state or local state as fallback
  const [localNoteForms, setLocalNoteForms] = useState([0]); // Local fallback
  const [localFormIdCounter, setLocalFormIdCounter] = useState(1); // Local fallback

  // Debug order notes
  console.log('OrderNotesForm received order:', order);
  console.log('OrderNotesForm received order.notes:', order.notes);

  // Use either provided form state or local state
  const noteForms = formState || localNoteForms;

  // We've removed the useEffect that syncs local state with provided form state
  // to prevent infinite update loops
  // Add another note form
  const handleAddNote = () => {
    if (onAddForm) {
      onAddForm();
    } else {
      // Fallback to local state
      setLocalNoteForms([...localNoteForms, localFormIdCounter]);
      setLocalFormIdCounter(localFormIdCounter + 1);
    }
  };

  // Remove a form
  const handleRemoveForm = (index: number) => {
    if (onRemoveForm) {
      onRemoveForm(index);
    } else {
      // Fallback to local state
      setLocalNoteForms(localNoteForms.filter(formId => formId !== index));
    }
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

      {/* We're not displaying notes as cards anymore - they remain as editable forms */}

      {/* Only show forms for new notes (not already in the notes array) */}
      {noteForms.map((formIndex) => {
        // Skip forms that correspond to existing notes to prevent duplication
        if (formIndex < (order.notes?.length || 0)) {
          return null;
        }

        return (
          <InlineNoteForm
            key={formIndex}
            onAddNote={handleAddNoteFromForm}
            onRemoveForm={handleRemoveForm}
            formIndex={formIndex}
            initialData={partialData[formIndex]}
            onUpdatePartialData={onUpdatePartialData ?
              (data) => onUpdatePartialData(formIndex, data) :
              undefined}
          />
        );
      })}

      {/* Display existing notes as editable forms */}
      {(order.notes || []).map((note, index) => (
        <InlineNoteForm
          key={`existing-${note.id || index}`}
          onAddNote={handleAddNoteFromForm}
          onRemoveForm={() => {
            // When removing an existing note, we need to update the order
            const newNotes = [...(order.notes || [])];
            newNotes.splice(index, 1);
            updateOrderFields({ notes: newNotes });
          }}
          formIndex={index}
          initialData={note}
          onUpdatePartialData={onUpdatePartialData ?
            (data) => onUpdatePartialData(index, data) :
            undefined}
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