import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Order, OrderItem, OrderPayment, OrderNote } from '@/types/orders';

interface UseOrderUpdatesProps {
  order: Order | null;
  onEdit: (order: Order) => Promise<any>;
  refreshOrder: (optimisticData?: any, shouldRevalidate?: boolean) => Promise<any>;
}

// Enhanced loading states with more granular status tracking
interface EnhancedLoadingState {
  status: 'idle' | 'preparing' | 'submitting' | 'processing' | 'success' | 'error';
  entityId?: string | null;
  message?: string;
  error?: string | null;
  progress?: number; // 0-100 for progress indication
  startTime?: number; // For performance tracking
  endTime?: number; // For performance tracking
}

interface LoadingStates {
  addItem: EnhancedLoadingState;
  editItem: EnhancedLoadingState;
  deleteItem: EnhancedLoadingState;
  addPayment: EnhancedLoadingState;
  editPayment: EnhancedLoadingState;
  deletePayment: EnhancedLoadingState;
  addNote: EnhancedLoadingState;
  editNote: EnhancedLoadingState;
  deleteNote: EnhancedLoadingState;
}

// Define types for the generic update handler
type EntityType = 'Item' | 'Payment' | 'Note';
type ActionType = 'add' | 'edit' | 'delete';

interface UpdateConfig {
  entityType: EntityType;
  actionType: ActionType;
  entityKey: string; // The key in the order object (items, payments, notes)
  loadingStateKey: keyof LoadingStates; // The key in the loadingStates object
  successTitle: string;
  errorTitle: string;
  getSuccessMessage: (entity: any) => string;
  getErrorMessage: (error: any) => string;
}

// Default loading state
const createDefaultLoadingState = (): EnhancedLoadingState => ({
  status: 'idle',
  entityId: null,
  message: undefined,
  error: null,
  progress: undefined,
  startTime: undefined,
  endTime: undefined
});

/**
 * Custom hook for handling order updates with optimistic updates and enhanced loading states
 * This hook provides a consistent way to update order items, payments, and notes
 * with detailed loading states, performance tracking, and optimistic updates
 */
