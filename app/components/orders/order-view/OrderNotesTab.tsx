import React, { useState } from 'react';
import { OrderNotesTabProps } from './types';
import { StickyNote, User, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NoteForm from './NoteForm';
import { OrderNote } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';

/**
 * OrderNotesTab displays the order notes
 */
const OrderNotesTab: React.FC<OrderNotesTabProps> = ({ order, canEdit = false }) => {
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [notes, setNotes] = useState<OrderNote[]>(order.notes || []);
  const { toast } = useToast();

  const handleAddNote = (note: Partial<OrderNote>) => {
    const newNote: OrderNote = {
      id: `note-${Date.now()}`,
      type: note.type!,
      text: note.text!,
      linked_item_type: 'order',
      linked_item_id: order.id,
      created_by: 'current-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add the note to the local state
    setNotes([newNote, ...notes]);

    // Close the form
    setShowNoteForm(false);

    // Show success message
    toast({
      title: "Note Added",
      description: "Your note has been added to the order.",
    });

    // TODO: Add API call to save the note to the database
  };
  return (
    <div className="space-y-4">
      {canEdit && (
        showNoteForm ? (
          <NoteForm
            onSubmit={handleAddNote}
            onCancel={() => setShowNoteForm(false)}
          />
        ) : (
          <div className="mb-4">
            <Button
              onClick={() => setShowNoteForm(true)}
              variant="outline"
              className="border-[#2B2B40] bg-transparent hover:bg-white/[0.02] text-[#6D6D80] hover:text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Note
            </Button>
          </div>
        )
      )}

      {notes.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {notes.map((note, index) => (
            <div
              key={note.id || index}
              className="border border-[#2B2B40] rounded-lg p-4 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#1E1E2D] rounded-md">
                  <StickyNote className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white whitespace-pre-line">{note.text}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center">
                      <User className="h-3 w-3 text-[#6D6D80] mr-1" />
                      <span className="text-xs text-brand">{note.created_by_name || 'Staff'}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 text-[#6D6D80] mr-1" />
                      <span className="text-xs text-[#6D6D80]">{new Date(note.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-[#2B2B40] rounded-lg p-6 text-center">
          <StickyNote className="h-8 w-8 text-[#6D6D80] mx-auto mb-2" />
          <p className="text-sm text-[#6D6D80]">No notes available for this order.</p>
        </div>
      )}
    </div>
  );
};

export default OrderNotesTab;
