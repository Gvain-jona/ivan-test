import { useState, useCallback, useRef } from 'react';
import { Expense, ExpensePayment, ExpenseNote } from '@/hooks/expenses';
import { toast } from 'sonner';

interface LoadingStates {
  addPayment: boolean;
  editPayment: string | null;
  deletePayment: string | null;
  addNote: boolean;
  editNote: string | null;
  deleteNote: string | null;
}

interface UseExpenseUpdatesProps {
  expense: Expense | null;
  onEdit: (expense: Expense) => Promise<any>;
  refreshExpense?: () => Promise<void>;
}

interface UpdateConfig {
  entityType: string;
  actionType: 'add' | 'edit' | 'delete';
  entityKey: 'payments' | 'notes';
  loadingStateKey: keyof LoadingStates;
  successTitle: string;
  errorTitle: string;
  getSuccessMessage: (entity: any) => string;
  getErrorMessage: (error: any) => string;
}

/**
 * Custom hook for handling expense updates with optimistic updates
 * This hook provides a consistent way to update expense payments and notes
 * with proper loading states and optimistic updates
 */
export function useExpenseUpdates({ expense, onEdit, refreshExpense }: UseExpenseUpdatesProps) {
  // Loading states for individual operations
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    addPayment: false,
    editPayment: null,
    deletePayment: null,
    addNote: false,
    editNote: null,
    deleteNote: null
  });

  // Track pending operations to prevent duplicates
  const pendingOperations = useRef<Record<string, boolean>>({});

  /**
   * Generic update handler for payments and notes
   */
  const handleUpdate = useCallback(async (
    config: UpdateConfig,
    entityData: any,
    entityId?: string
  ) => {
    if (!expense) return;

    const {
      entityType,
      actionType,
      entityKey,
      loadingStateKey,
      successTitle,
      errorTitle,
      getSuccessMessage,
      getErrorMessage
    } = config;

    // Create a unique operation key to prevent duplicate submissions
    const operationKey = `${actionType}-${entityType}-${entityId || entityData?.id || Date.now()}`;

    // Check if this operation is already in progress
    if (pendingOperations.current[operationKey]) {
      console.log(`Operation ${operationKey} already in progress, skipping`);
      return;
    }

    pendingOperations.current[operationKey] = true;

    try {
      // Set loading state
      if (actionType === 'add') {
        setLoadingStates(prev => ({ ...prev, [loadingStateKey]: true }));
      } else {
        setLoadingStates(prev => ({ ...prev, [loadingStateKey]: entityId }));
      }

      // Get the current entities array, ensuring it's an array
      const currentEntities = Array.isArray(expense[entityKey]) ? expense[entityKey] : [];
      let updatedEntities;
      let entityForMessage;

      // Log for debugging
      console.log(`Updating ${entityType} with action ${actionType}`, {
        entityData,
        entityId,
        currentEntitiesCount: currentEntities.length
      });

      // Perform the appropriate action based on actionType
      if (actionType === 'add') {
        // For add, append the new entity to the array
        entityForMessage = entityData;
        updatedEntities = [...currentEntities, entityData];
      } else if (actionType === 'edit') {
        // For edit, replace the entity with the updated one
        entityForMessage = entityData;
        updatedEntities = currentEntities.map((entity: any) =>
          entity.id === entityData.id ? entityData : entity
        );
      } else if (actionType === 'delete') {
        // For delete, filter out the entity with the given ID
        entityForMessage = currentEntities.find((entity: any) => entity.id === entityId);
        updatedEntities = currentEntities.filter((entity: any) => entity.id !== entityId);
      } else {
        throw new Error(`Invalid action type: ${actionType}`);
      }

      // Create an updated expense object with the new entities
      const updatedExpense = {
        ...expense,
        [entityKey]: updatedEntities
      };

      // Call the onEdit function with the updated expense
      // This will update the expense in the parent component's state
      // and persist the changes to the server
      const result = await onEdit(updatedExpense);

      // Show success toast
      toast.success(successTitle, {
        description: getSuccessMessage(entityForMessage)
      });

      // Return the result for further processing if needed
      return result;
    } catch (error) {
      console.error(`Error ${actionType}ing ${entityType}:`, error);

      // Show error toast
      toast.error(errorTitle, {
        description: getErrorMessage(error)
      });
    } finally {
      // Clear loading state
      setLoadingStates(prev => ({
        ...prev,
        [loadingStateKey]: actionType === 'add' ? false : null
      }));

      // Remove from pending operations
      delete pendingOperations.current[operationKey];

      // Always refresh the expense data if a refresh function is provided
      // This ensures that the data is refreshed even if there's an error
      if (refreshExpense) {
        try {
          await refreshExpense();
        } catch (refreshError) {
          console.error(`Error refreshing expense after ${actionType}ing ${entityType}:`, refreshError);
        }
      }
    }
  }, [expense, onEdit, refreshExpense]);

  /**
   * Add a payment to the expense
   */
  const handleAddPayment = useCallback((payment: ExpensePayment) => {
    return handleUpdate({
      entityType: 'payment',
      actionType: 'add',
      entityKey: 'payments',
      loadingStateKey: 'addPayment',
      successTitle: 'Payment Added',
      errorTitle: 'Failed to Add Payment',
      getSuccessMessage: (payment) => `Payment of ${payment.amount} has been added.`,
      getErrorMessage: (error) => error instanceof Error ? error.message : 'An error occurred while adding the payment.'
    }, payment);
  }, [handleUpdate]);

  /**
   * Edit a payment in the expense
   */
  const handleEditPayment = useCallback((payment: ExpensePayment) => {
    return handleUpdate({
      entityType: 'payment',
      actionType: 'edit',
      entityKey: 'payments',
      loadingStateKey: 'editPayment',
      successTitle: 'Payment Updated',
      errorTitle: 'Failed to Update Payment',
      getSuccessMessage: (payment) => `Payment of ${payment.amount} has been updated.`,
      getErrorMessage: (error) => error instanceof Error ? error.message : 'An error occurred while updating the payment.'
    }, payment, payment.id);
  }, [handleUpdate]);

  /**
   * Delete a payment from the expense
   */
  const handleDeletePayment = useCallback((paymentId: string) => {
    return handleUpdate({
      entityType: 'payment',
      actionType: 'delete',
      entityKey: 'payments',
      loadingStateKey: 'deletePayment',
      successTitle: 'Payment Deleted',
      errorTitle: 'Failed to Delete Payment',
      getSuccessMessage: (payment) => `Payment has been deleted.`,
      getErrorMessage: (error) => error instanceof Error ? error.message : 'An error occurred while deleting the payment.'
    }, null, paymentId);
  }, [handleUpdate]);

  /**
   * Add a note to the expense
   */
  const handleAddNote = useCallback((note: ExpenseNote) => {
    return handleUpdate({
      entityType: 'note',
      actionType: 'add',
      entityKey: 'notes',
      loadingStateKey: 'addNote',
      successTitle: 'Note Added',
      errorTitle: 'Failed to Add Note',
      getSuccessMessage: (note) => `Note has been added.`,
      getErrorMessage: (error) => error instanceof Error ? error.message : 'An error occurred while adding the note.'
    }, note);
  }, [handleUpdate]);

  /**
   * Edit a note in the expense
   */
  const handleEditNote = useCallback((note: ExpenseNote) => {
    return handleUpdate({
      entityType: 'note',
      actionType: 'edit',
      entityKey: 'notes',
      loadingStateKey: 'editNote',
      successTitle: 'Note Updated',
      errorTitle: 'Failed to Update Note',
      getSuccessMessage: (note) => `Note has been updated.`,
      getErrorMessage: (error) => error instanceof Error ? error.message : 'An error occurred while updating the note.'
    }, note, note.id);
  }, [handleUpdate]);

  /**
   * Delete a note from the expense
   */
  const handleDeleteNote = useCallback((noteId: string) => {
    return handleUpdate({
      entityType: 'note',
      actionType: 'delete',
      entityKey: 'notes',
      loadingStateKey: 'deleteNote',
      successTitle: 'Note Deleted',
      errorTitle: 'Failed to Delete Note',
      getSuccessMessage: (note) => `Note has been deleted.`,
      getErrorMessage: (error) => error instanceof Error ? error.message : 'An error occurred while deleting the note.'
    }, null, noteId);
  }, [handleUpdate]);

  return {
    loadingStates,
    handleAddPayment,
    handleEditPayment,
    handleDeletePayment,
    handleAddNote,
    handleEditNote,
    handleDeleteNote
  };
}
