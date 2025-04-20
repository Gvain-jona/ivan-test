import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useOrdersPage } from '@/app/dashboard/orders/_context/OrdersPageContext';
import { Button } from '@/components/ui/button';
import { Printer, Calendar, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import OrderSheet from '@/components/ui/sheets/OrderSheet';
import { OrderViewSheetProps } from './types';
import { OrderPayment } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';
import { useOrder } from '@/hooks/useData';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import { createSWRConfig } from '@/lib/swr-config';
import { invalidateOrderCache } from '@/lib/cache-utils';

// Import shared components
import SectionHeader from './components/SectionHeader';

// Import tab components
import OrderDetailsTab from './OrderDetailsTab';
import OrderItemsTab from './OrderItemsTab';
import OrderPaymentsTab from './OrderPaymentsTab';
import OrderNotesTab from './OrderNotesTab';

// Import modal components
import AddOrderItemModal from './AddOrderItemModal.simplified';
import AddOrderPaymentModal from './AddOrderPaymentModal.simplified';
import AddOrderNoteModal from './AddOrderNoteModal.simplified';

// Import custom hooks
import { useOrderUpdates } from './hooks/useOrderUpdates';

/**
 * OrderViewSheet displays order details in a side panel
 */
const OrderViewSheet: React.FC<OrderViewSheetProps> = ({
  open,
  onOpenChange,
  order: initialOrder,
  onClose,
  onEdit,
  onGenerateInvoice,
  userRole = 'user'
}) => {
  // State for the OrderViewSheet component
  const { toast } = useToast();
  // Get the active modal state from context
  const { activeModal } = useOrdersPage();
  // Use state for orderId to ensure it updates when initialOrder changes
  const [orderId, setOrderId] = useState<string | undefined>(initialOrder?.id);

  // State for modals
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);

  // Update orderId when initialOrder changes, but only if it's different
  useEffect(() => {
    if (initialOrder?.id && initialOrder.id !== orderId) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('OrderViewSheet - Updating orderId from', orderId, 'to', initialOrder.id);
      }
      setOrderId(initialOrder.id);
    }
  }, [initialOrder, orderId]); // Include orderId to prevent unnecessary updates

  // Create a unique SWR key that includes both the order ID and open state
  // This ensures SWR fetches only when the sheet is open
  const orderKey = useMemo(() => {
    const key = open && orderId ? `${API_ENDPOINTS.ORDERS}/${orderId}` : null;
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('OrderViewSheet - SWR key:', key);
    }
    return key;
  }, [open, orderId]);

  // Fetch order data only when the sheet is open and we have an orderId
  const { order: fetchedOrder, isLoading, isError, mutate: refreshOrderBase } = useOrder(orderKey, {
    fallbackData: initialOrder, // Use initialOrder as fallback data
    ...createSWRConfig('detail', {
      // Only revalidate on mount if we don't have complete data in initialOrder
      revalidateOnMount: !initialOrder?.items || initialOrder.items.length === 0,
    }),
  });

  // Use the fetched order if available, otherwise fall back to the initial order
  const order = fetchedOrder || initialOrder;

  // Ensure order always has arrays for items, payments, and notes
  if (order) {
    if (!order.items) order.items = [];
    if (!order.payments) order.payments = [];
    if (!order.notes) order.notes = [];
  }

  // Debug log to track order data flow - only in development and only when data changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && order) {
      console.log('OrderViewSheet - Current order data:', {
        id: order.id,
        order_number: order.order_number,
        client_name: order.client_name,
        items: order.items?.length || 0,
        payments: order.payments?.length || 0,
        notes: order.notes?.length || 0,
        source: order === fetchedOrder ? 'fetchedOrder' : 'initialOrder'
      });
    }
  }, [order, fetchedOrder]); // Depend on actual data changes, not just orderId

  // Optimized refreshOrder function with debounced revalidation and request batching
  const refreshOrder = useCallback(async (optimisticData?: any, shouldRevalidate: boolean = true) => {
    try {
      // If optimistic data is provided, update the cache immediately
      if (optimisticData) {
        // Update the cache with the optimistic data without triggering a revalidation
        await refreshOrderBase(optimisticData, false);

        // If we should revalidate, do it after a delay, but only if the component is still mounted
        if (shouldRevalidate) {
          // Store the current orderId to check if it changes
          const currentOrderId = orderId;
          // Use a longer delay to allow multiple optimistic updates to batch
          setTimeout(() => {
            // Only revalidate if the orderId hasn't changed (component still showing the same order)
            if (currentOrderId === orderId) {
              refreshOrderBase();
            }
          }, 2000); // Increased to 2 seconds to allow more batching
        }
      } else {
        // Just do a normal revalidation, but only if we have an orderId
        if (orderId) {
          return refreshOrderBase();
        }
      }
    } catch (error) {
      console.error('Error in refreshOrder:', error);
      // Only revalidate if we have an orderId
      if (orderId) {
        return refreshOrderBase();
      }
    }
  }, [refreshOrderBase, orderId]);

  // Use our custom hook for order updates with optimistic updates
  const {
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
  } = useOrderUpdates({
    order,
    onEdit: async (updatedOrder) => {
      try {
        const response = await onEdit(updatedOrder);
        return response;
      } catch (error) {
        console.error('Error in onEdit:', error);
        throw error;
      }
    },
    refreshOrder
  });

  // No need to update orderId since it's derived from initialOrder

  // Handle sheet closing without clearing cache unnecessarily
  useEffect(() => {
    if (!open) {
      // Small delay to ensure the sheet is closed before calling onClose
      const timer = setTimeout(() => {
        if (!open && onClose) {
          onClose();
          // Log but don't clear cache - we'll let SWR handle cache management
          if (orderId && activeModal === 'invoice') {
            console.log('OrderViewSheet - NOT clearing SWR cache because invoice modal is open');
          }
        }
      }, 300);
      return () => clearTimeout(timer);
    }

    // Cleanup function - log but don't clear cache to prevent unnecessary API calls
    return () => {
      if (orderId) {
        // Check if any operations are in progress
        const globalApiCallInProgress = !!(window as any).__apiCallInProgress;
        const anyLoadingStateInProgress = [
          'addItem', 'editItem', 'deleteItem',
          'addPayment', 'editPayment', 'deletePayment',
          'addNote', 'editNote', 'deleteNote'
        ].some(key => {
          const status = loadingStates[key]?.status;
          return status === 'processing' ||
                 status === 'submitting' ||
                 status === 'preparing' ||
                 status === 'loading';
        });

        const anyOperationInProgress = globalApiCallInProgress || anyLoadingStateInProgress;
        const invoiceModalOpen = activeModal === 'invoice';

        // Just log the state but don't clear cache - let SWR handle cache management
        if (anyOperationInProgress) {
          console.log('OrderViewSheet - Component unmounting, operations in progress');
        } else if (invoiceModalOpen) {
          console.log('OrderViewSheet - Component unmounting, invoice modal is open');
        } else {
          console.log('OrderViewSheet - Component unmounting normally');
        }
      }
    };
  }, [open, onClose, orderId, refreshOrderBase, activeModal, loadingStates]);

  // Determine if the user can edit based on role
  const canEdit = ['admin', 'manager'].includes(userRole);

  /**
   * Calculate the balance percent for the progress bar
   */
  const calculateBalancePercent = () => {
    if (!order || order.total_amount === 0) return 0;
    return (order.amount_paid / order.total_amount) * 100;
  };

  // Payment submission will be handled by a separate component in Phase 2

  // We don't need to manually refresh the order data when the order ID changes
  // because SWR will handle this automatically when the key (orderId) changes

  // Create a custom header with client avatar and order details
  const renderCustomHeader = () => {
    if (!order) return null;

    return (
      <div className="flex items-start gap-4">
        {/* Client Avatar */}
        <Avatar className="h-12 w-12 border-2 border-border/40">
          <AvatarFallback className="bg-gradient-to-r from-primary to-orange-600 text-white">
            {getInitials(order.client_name || '')}
          </AvatarFallback>
        </Avatar>

        {/* Order Details */}
        <div className="flex-1">
          {/* Client Name as Main Title */}
          <h2 className="text-xl font-semibold">{order.client_name}</h2>

          {/* Order Number and Date as Subtitle */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">Order {order.order_number || (order.id ? `#${order.id.substring(0, 8)}` : 'Unknown')}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(order.date).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <OrderSheet
      open={open}
      onOpenChange={onOpenChange}
      title={order ? `Order ${order.order_number || (order.id ? `#${order.id.substring(0, 8)}` : 'Unknown')}` : 'Order Details'}
      description={isLoading ? 'Loading order details...' : (isError ? 'Error loading order details' : '')}
      onClose={onClose}
      size="lg"
      customHeader={order ? renderCustomHeader() : undefined}
    >
      {isError && !order ? (
        <div className="p-6 flex flex-col items-center justify-center space-y-4">
          <p className="text-sm text-destructive">Error loading order details. Please try again.</p>
          <Button variant="outline" onClick={() => refreshOrder()}>
            Retry
          </Button>
        </div>
      ) : isLoading && !order && !initialOrder ? (
        <div className="p-6 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading order details...</p>
        </div>
      ) : (
        <div className="p-6">
        <div className="space-y-8">
          {/* Order Details Section */}
          <div className="space-y-4">
            <SectionHeader
              title="Order Details"
              actions={
                <Button
                  onClick={() => order && onGenerateInvoice(order)}
                  variant="outline"
                  size="sm"
                  className="border-[#2B2B40] bg-transparent hover:bg-white/[0.02] text-[#6D6D80] hover:text-white"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Generate Invoice
                </Button>
              }
            />
            {order && (
              <OrderDetailsTab
                order={order}
                calculateBalancePercent={calculateBalancePercent}
              />
            )}
          </div>

          {/* Order Items Section */}
          <div className="space-y-4">
            <SectionHeader
              title="Order Items"
              count={order?.items?.length}
              badgeColor="white"
            />
            {order && <OrderItemsTab
              order={order}
              onEdit={onEdit}
              refreshOrder={refreshOrder}
              isLoading={isLoading}
              isError={isError}
              canEdit={true}
              onAddItem={handleAddItem}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
              loadingStates={{
                addItem: loadingStates?.addItem || false,
                editItem: loadingStates?.editItem || null,
                deleteItem: loadingStates?.deleteItem || null
              }}
              onAddItemClick={(orderId) => {
                console.log('Add item clicked for order:', orderId);
                setShowAddItemModal(true);
              }}
            />}
          </div>

          {/* Payments Section */}
          <div className="space-y-4">
            <SectionHeader
              title="Payments"
              count={order?.payments?.length}
              badgeColor="green"
            />
            <OrderPaymentsTab
              order={order}
              onEdit={onEdit}
              refreshOrder={refreshOrder}
              isLoading={isLoading}
              isError={isError}
              loadingStates={{
                editPayment: loadingStates?.editPayment || null,
                deletePayment: loadingStates?.deletePayment || null
              }}
              onAddPaymentClick={(orderId) => {
                console.log('Add payment clicked for order:', orderId);
                setShowAddPaymentModal(true);
              }}
            />
          </div>

          {/* Notes Section */}
          <div className="space-y-4">
            <SectionHeader
              title="Notes"
              count={order?.notes?.length}
              badgeColor="purple"
            />
            {order && <OrderNotesTab
              order={order}
              onEdit={onEdit}
              refreshOrder={refreshOrder}
              isLoading={isLoading}
              isError={isError}
              loadingStates={{
                editNote: loadingStates?.editNote || null,
                deleteNote: loadingStates?.deleteNote || null
              }}
              onAddNoteClick={(orderId) => {
                console.log('Add note clicked for order:', orderId);
                setShowAddNoteModal(true);
              }}
            />}
          </div>
        </div>
      </div>
      )}

      {/* Footer area removed as we're moving to inline editing */}

      {/* Modals */}
      <AddOrderItemModal
        isOpen={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        orderId={order?.id || ''}
        order={order}
        onSuccess={() => {
          // Refresh the order data and invalidate the orders list cache
          refreshOrder();
          if (order?.id) {
            // Pass the order to the invalidateOrderCache function for optimistic updates
            invalidateOrderCache(order.id, order);
          }
        }}
      />

      <AddOrderPaymentModal
        isOpen={showAddPaymentModal}
        onClose={() => setShowAddPaymentModal(false)}
        orderId={order?.id || ''}
        order={order}
        onSuccess={() => {
          // Refresh the order data and invalidate the orders list cache
          refreshOrder();
          if (order?.id) {
            // Pass the order to the invalidateOrderCache function for optimistic updates
            invalidateOrderCache(order.id, order);
          }
        }}
      />

      <AddOrderNoteModal
        isOpen={showAddNoteModal}
        onClose={() => setShowAddNoteModal(false)}
        orderId={order?.id || ''}
        order={order}
        onSuccess={() => {
          // Refresh the order data and invalidate the orders list cache
          refreshOrder();
          if (order?.id) {
            // Pass the order to the invalidateOrderCache function for optimistic updates
            invalidateOrderCache(order.id, order);
          }
        }}
      />
    </OrderSheet>
  );
};

export default OrderViewSheet;
