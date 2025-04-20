import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Order, OrderItem, OrderPayment, OrderNote } from '@/types/orders';

interface UseOrderUpdatesProps {
  order: Order | null;
  onEdit: (order: Order) => Promise<any>;
  refreshOrder: (optimisticData?: any, shouldRevalidate?: boolean) => Promise<any>;
}

interface LoadingStates {
  addItem: boolean;
  editItem: string | null;
  deleteItem: string | null;
  addPayment: boolean;
  editPayment: string | null;
  deletePayment: string | null;
  addNote: boolean;
  editNote: string | null;
  deleteNote: string | null;
}

// Define types for the generic update handler
type EntityType = 'Item' | 'Payment' | 'Note';
type ActionType = 'add' | 'edit' | 'delete';

interface UpdateConfig {
  entityType: EntityType;
  actionType: ActionType;
  entityKey: string; // The key in the order object (items, payments, notes)
  loadingStateKey: string; // The key in the loadingStates object
  successTitle: string;
  errorTitle: string;
  getSuccessMessage: (entity: any) => string;
  getErrorMessage: (error: any) => string;
}

/**
 * Custom hook for handling order updates with optimistic updates
 * This hook provides a consistent way to update order items, payments, and notes
 * with proper loading states and optimistic updates
 */
export function useOrderUpdates({ order, onEdit, refreshOrder }: UseOrderUpdatesProps) {
  const { toast } = useToast();

  // Loading states for individual operations
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    addItem: false,
    editItem: null,
    deleteItem: null,
    addPayment: false,
    editPayment: null,
    deletePayment: null,
    addNote: false,
    editNote: null,
    deleteNote: null
  });

  // Use a ref to track pending operations to prevent duplicate submissions
  const pendingOperations = useRef<Record<string, boolean>>({});

  // Helper function to log only in development
  const logDebug = useCallback((message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[useOrderUpdates] ${message}`, data);
    }
  }, []);

  /**
   * Generic update handler for items, payments, and notes with debouncing
   */
  const handleUpdate = useCallback(async (
    config: UpdateConfig,
    entityData: any,
    entityId?: string
  ) => {
    if (!order) return;

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
      logDebug(`Operation ${operationKey} already in progress, skipping`);
      return;
    }

    // Mark this operation as pending
    pendingOperations.current[operationKey] = true;
    logDebug(`Starting operation ${operationKey}`);

    try {
      // Set loading state
      if (actionType === 'add') {
        setLoadingStates(prev => ({ ...prev, [loadingStateKey]: true }));
      } else {
        setLoadingStates(prev => ({ ...prev, [loadingStateKey]: entityId }));
      }

      // Get the current entities array
      const currentEntities = order[entityKey] || [];
      let updatedEntities;
      let entityForMessage;

      // Update the entities array based on the action type
      if (actionType === 'add') {
        // For add, append the new entity to the array
        updatedEntities = [...currentEntities, entityData];
        entityForMessage = entityData;
      } else if (actionType === 'edit') {
        // For edit, find and replace the entity in the array
        const entityIndex = currentEntities.findIndex(e => e.id === entityData.id);
        if (entityIndex === -1) {
          throw new Error(`${entityType} not found`);
        }
        updatedEntities = [...currentEntities];
        updatedEntities[entityIndex] = entityData;
        entityForMessage = entityData;
      } else if (actionType === 'delete') {
        // For delete, find the entity for the success message
        entityForMessage = currentEntities.find(e => e.id === entityId);
        if (!entityForMessage) {
          throw new Error(`${entityType} not found`);
        }
        // Filter out the entity to be deleted
        updatedEntities = currentEntities.filter(e => e.id !== entityId);
      }

      // Create a new order object with the updated entities
      const updatedOrder = {
        ...order,
        [entityKey]: updatedEntities
      };

      // Update the UI immediately with optimistic data
      logDebug(`Applying optimistic update for ${operationKey}`);
      await refreshOrder(updatedOrder, false);

      // Call the edit handler with the updated order
      logDebug(`Sending API request for ${operationKey}`);
      const result = await onEdit(updatedOrder);

      if (!result || !result.success) {
        throw new Error(result?.error?.message || `Failed to ${actionType} ${entityType.toLowerCase()}`);
      }

      // Show success toast
      toast({
        title: successTitle,
        description: getSuccessMessage(entityForMessage),
      });

      // Update with the actual server response if available
      if (result.data?.order) {
        logDebug(`Updating with server response for ${operationKey}`);
        await refreshOrder(result.data.order, false);
      } else {
        // If no server data, don't trigger a background refresh
        // Let SWR's normal cache invalidation handle it
        logDebug(`Not scheduling background refresh for ${operationKey} - letting SWR handle it`);
      }
    } catch (error) {
      console.error(`Error ${actionType}ing ${entityType.toLowerCase()}:`, error);
      toast({
        title: errorTitle,
        description: getErrorMessage(error),
        variant: "destructive"
      });

      // Refresh to ensure data consistency
      refreshOrder();
    } finally {
      // Clear loading state
      if (actionType === 'add') {
        setLoadingStates(prev => ({ ...prev, [loadingStateKey]: false }));
      } else {
        setLoadingStates(prev => ({ ...prev, [loadingStateKey]: null }));
      }

      // Clear the pending operation after a short delay to prevent immediate retries
      setTimeout(() => {
        pendingOperations.current[operationKey] = false;
        logDebug(`Completed operation ${operationKey}`);
      }, 500);
    }
  }, [order, onEdit, refreshOrder, toast, logDebug]);

  /**
   * Add a new item to the order with optimistic updates
   */
  const handleAddItem = useCallback(async (newItem: Partial<OrderItem>) => {
    // Create a temporary ID for the optimistic update
    const tempId = newItem.id || `temp-${Date.now()}`;

    // Create a complete item object
    const itemToAdd: OrderItem = {
      id: tempId,
      order_id: order?.id || '',
      item_id: newItem.item_id || crypto.randomUUID(),
      category_id: newItem.category_id || crypto.randomUUID(),
      item_name: newItem.item_name || '',
      category_name: newItem.category_name || '',
      size: newItem.size || 'Default',
      quantity: newItem.quantity || 1,
      unit_price: newItem.unit_price || 0,
      total_amount: (newItem.quantity || 1) * (newItem.unit_price || 0),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await handleUpdate(
      {
        entityType: 'Item',
        actionType: 'add',
        entityKey: 'items',
        loadingStateKey: 'addItem',
        successTitle: 'Item Added',
        errorTitle: 'Error Adding Item',
        getSuccessMessage: (item) => `${item.item_name} has been added to the order.`,
        getErrorMessage: (error) => error instanceof Error ? error.message : 'Failed to add item'
      },
      itemToAdd
    );
  }, [handleUpdate, order]);

  /**
   * Update an order item with optimistic updates
   */
  const handleEditItem = useCallback(async (updatedItem: OrderItem) => {
    if (!order) return;

    try {
      // Set loading state
      setLoadingStates(prev => ({ ...prev, editItem: updatedItem.id }));

      // Find the item index in the order items array
      const itemIndex = order.items.findIndex(item => item.id === updatedItem.id);
      if (itemIndex === -1) {
        throw new Error('Item not found');
      }

      // Create a new array with the updated item
      const updatedItems = [...order.items];
      updatedItems[itemIndex] = updatedItem;

      // Create a new order object with the updated items
      const updatedOrder = {
        ...order,
        items: updatedItems
      };

      // Create optimistic data for immediate UI update
      const optimisticData = {
        ...updatedOrder
      };

      // Update the UI immediately with optimistic data
      refreshOrder(optimisticData, false);

      // Call the edit handler with the updated order
      const result = await onEdit(updatedOrder);

      if (!result || !result.success) {
        throw new Error(result?.error?.message || 'Failed to update item');
      }

      // Show success toast
      toast({
        title: "Item Updated",
        description: `${updatedItem.item_name} has been successfully updated.`,
      });

      // Update with the actual server response if available
      if (result.data?.order) {
        await refreshOrder(result.data.order, false);
      } else {
        // If no server data, don't trigger a background refresh
        // Let SWR's normal cache invalidation handle it
        console.log('Not scheduling background refresh - letting SWR handle it');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: "Error Updating Item",
        description: error instanceof Error ? error.message : 'Failed to update item',
        variant: "destructive"
      });

      // Refresh to ensure data consistency
      refreshOrder();
    } finally {
      // Clear loading state
      setLoadingStates(prev => ({ ...prev, editItem: null }));
    }
  }, [order, onEdit, refreshOrder, toast]);

  /**
   * Delete an order item with optimistic updates
   */
  const handleDeleteItem = useCallback(async (itemId: string) => {
    if (!order) return;

    try {
      // Set loading state
      setLoadingStates(prev => ({ ...prev, deleteItem: itemId }));

      // Find the item to be deleted (for the success message)
      const itemToDelete = order.items.find(item => item.id === itemId);
      if (!itemToDelete) {
        throw new Error('Item not found');
      }

      // Filter out the item to be deleted
      const updatedItems = order.items.filter(item => item.id !== itemId);

      // Create a new order object with the updated items
      const updatedOrder = {
        ...order,
        items: updatedItems
      };

      // Create optimistic data for immediate UI update
      const optimisticData = {
        ...updatedOrder
      };

      // Update the UI immediately with optimistic data
      refreshOrder(optimisticData, false);

      // Call the edit handler with the updated order
      const result = await onEdit(updatedOrder);

      if (!result || !result.success) {
        throw new Error(result?.error?.message || 'Failed to delete item');
      }

      // Show success toast
      toast({
        title: "Item Deleted",
        description: `${itemToDelete.item_name} has been removed from the order.`,
      });

      // Update with the actual server response if available
      if (result.data?.order) {
        await refreshOrder(result.data.order, false);
      } else {
        // If no server data, don't trigger a background refresh
        // Let SWR's normal cache invalidation handle it
        console.log('Not scheduling background refresh - letting SWR handle it');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error Deleting Item",
        description: error instanceof Error ? error.message : 'Failed to delete item',
        variant: "destructive"
      });

      // Refresh to ensure data consistency
      refreshOrder();
    } finally {
      // Clear loading state
      setLoadingStates(prev => ({ ...prev, deleteItem: null }));
    }
  }, [order, onEdit, refreshOrder, toast]);

  /**
   * Add a payment to the order with optimistic updates
   */
  const handleAddPayment = useCallback(async (newPayment: Partial<OrderPayment>) => {
    if (!order) return;

    try {
      // Set loading state
      setLoadingStates(prev => ({ ...prev, addPayment: true }));

      // Create a temporary ID for the optimistic update
      const tempId = `temp-${Date.now()}`;

      // Create a complete payment object
      const paymentToAdd: OrderPayment = {
        id: tempId,
        order_id: order.id,
        amount: newPayment.amount || 0,
        payment_date: newPayment.payment_date || new Date().toISOString().split('T')[0],
        payment_type: newPayment.payment_type || 'cash',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Create a new array with the added payment
      const updatedPayments = [...(order.payments || []), paymentToAdd];

      // Create a new order object with the updated payments
      const updatedOrder = {
        ...order,
        payments: updatedPayments
      };

      // Create optimistic data for immediate UI update
      const optimisticData = {
        ...updatedOrder
      };

      // Update the UI immediately with optimistic data
      refreshOrder(optimisticData, false);

      // Call the edit handler with the updated order
      const result = await onEdit(updatedOrder);

      if (!result || !result.success) {
        throw new Error(result?.error?.message || 'Failed to add payment');
      }

      // Show success toast
      toast({
        title: "Payment Added",
        description: `Payment of ${paymentToAdd.amount.toLocaleString()} has been added to the order.`,
      });

      // Update with the actual server response if available
      if (result.data?.order) {
        await refreshOrder(result.data.order, false);
      } else {
        // If no server data, don't trigger a background refresh
        // Let SWR's normal cache invalidation handle it
        console.log('Not scheduling background refresh - letting SWR handle it');
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: "Error Adding Payment",
        description: error instanceof Error ? error.message : 'Failed to add payment',
        variant: "destructive"
      });

      // Refresh to ensure data consistency
      refreshOrder();
    } finally {
      // Clear loading state
      setLoadingStates(prev => ({ ...prev, addPayment: false }));
    }
  }, [order, onEdit, refreshOrder, toast]);

  /**
   * Update a payment with optimistic updates
   */
  const handleEditPayment = useCallback(async (updatedPayment: OrderPayment) => {
    if (!order) return;

    try {
      // Set loading state
      setLoadingStates(prev => ({ ...prev, editPayment: updatedPayment.id }));

      // Find the payment index in the order payments array
      const paymentIndex = order.payments.findIndex(payment => payment.id === updatedPayment.id);
      if (paymentIndex === -1) {
        throw new Error('Payment not found');
      }

      // Create a new array with the updated payment
      const updatedPayments = [...order.payments];
      updatedPayments[paymentIndex] = updatedPayment;

      // Create a new order object with the updated payments
      const updatedOrder = {
        ...order,
        payments: updatedPayments
      };

      // Create optimistic data for immediate UI update
      const optimisticData = {
        ...updatedOrder
      };

      // Update the UI immediately with optimistic data
      refreshOrder(optimisticData, false);

      // Call the edit handler with the updated order
      const result = await onEdit(updatedOrder);

      if (!result || !result.success) {
        throw new Error(result?.error?.message || 'Failed to update payment');
      }

      // Show success toast
      toast({
        title: "Payment Updated",
        description: `Payment of ${updatedPayment.amount.toLocaleString()} has been successfully updated.`,
      });

      // Update with the actual server response if available
      if (result.data?.order) {
        await refreshOrder(result.data.order, false);
      } else {
        // If no server data, don't trigger a background refresh
        // Let SWR's normal cache invalidation handle it
        console.log('Not scheduling background refresh - letting SWR handle it');
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: "Error Updating Payment",
        description: error instanceof Error ? error.message : 'Failed to update payment',
        variant: "destructive"
      });

      // Refresh to ensure data consistency
      refreshOrder();
    } finally {
      // Clear loading state
      setLoadingStates(prev => ({ ...prev, editPayment: null }));
    }
  }, [order, onEdit, refreshOrder, toast]);

  /**
   * Delete a payment with optimistic updates
   */
  const handleDeletePayment = useCallback(async (paymentId: string) => {
    if (!order) return;

    try {
      // Set loading state
      setLoadingStates(prev => ({ ...prev, deletePayment: paymentId }));

      // Find the payment to be deleted (for the success message)
      const paymentToDelete = order.payments.find(payment => payment.id === paymentId);
      if (!paymentToDelete) {
        throw new Error('Payment not found');
      }

      // Filter out the payment to be deleted
      const updatedPayments = order.payments.filter(payment => payment.id !== paymentId);

      // Create a new order object with the updated payments
      const updatedOrder = {
        ...order,
        payments: updatedPayments
      };

      // Create optimistic data for immediate UI update
      const optimisticData = {
        ...updatedOrder
      };

      // Update the UI immediately with optimistic data
      refreshOrder(optimisticData, false);

      // Call the edit handler with the updated order
      const result = await onEdit(updatedOrder);

      if (!result || !result.success) {
        throw new Error(result?.error?.message || 'Failed to delete payment');
      }

      // Show success toast
      toast({
        title: "Payment Deleted",
        description: `Payment of ${paymentToDelete.amount.toLocaleString()} has been removed from the order.`,
      });

      // Update with the actual server response if available
      if (result.data?.order) {
        await refreshOrder(result.data.order, false);
      } else {
        // If no server data, don't trigger a background refresh
        // Let SWR's normal cache invalidation handle it
        console.log('Not scheduling background refresh - letting SWR handle it');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast({
        title: "Error Deleting Payment",
        description: error instanceof Error ? error.message : 'Failed to delete payment',
        variant: "destructive"
      });

      // Refresh to ensure data consistency
      refreshOrder();
    } finally {
      // Clear loading state
      setLoadingStates(prev => ({ ...prev, deletePayment: null }));
    }
  }, [order, onEdit, refreshOrder, toast]);

  /**
   * Add a note to the order with optimistic updates
   */
  const handleAddNote = useCallback(async (newNote: Partial<OrderNote>) => {
    if (!order) return;

    try {
      // Set loading state
      setLoadingStates(prev => ({ ...prev, addNote: true }));

      // Create a temporary ID for the optimistic update
      const tempId = `temp-${Date.now()}`;

      // Create a complete note object
      const noteToAdd: OrderNote = {
        id: tempId,
        linked_item_id: order.id,
        linked_item_type: 'order',
        type: newNote.type || 'info',
        text: newNote.text || '',
        created_by: newNote.created_by || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Create a new array with the added note
      const updatedNotes = [...(order.notes || []), noteToAdd];

      // Create a new order object with the updated notes
      const updatedOrder = {
        ...order,
        notes: updatedNotes
      };

      // Create optimistic data for immediate UI update
      const optimisticData = {
        ...updatedOrder
      };

      // Update the UI immediately with optimistic data
      refreshOrder(optimisticData, false);

      // Call the edit handler with the updated order
      const result = await onEdit(updatedOrder);

      if (!result || !result.success) {
        throw new Error(result?.error?.message || 'Failed to add note');
      }

      // Show success toast
      toast({
        title: "Note Added",
        description: `Note has been added to the order.`,
      });

      // Update with the actual server response if available
      if (result.data?.order) {
        await refreshOrder(result.data.order, false);
      } else {
        // If no server data, don't trigger a background refresh
        // Let SWR's normal cache invalidation handle it
        console.log('Not scheduling background refresh - letting SWR handle it');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error Adding Note",
        description: error instanceof Error ? error.message : 'Failed to add note',
        variant: "destructive"
      });

      // Refresh to ensure data consistency
      refreshOrder();
    } finally {
      // Clear loading state
      setLoadingStates(prev => ({ ...prev, addNote: false }));
    }
  }, [order, onEdit, refreshOrder, toast]);

  /**
   * Update a note with optimistic updates
   */
  const handleEditNote = useCallback(async (updatedNote: OrderNote) => {
    if (!order) return;

    try {
      // Set loading state
      setLoadingStates(prev => ({ ...prev, editNote: updatedNote.id }));

      // Find the note index in the order notes array
      const noteIndex = order.notes.findIndex(note => note.id === updatedNote.id);
      if (noteIndex === -1) {
        throw new Error('Note not found');
      }

      // Create a new array with the updated note
      const updatedNotes = [...order.notes];
      updatedNotes[noteIndex] = updatedNote;

      // Create a new order object with the updated notes
      const updatedOrder = {
        ...order,
        notes: updatedNotes
      };

      // Create optimistic data for immediate UI update
      const optimisticData = {
        ...updatedOrder
      };

      // Update the UI immediately with optimistic data
      refreshOrder(optimisticData, false);

      // Call the edit handler with the updated order
      const result = await onEdit(updatedOrder);

      if (!result || !result.success) {
        throw new Error(result?.error?.message || 'Failed to update note');
      }

      // Show success toast
      toast({
        title: "Note Updated",
        description: `Note has been successfully updated.`,
      });

      // Update with the actual server response if available
      if (result.data?.order) {
        await refreshOrder(result.data.order, false);
      } else {
        // If no server data, don't trigger a background refresh
        // Let SWR's normal cache invalidation handle it
        console.log('Not scheduling background refresh - letting SWR handle it');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Error Updating Note",
        description: error instanceof Error ? error.message : 'Failed to update note',
        variant: "destructive"
      });

      // Refresh to ensure data consistency
      refreshOrder();
    } finally {
      // Clear loading state
      setLoadingStates(prev => ({ ...prev, editNote: null }));
    }
  }, [order, onEdit, refreshOrder, toast]);

  /**
   * Delete a note with optimistic updates
   */
  const handleDeleteNote = useCallback(async (noteId: string) => {
    if (!order) return;

    try {
      // Set loading state
      setLoadingStates(prev => ({ ...prev, deleteNote: noteId }));

      // Find the note to be deleted
      const noteToDelete = order.notes.find(note => note.id === noteId);
      if (!noteToDelete) {
        throw new Error('Note not found');
      }

      // Filter out the note to be deleted
      const updatedNotes = order.notes.filter(note => note.id !== noteId);

      // Create a new order object with the updated notes
      const updatedOrder = {
        ...order,
        notes: updatedNotes
      };

      // Create optimistic data for immediate UI update
      const optimisticData = {
        ...updatedOrder
      };

      // Update the UI immediately with optimistic data
      refreshOrder(optimisticData, false);

      // Call the edit handler with the updated order
      const result = await onEdit(updatedOrder);

      if (!result || !result.success) {
        throw new Error(result?.error?.message || 'Failed to delete note');
      }

      // Show success toast
      toast({
        title: "Note Deleted",
        description: `Note has been removed from the order.`,
      });

      // Update with the actual server response if available
      if (result.data?.order) {
        await refreshOrder(result.data.order, false);
      } else {
        // If no server data, don't trigger a background refresh
        // Let SWR's normal cache invalidation handle it
        console.log('Not scheduling background refresh - letting SWR handle it');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error Deleting Note",
        description: error instanceof Error ? error.message : 'Failed to delete note',
        variant: "destructive"
      });

      // Refresh to ensure data consistency
      refreshOrder();
    } finally {
      // Clear loading state
      setLoadingStates(prev => ({ ...prev, deleteNote: null }));
    }
  }, [order, onEdit, refreshOrder, toast]);

  return {
    loadingStates,
    handleAddItem,
    handleEditItem,
    handleDeleteItem,
    handleAddPayment,
    handleEditPayment,
    handleDeletePayment,
    handleAddNote,
    handleEditNote,
    handleDeleteNote
  };
}
