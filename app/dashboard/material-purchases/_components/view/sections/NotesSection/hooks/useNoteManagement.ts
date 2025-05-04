'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { MaterialNote } from '@/types/materials';
import { useMaterialPurchaseView } from '../../../context/MaterialPurchaseViewContext';
import { v4 as uuidv4 } from 'uuid';

interface LoadingStates {
  addNote: boolean;
  editNote: string | null;
  deleteNote: string | null;
}

export function useNoteManagement() {
  const { purchase, onEdit, refreshPurchase } = useMaterialPurchaseView();
  
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    addNote: false,
    editNote: null,
    deleteNote: null
  });

  // Add a new note
  const handleAddNote = useCallback(async (noteData: { text: string }) => {
    if (!purchase) return false;
    
    try {
      setLoadingStates(prev => ({ ...prev, addNote: true }));
      
      // Create a new note with a temporary ID
      const newNote: MaterialNote = {
        id: uuidv4(), // Temporary ID
        material_purchase_id: purchase.id,
        text: noteData.text,
        type: 'material_purchase',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Get current notes array or initialize if not exists
      const currentNotes = Array.isArray(purchase.purchase_notes) ? purchase.purchase_notes : [];
      
      // Create updated purchase object with new note
      const updatedPurchase = {
        ...purchase,
        purchase_notes: [...currentNotes, newNote]
      };
      
      // Call the onEdit function from context
      await onEdit(updatedPurchase);
      
      // Show success toast
      toast.success('Note Added', {
        description: 'Your note has been added successfully.'
      });
      
      // Refresh the purchase data
      await refreshPurchase();
      
      return true;
    } catch (error) {
      console.error('Error adding note:', error);
      
      // Show error toast
      toast.error('Failed to Add Note', {
        description: error instanceof Error ? error.message : 'An error occurred while adding the note.'
      });
      
      return false;
    } finally {
      setLoadingStates(prev => ({ ...prev, addNote: false }));
    }
  }, [purchase, onEdit, refreshPurchase]);

  // Edit an existing note
  const handleEditNote = useCallback(async (updatedNote: MaterialNote) => {
    if (!purchase) return false;
    
    try {
      setLoadingStates(prev => ({ ...prev, editNote: updatedNote.id }));
      
      // Get current notes array
      const currentNotes = Array.isArray(purchase.purchase_notes) ? purchase.purchase_notes : [];
      
      // Find the note to update
      const noteIndex = currentNotes.findIndex(n => n.id === updatedNote.id);
      if (noteIndex === -1) {
        throw new Error('Note not found');
      }
      
      // Update the note in the array
      const updatedNotes = [...currentNotes];
      updatedNotes[noteIndex] = {
        ...updatedNote,
        updated_at: new Date().toISOString()
      };
      
      // Create updated purchase object with updated note
      const updatedPurchase = {
        ...purchase,
        purchase_notes: updatedNotes
      };
      
      // Call the onEdit function from context
      await onEdit(updatedPurchase);
      
      // Show success toast
      toast.success('Note Updated', {
        description: 'Your note has been updated successfully.'
      });
      
      // Refresh the purchase data
      await refreshPurchase();
      
      return true;
    } catch (error) {
      console.error('Error updating note:', error);
      
      // Show error toast
      toast.error('Failed to Update Note', {
        description: error instanceof Error ? error.message : 'An error occurred while updating the note.'
      });
      
      return false;
    } finally {
      setLoadingStates(prev => ({ ...prev, editNote: null }));
    }
  }, [purchase, onEdit, refreshPurchase]);

  // Delete a note
  const handleDeleteNote = useCallback(async (noteId: string) => {
    if (!purchase) return false;
    
    try {
      setLoadingStates(prev => ({ ...prev, deleteNote: noteId }));
      
      // Get current notes array
      const currentNotes = Array.isArray(purchase.purchase_notes) ? purchase.purchase_notes : [];
      
      // Find the note to delete
      const noteToDelete = currentNotes.find(n => n.id === noteId);
      if (!noteToDelete) {
        throw new Error('Note not found');
      }
      
      // Remove the note from the array
      const updatedNotes = currentNotes.filter(n => n.id !== noteId);
      
      // Create updated purchase object without the deleted note
      const updatedPurchase = {
        ...purchase,
        purchase_notes: updatedNotes
      };
      
      // Call the onEdit function from context
      await onEdit(updatedPurchase);
      
      // Show success toast
      toast.success('Note Deleted', {
        description: 'Your note has been deleted successfully.'
      });
      
      // Refresh the purchase data
      await refreshPurchase();
      
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      
      // Show error toast
      toast.error('Failed to Delete Note', {
        description: error instanceof Error ? error.message : 'An error occurred while deleting the note.'
      });
      
      return false;
    } finally {
      setLoadingStates(prev => ({ ...prev, deleteNote: null }));
    }
  }, [purchase, onEdit, refreshPurchase]);

  return {
    handleAddNote,
    handleEditNote,
    handleDeleteNote,
    loadingStates
  };
}
