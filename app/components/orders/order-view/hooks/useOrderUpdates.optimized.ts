import { useState, useCallback } from 'react';
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

  /**
   * Generic update handler for items, payments, and notes
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
      refreshOrder(updatedOrder, false);

      // Call the edit handler with the updated order
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
        refreshOrder(result.data.order, false);
      } else {
        // If no server data, trigger a background refresh after a delay
        setTimeout(() => refreshOrder(), 500);
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
      // Keep loading state active for a moment to show visual feedback
      setTimeout(() => {
        // Clear loading state
        if (actionType === 'add') {
          setLoadingStates(prev => ({ ...prev, [loadingStateKey]: false }));
        } else {
          setLoadingStates(prev => ({ ...prev, [loadingStateKey]: null }));
        }
      }, 1000); // 1 second delay for better UX
    }
  }, [order, onEdit, refreshOrder, toast]);

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
    // Set loading state immediately for better visual feedback
    setLoadingStates(prev => ({ ...prev, editItem: updatedItem.id }));

    await handleUpdate(
      {
        entityType: 'Item',
        actionType: 'edit',
        entityKey: 'items',
        loadingStateKey: 'editItem',
        successTitle: 'Item Updated',
        errorTitle: 'Error Updating Item',
        getSuccessMessage: (item) => `${item.item_name} has been successfully updated.`,
        getErrorMessage: (error) => error instanceof Error ? error.message : 'Failed to update item'
      },
      updatedItem
    );
  }, [handleUpdate]);

  /**
   * Delete an order item with optimistic updates
   */
  const handleDeleteItem = useCallback(async (itemId: string) => {
    // Set loading state immediately for better visual feedback
    setLoadingStates(prev => ({ ...prev, deleteItem: itemId }));

    await handleUpdate(
      {
        entityType: 'Item',
        actionType: 'delete',
        entityKey: 'items',
        loadingStateKey: 'deleteItem',
        successTitle: 'Item Deleted',
        errorTitle: 'Error Deleting Item',
        getSuccessMessage: (item) => `${item.item_name} has been removed from the order.`,
        getErrorMessage: (error) => error instanceof Error ? error.message : 'Failed to delete item'
      },
      null,
      itemId
    );
  }, [handleUpdate]);

  /**
   * Add a payment to the order with optimistic updates
   */
  const handleAddPayment = useCallback(async (newPayment: Partial<OrderPayment>) => {
    // Create a temporary ID for the optimistic update
    const tempId = `temp-${Date.now()}`;

    // Create a complete payment object with both naming conventions for compatibility
    const paymentToAdd: OrderPayment = {
      id: tempId,
      order_id: order?.id || '',
      amount: newPayment.amount || 0,
      // Support both naming conventions
      payment_date: newPayment.payment_date || new Date().toISOString().split('T')[0],
      date: newPayment.date || newPayment.payment_date || new Date().toISOString().split('T')[0],
      payment_method: newPayment.payment_method || newPayment.payment_type || 'cash',
      payment_type: newPayment.payment_type || newPayment.payment_method || 'cash',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await handleUpdate(
      {
        entityType: 'Payment',
        actionType: 'add',
        entityKey: 'payments',
        loadingStateKey: 'addPayment',
        successTitle: 'Payment Added',
        errorTitle: 'Error Adding Payment',
        getSuccessMessage: (payment) => `Payment of ${payment.amount.toLocaleString()} has been added to the order.`,
        getErrorMessage: (error) => error instanceof Error ? error.message : 'Failed to add payment'
      },
      paymentToAdd
    );
  }, [handleUpdate, order]);

  /**
   * Update a payment with optimistic updates
   */
  const handleEditPayment = useCallback(async (updatedPayment: OrderPayment) => {
    // Set loading state immediately for better visual feedback
    setLoadingStates(prev => ({ ...prev, editPayment: updatedPayment.id }));

    await handleUpdate(
      {
        entityType: 'Payment',
        actionType: 'edit',
        entityKey: 'payments',
        loadingStateKey: 'editPayment',
        successTitle: 'Payment Updated',
        errorTitle: 'Error Updating Payment',
        getSuccessMessage: (payment) => `Payment of ${payment.amount.toLocaleString()} has been successfully updated.`,
        getErrorMessage: (error) => error instanceof Error ? error.message : 'Failed to update payment'
      },
      updatedPayment
    );
  }, [handleUpdate]);

  /**
   * Delete a payment with optimistic updates
   */
  const handleDeletePayment = useCallback(async (paymentId: string) => {
    // Set loading state immediately for better visual feedback
    setLoadingStates(prev => ({ ...prev, deletePayment: paymentId }));

    await handleUpdate(
      {
        entityType: 'Payment',
        actionType: 'delete',
        entityKey: 'payments',
        loadingStateKey: 'deletePayment',
        successTitle: 'Payment Deleted',
        errorTitle: 'Error Deleting Payment',
        getSuccessMessage: (payment) => `Payment of ${payment.amount.toLocaleString()} has been removed from the order.`,
        getErrorMessage: (error) => error instanceof Error ? error.message : 'Failed to delete payment'
      },
      null,
      paymentId
    );
  }, [handleUpdate]);

  /**
   * Add a note to the order with optimistic updates
   */
  const handleAddNote = useCallback(async (newNote: Partial<OrderNote>) => {
    // Create a temporary ID for the optimistic update
    const tempId = `temp-${Date.now()}`;

    // Create a complete note object
    const noteToAdd: OrderNote = {
      id: tempId,
      linked_item_id: order?.id || '',
      linked_item_type: 'order',
      type: newNote.type || 'info',
      text: newNote.text || '',
      created_by: newNote.created_by || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await handleUpdate(
      {
        entityType: 'Note',
        actionType: 'add',
        entityKey: 'notes',
        loadingStateKey: 'addNote',
        successTitle: 'Note Added',
        errorTitle: 'Error Adding Note',
        getSuccessMessage: () => `Note has been added to the order.`,
        getErrorMessage: (error) => error instanceof Error ? error.message : 'Failed to add note'
      },
      noteToAdd
    );
  }, [handleUpdate, order]);

  /**
   * Update a note with optimistic updates
   */
  const handleEditNote = useCallback(async (updatedNote: OrderNote) => {
    // Set loading state immediately for better visual feedback
    setLoadingStates(prev => ({ ...prev, editNote: updatedNote.id }));

    await handleUpdate(
      {
        entityType: 'Note',
        actionType: 'edit',
        entityKey: 'notes',
        loadingStateKey: 'editNote',
        successTitle: 'Note Updated',
        errorTitle: 'Error Updating Note',
        getSuccessMessage: () => `Note has been successfully updated.`,
        getErrorMessage: (error) => error instanceof Error ? error.message : 'Failed to update note'
      },
      updatedNote
    );
  }, [handleUpdate]);

  /**
   * Delete a note with optimistic updates
   */
  const handleDeleteNote = useCallback(async (noteId: string) => {
    // Set loading state immediately for better visual feedback
    setLoadingStates(prev => ({ ...prev, deleteNote: noteId }));

    await handleUpdate(
      {
        entityType: 'Note',
        actionType: 'delete',
        entityKey: 'notes',
        loadingStateKey: 'deleteNote',
        successTitle: 'Note Deleted',
        errorTitle: 'Error Deleting Note',
        getSuccessMessage: () => `Note has been removed from the order.`,
        getErrorMessage: (error) => error instanceof Error ? error.message : 'Failed to delete note'
      },
      null,
      noteId
    );
  }, [handleUpdate]);

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
