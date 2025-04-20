import React, { useState } from 'react';
import { OrderNotesTabProps } from './types';
import { StickyNote, User, Calendar, Plus, Pencil, Trash2, Save, X, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NoteForm from './NoteForm';
import { OrderNote, NoteType } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * NoteEditForm component for inline editing of notes
 */
interface NoteEditFormProps {
  note: OrderNote;
  onSave: (updatedNote: OrderNote) => void;
  onCancel: () => void;
}

const NoteEditForm: React.FC<NoteEditFormProps> = ({ note, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    text: note.text || '',
    type: note.type || 'info',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      type: value as NoteType
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create the updated note
    const updatedNote = {
      ...note,
      ...formData,
      updated_at: new Date().toISOString()
    };

    onSave(updatedNote);
  };

  // Check if form is complete
  const isFormComplete = formData.text.trim() !== '';

  // Get note type icon
  const getNoteTypeIcon = () => {
    switch (formData.type) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />;
      case 'client_follow_up':
        return <User className="h-4 w-4 text-blue-500 mr-2" />;
      case 'internal':
        return <StickyNote className="h-4 w-4 text-purple-500 mr-2" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-green-500 mr-2" />;
    }
  };

  return (
    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-md shadow-sm">
      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type" className="text-xs font-medium">Note Type</Label>
            <Select
              value={formData.type}
              onValueChange={handleSelectChange}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select type">
                  <div className="flex items-center">
                    {getNoteTypeIcon()}
                    <span>{formatNoteType(formData.type)}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">
                  <div className="flex items-center">
                    <Info className="h-4 w-4 text-green-500 mr-2" />
                    <span>Info</span>
                  </div>
                </SelectItem>
                <SelectItem value="urgent">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                    <span>Urgent</span>
                  </div>
                </SelectItem>
                <SelectItem value="client_follow_up">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-blue-500 mr-2" />
                    <span>Client Follow-up</span>
                  </div>
                </SelectItem>
                <SelectItem value="internal">
                  <div className="flex items-center">
                    <StickyNote className="h-4 w-4 text-purple-500 mr-2" />
                    <span>Internal</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="text" className="text-xs font-medium">Note Text</Label>
            <Textarea
              id="text"
              name="text"
              value={formData.text}
              onChange={handleChange}
              className="min-h-[120px] text-sm bg-transparent border-border focus:border-primary"
              placeholder="Enter note text..."
              required
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="px-4"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4"
              disabled={!isFormComplete}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Note
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * OrderNotesTab displays the order notes
 */
const OrderNotesTab: React.FC<OrderNotesTabProps> = ({
  order,
  onEdit,
  refreshOrder,
  isLoading = false,
  isError = false,
  loadingStates = {},
  onAddNoteClick
}) => {
  const [showNoteForm, setShowNoteForm] = useState(false);
  // Use order.notes directly instead of local state to ensure we're always showing the latest data
  const notes = order.notes || [];

  // Enhanced debugging for notes data
  console.log('OrderNotesTab - order:', order);
  console.log('OrderNotesTab - notes:', notes);

  // Validate notes data structure
  const hasValidNotes = Array.isArray(notes);
  console.log('OrderNotesTab - hasValidNotes:', hasValidNotes);

  // If notes is not an array, log a warning
  if (!Array.isArray(notes)) {
    console.warn('OrderNotesTab - notes is not an array:', notes);
  }

  // Check if notes have the expected structure
  if (notes.length > 0) {
    console.log('OrderNotesTab - First note structure:', {
      id: notes[0].id,
      type: notes[0].type,
      text: notes[0].text,
      created_by: notes[0].created_by,
      created_at: notes[0].created_at
    });

    // Check if any notes are missing required fields
    const missingFields = notes.some(note => !note.id || !note.type || !note.text);
    if (missingFields) {
      console.warn('OrderNotesTab - Some notes are missing required fields');
    }
  }
  const { toast } = useToast();

  // State for tracking which note is being edited
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Handle edit button click
  const handleEditClick = (note: OrderNote) => {
    setEditingNoteId(note.id);
  };

  // Handle save edited note
  const handleSaveNote = (updatedNote: OrderNote) => {
    // Call the onEdit function to update the note
    if (onEdit) {
      // Create a new order object with the updated note
      const updatedOrder = { ...order };
      if (updatedOrder.notes) {
        const noteIndex = updatedOrder.notes.findIndex(n => n.id === updatedNote.id);
        if (noteIndex !== -1) {
          updatedOrder.notes[noteIndex] = updatedNote;
          onEdit(updatedOrder);
        }
      }
    }
    setEditingNoteId(null);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingNoteId(null);
  };

  // Handle delete button click
  const handleDeleteNote = (noteId: string) => {
    // Call the onEdit function to delete the note
    if (onEdit) {
      // Create a new order object without the deleted note
      const updatedOrder = { ...order };
      if (updatedOrder.notes) {
        updatedOrder.notes = updatedOrder.notes.filter(n => n.id !== noteId);
        onEdit(updatedOrder);
      }
    }
  };

  // Get color for note type
  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'client_follow_up':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'internal':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'info':
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
  };

  // Format note type for display
  const formatNoteType = (type: string) => {
    switch (type) {
      case 'client_follow_up':
        return 'Follow Up';
      case 'urgent':
        return 'Urgent';
      case 'internal':
        return 'Internal';
      case 'info':
      default:
        return 'Info';
    }
  };

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

    // Call the onAddNote prop if it exists
    if (onAddNote) {
      onAddNote(newNote);
    }

    // Close the form
    setShowNoteForm(false);
  };
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <Button
          onClick={() => onAddNoteClick ? onAddNoteClick(order.id) : null}
          variant="outline"
          className="border-border/40 bg-popover backdrop-blur-md rounded-xl hover:bg-popover/90 text-muted-foreground hover:text-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          disabled={isLoading || !order.id}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Note
        </Button>
      </div>

      {hasValidNotes && notes.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 w-full">
          {notes.map((note, index) => (
            <div
              key={note.id || index}
              className={`border ${editingNoteId === note.id ? 'border-primary/30' : 'border-border/40'} bg-popover backdrop-blur-md rounded-xl p-3 transition-all duration-200 shadow-sm ${editingNoteId !== note.id ? 'hover:shadow-md hover:-translate-y-1 hover:bg-popover/90 relative after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:bg-purple-500/20 after:rounded-b-xl after:opacity-0 hover:after:opacity-100 after:transition-opacity' : ''} w-full`}
            >
              {editingNoteId === note.id ? (
                <NoteEditForm
                  note={note}
                  onSave={handleSaveNote}
                  onCancel={handleCancelEdit}
                />
              ) : (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-lg flex items-center justify-center shadow-sm ring-1 ring-purple-500/20 mt-0.5">
                    <StickyNote className="h-4 w-4 text-purple-500" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="mb-1.5">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-md ${loadingStates.editNote === note.id ? 'bg-primary/10 text-primary animate-pulse' : getNoteTypeColor(note.type || 'info')}`}>
                        {loadingStates.editNote === note.id && <Loader2 className="h-2.5 w-2.5 inline mr-1 animate-spin" />}
                        {formatNoteType(note.type || 'info')}
                      </span>
                    </div>
                    <p className={`text-sm whitespace-pre-line mb-2 ${loadingStates.editNote === note.id ? 'text-primary/80 animate-pulse' : ''}`}>
                      {loadingStates.editNote === note.id && <Loader2 className="h-3 w-3 inline mr-1 animate-spin" />}
                      {note.text}
                    </p>
                    <div className="flex flex-wrap items-center justify-between pt-1.5 border-t border-border/30 mt-1 gap-y-1">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className={`text-xs ${loadingStates.editNote === note.id ? 'text-primary/70 animate-pulse' : 'text-muted-foreground'}`}>{note.created_by_name || note.created_by || 'Staff'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className={`text-xs ${loadingStates.editNote === note.id ? 'text-primary/70 animate-pulse' : 'text-muted-foreground'}`}>{new Date(note.created_at).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 p-0 hover:bg-muted/50 text-muted-foreground hover:text-primary"
                          onClick={() => handleEditClick(note)}
                          disabled={isLoading || loadingStates.editNote === note.id || loadingStates.deleteNote === note.id}
                        >
                          {loadingStates.editNote === note.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Pencil className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 p-0 hover:bg-muted/50 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteNote(note.id)}
                          disabled={isLoading || loadingStates.editNote === note.id || loadingStates.deleteNote === note.id}
                        >
                          {loadingStates.deleteNote === note.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-border/40 bg-popover backdrop-blur-md rounded-xl p-4 text-center shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-full flex items-center justify-center shadow-sm ring-1 ring-purple-500/20 mx-auto mb-2">
            <StickyNote className="h-5 w-5 text-purple-500/70" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-muted-foreground">No notes available for this order.</p>
        </div>
      )}
    </div>
  );
};

export default OrderNotesTab;