export function useOrderUpdates({ order, onEdit, refreshOrder }: UseOrderUpdatesProps) {
  const { toast } = useToast();

  // Initialize loading states with default values
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    addItem: createDefaultLoadingState(),
    editItem: createDefaultLoadingState(),
    deleteItem: createDefaultLoadingState(),
    addPayment: createDefaultLoadingState(),
    editPayment: createDefaultLoadingState(),
    deletePayment: createDefaultLoadingState(),
    addNote: createDefaultLoadingState(),
    editNote: createDefaultLoadingState(),
    deleteNote: createDefaultLoadingState()
  });

  // Helper to update loading state with proper typing
  const updateLoadingState = useCallback((
    key: keyof LoadingStates,
    updates: Partial<EnhancedLoadingState>
  ) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...updates
      }
    }));
  }, []);

  // Helper to track operation duration
  const trackOperationDuration = useCallback((
    key: keyof LoadingStates,
    status: 'success' | 'error'
  ) => {
    setLoadingStates(prev => {
      const currentState = prev[key];
      const endTime = Date.now();
      const duration = currentState.startTime ? endTime - currentState.startTime : 0;

      // Log performance metrics
      console.log(`Operation ${key} ${status} - Duration: ${duration}ms`);

      return {
        ...prev,
        [key]: {
          ...currentState,
          status,
          endTime,
          progress: 100
        }
      };
    });
  }, []);

  /**
   * Generic update handler for items, payments, and notes with enhanced loading states
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
      // Start timing the operation
      const startTime = Date.now();

      // Set initial loading state
      updateLoadingState(loadingStateKey, {
        status: 'preparing',
        entityId: entityId || entityData?.id,
        message: `Preparing to ${actionType} ${entityType.toLowerCase()}...`,
        startTime,
        progress: 10
      });

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

      // Update loading state to indicate optimistic update
      updateLoadingState(loadingStateKey, {
        status: 'submitting',
        message: `Applying ${actionType} operation...`,
        progress: 30
      });

      // Update the UI immediately with optimistic data
      refreshOrder(updatedOrder, false);

      // Update loading state to indicate server submission
      updateLoadingState(loadingStateKey, {
        status: 'processing',
        message: `Saving changes to server...`,
        progress: 60
      });

      // Call the edit handler with the updated order
      const result = await onEdit(updatedOrder);

      if (!result || !result.success) {
        throw new Error(result?.error?.message || `Failed to ${actionType} ${entityType.toLowerCase()}`);
      }

      // Update loading state to indicate success
      trackOperationDuration(loadingStateKey, 'success');

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

      // Reset loading state after a delay to allow UI to show success state
      setTimeout(() => {
        updateLoadingState(loadingStateKey, createDefaultLoadingState());
      }, 1000);

    } catch (error) {
      console.error(`Error ${actionType}ing ${entityType.toLowerCase()}:`, error);

      // Update loading state to indicate error
      trackOperationDuration(loadingStateKey, 'error');
      updateLoadingState(loadingStateKey, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      toast({
        title: errorTitle,
        description: getErrorMessage(error),
        variant: "destructive"
      });

      // Refresh to ensure data consistency
      refreshOrder();

      // Reset loading state after a delay to allow UI to show error state
      setTimeout(() => {
        updateLoadingState(loadingStateKey, createDefaultLoadingState());
      }, 2000);
    }
  }, [order, onEdit, refreshOrder, toast, updateLoadingState, trackOperationDuration]);

  /**
   * Add a new item to the order with optimistic updates
   * This version uses the dedicated API endpoint for adding items
   */
  const handleAddItem = useCallback(async (newItem: Partial<OrderItem>) => {
    console.log('[useOrderUpdates] handleAddItem called with:', newItem);

    if (!order?.id) {
      console.error('[useOrderUpdates] Order ID is missing');
      throw new Error('Order ID is required to add an item');
    }

    // Set a global flag to indicate that an API call is in progress
    // This will be used to prevent the component from unmounting during the API call
    (window as any).__apiCallInProgress = true;
    console.log('[useOrderUpdates] Set global API call flag to true');

    try {
      // Start timing the operation
      const startTime = Date.now();
      console.log('[useOrderUpdates] Starting add item operation at:', startTime);

      // Set initial loading state
      updateLoadingState('addItem', {
        status: 'preparing',
        message: 'Preparing to add item...',
        startTime,
        progress: 10
      });
      console.log('[useOrderUpdates] Updated loading state to preparing');

      // Create a temporary ID for the optimistic update
      const tempId = newItem.id || `temp-${Date.now()}`;
      console.log('[useOrderUpdates] Generated temporary ID:', tempId);

      // Create a complete item object for optimistic update
      const itemToAdd: OrderItem = {
        id: tempId,
        order_id: order.id,
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
      console.log('[useOrderUpdates] Created complete item object for optimistic update:', itemToAdd);

      // Update loading state to indicate optimistic update
      updateLoadingState('addItem', {
        status: 'submitting',
        message: 'Applying optimistic update...',
        progress: 30
      });
      console.log('[useOrderUpdates] Updated loading state to submitting');

      // Apply optimistic update to the UI
      const updatedOrder = {
        ...order,
        items: [...(order.items || []), itemToAdd]
      };
      console.log('[useOrderUpdates] Applying optimistic update with order:', updatedOrder);
      refreshOrder(updatedOrder, false);

      // Update loading state to indicate server submission
      updateLoadingState('addItem', {
        status: 'processing',
        message: 'Saving item to server...',
        progress: 60
      });
      console.log('[useOrderUpdates] Updated loading state to processing');

      // Call the dedicated API endpoint for adding items
      console.log(`[useOrderUpdates] Calling API endpoint: /api/orders/${order.id}/items`);
      console.log('[useOrderUpdates] Request payload:', { item: newItem });

      let result;
      try {
        const response = await fetch(`/api/orders/${order.id}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ item: newItem }),
        });

        console.log('[useOrderUpdates] API response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('[useOrderUpdates] API error response:', errorData);
          throw new Error(errorData.message || 'Failed to add item');
        }

        result = await response.json();
        console.log('[useOrderUpdates] API success response:', result);
      } catch (error) {
        console.error('[useOrderUpdates] Error in API call:', error);
        throw error;
      }

      // Update loading state to indicate success
      trackOperationDuration('addItem', 'success');
      console.log('[useOrderUpdates] Updated loading state to success');

      // Show success toast
      toast({
        title: 'Item Added',
        description: `${newItem.item_name} has been added to the order.`,
      });
      console.log('[useOrderUpdates] Displayed success toast');

      // Refresh the order data with the server response
      console.log('[useOrderUpdates] Scheduling refresh of order data');
      setTimeout(() => {
        console.log('[useOrderUpdates] Refreshing order data');
        refreshOrder();
      }, 500);

      // Reset loading state after a delay
      console.log('[useOrderUpdates] Scheduling reset of loading state');
      setTimeout(() => {
        console.log('[useOrderUpdates] Resetting loading state');
        updateLoadingState('addItem', createDefaultLoadingState());
        // Clear the global API call flag
        (window as any).__apiCallInProgress = false;
        console.log('[useOrderUpdates] Set global API call flag to false');
      }, 1000);

      return result;
    } catch (error) {
      console.error('[useOrderUpdates] Error adding item:', error);

      // Update loading state to indicate error
      trackOperationDuration('addItem', 'error');
      updateLoadingState('addItem', {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log('[useOrderUpdates] Updated loading state to error');

      toast({
        title: 'Error Adding Item',
        description: error instanceof Error ? error.message : 'Failed to add item',
        variant: "destructive"
      });
      console.log('[useOrderUpdates] Displayed error toast');

      // Refresh to ensure data consistency
      console.log('[useOrderUpdates] Refreshing order data after error');
      refreshOrder();

      // Reset loading state after a delay
      console.log('[useOrderUpdates] Scheduling reset of loading state after error');
      setTimeout(() => {
        console.log('[useOrderUpdates] Resetting loading state after error');
        updateLoadingState('addItem', createDefaultLoadingState());
        // Clear the global API call flag
        (window as any).__apiCallInProgress = false;
        console.log('[useOrderUpdates] Set global API call flag to false');
      }, 2000);

      throw error;
    }
  }, [order, refreshOrder, toast, updateLoadingState, trackOperationDuration]);

  /**
   * Update an order item with optimistic updates
   */
  const handleEditItem = useCallback(async (updatedItem: OrderItem) => {
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

  // Helper function to check if an operation is in progress
  const isLoading = useCallback((key: keyof LoadingStates) => {
    const state = loadingStates[key];
    return state.status !== 'idle' && state.status !== 'success' && state.status !== 'error';
  }, [loadingStates]);

  // Helper function to get loading message for an operation
  const getLoadingMessage = useCallback((key: keyof LoadingStates) => {
    return loadingStates[key].message;
  }, [loadingStates]);

  // Helper function to get error message for an operation
  const getErrorMessage = useCallback((key: keyof LoadingStates) => {
    return loadingStates[key].error;
  }, [loadingStates]);

  // Helper function to get progress for an operation
  const getProgress = useCallback((key: keyof LoadingStates) => {
    return loadingStates[key].progress;
  }, [loadingStates]);

  return {
    // Loading states
    loadingStates,
    isLoading,
    getLoadingMessage,
    getErrorMessage,
    getProgress,

    // Item handlers
    handleAddItem,
    handleEditItem,
    handleDeleteItem,

    // Payment handlers
    handleAddPayment,
    handleEditPayment,
    handleDeletePayment,

    // Note handlers
    handleAddNote,
    handleEditNote,
    handleDeleteNote
  };
}
