import { useCallback, useState } from 'react';
import { OrderNote, NoteType } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';

/**
 * Custom hook to manage order notes
 */
export function useOrderNotes(orderId: string) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<OrderNote[]>([]);
  
  /**
   * Fetch all notes for an order
   */
  const fetchNotes = useCallback(async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/orders/${orderId}/notes`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }
      
      const data = await response.json();
      setNotes(data.notes || []);
      
      return data.notes;
    } catch (error) {
      console.error(`Error fetching notes for order ${orderId}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to fetch order notes',
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [orderId, toast]);
  
  /**
   * Add a new note to an order
   */
  const addNote = useCallback(async (
    type: NoteType,
    text: string,
    createdBy: string
  ) => {
    if (!orderId) return null;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/orders/${orderId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          text,
          createdBy
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add note');
      }
      
      const data = await response.json();
      
      toast({
        title: 'Success',
        description: 'Note added successfully'
      });
      
      // Refresh notes list
      await fetchNotes();
      
      return data.id;
    } catch (error) {
      console.error(`Error adding note to order ${orderId}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to add note',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [orderId, fetchNotes, toast]);
  
  /**
   * Delete a note from an order
   */
  const deleteNote = useCallback(async (noteId: string) => {
    if (!orderId || !noteId) return false;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/orders/${orderId}/notes?noteId=${noteId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete note');
      }
      
      toast({
        title: 'Success',
        description: 'Note deleted successfully'
      });
      
      // Refresh notes list
      await fetchNotes();
      
      return true;
    } catch (error) {
      console.error(`Error deleting note ${noteId} from order ${orderId}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to delete note',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [orderId, fetchNotes, toast]);
  
  /**
   * Get notes of a specific type
   */
  const getNotesByType = useCallback((type: NoteType) => {
    return notes.filter(note => note.type === type);
  }, [notes]);
  
  return {
    loading,
    notes,
    fetchNotes,
    addNote,
    deleteNote,
    getNotesByType
  };
} 