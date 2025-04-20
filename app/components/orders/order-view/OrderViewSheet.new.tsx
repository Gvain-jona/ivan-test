import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Calendar, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import OrderSheet from '@/components/ui/sheets/OrderSheet';
import { OrderViewSheetProps } from './types';
import { OrderPayment } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';
import { useOrder } from '@/hooks/useData';

// Import tab components
import OrderDetailsTab from './OrderDetailsTab';
import OrderItemsTab from './OrderItemsTab';
import OrderPaymentsTab from './OrderPaymentsTab';
import OrderNotesTab from './OrderNotesTab';

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
  const { toast } = useToast();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [orderId, setOrderId] = useState<string | undefined>(initialOrder?.id);

  // Fetch order data directly using the useOrder hook
  const { order: fetchedOrder, isLoading, isError, mutate: refreshOrderBase } = useOrder(orderId);

  // Use the fetched order if available, otherwise fall back to the initial order
  const order = fetchedOrder || initialOrder;

  // Enhanced refreshOrder function with better optimistic updates
  const refreshOrder = async (optimisticData?: any, shouldRevalidate: boolean = true) => {
    try {
      // If optimistic data is provided, update the cache immediately
      if (optimisticData) {
        // Update the cache with the optimistic data
        refreshOrderBase(optimisticData, false);

        // If we should revalidate, do it after a short delay
        if (shouldRevalidate) {
          setTimeout(() => refreshOrderBase(), 500);
        }
      } else {
        // Just do a normal revalidation
        return refreshOrderBase();
      }
    } catch (error) {
      console.error('Error in refreshOrder:', error);
      // Revalidate to ensure data consistency
      return refreshOrderBase();
    }
  };

  // Use our custom hook for order updates with optimistic updates
  const {
    loadingStates,
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

  // Update orderId when initialOrder changes
  useEffect(() => {
    if (initialOrder?.id && initialOrder.id !== orderId) {
      setOrderId(initialOrder.id);
    }
  }, [initialOrder, orderId]);

  // Determine if the user can edit based on role
  const canEdit = ['admin', 'manager'].includes(userRole);

  /**
   * Calculate the balance percent for the progress bar
   */
  const calculateBalancePercent = () => {
    if (!order || order.total_amount === 0) return 0;
    return (order.amount_paid / order.total_amount) * 100;
  };

  /**
   * Handle payment form submission
   */
  const onPaymentSubmit = async (newPayment: OrderPayment) => {
    // Add the payment using our optimistic update hook
    await handleAddPayment(newPayment);
    // Hide the payment form after successful submission
    setShowPaymentForm(false);
  };

  // Add an effect to refresh the order data when the order ID changes
  useEffect(() => {
    if (orderId) {
      refreshOrder();
    }
  }, [orderId]);

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
      {isLoading && !order ? (
        <div className="p-6 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading order details...</p>
        </div>
      ) : isError && !order ? (
        <div className="p-6 flex flex-col items-center justify-center space-y-4">
          <p className="text-sm text-destructive">Error loading order details. Please try again.</p>
          <Button variant="outline" onClick={() => refreshOrder()}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="p-6">
        <div className="space-y-8">
          {/* Order Details Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border/40 pb-2">
              <h3 className="text-lg font-semibold">Order Details</h3>
              <Button
                onClick={() => order && onGenerateInvoice(order)}
                variant="outline"
                size="sm"
                className="border-[#2B2B40] bg-transparent hover:bg-white/[0.02] text-[#6D6D80] hover:text-white"
              >
                <Printer className="mr-2 h-4 w-4" />
                Generate Invoice
              </Button>
            </div>
            {order && (
              <OrderDetailsTab
                order={order}
                calculateBalancePercent={calculateBalancePercent}
              />
            )}
          </div>

          {/* Order Items Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border/40 pb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Order Items</h3>
                {order && Array.isArray(order.items) && order.items.length > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-white/15 text-white border border-white/30">
                    {order.items.length}
                  </span>
                )}
              </div>
            </div>
            {order && <OrderItemsTab
              order={order}
              canEdit={canEdit}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
              loadingStates={{
                editItem: loadingStates.editItem,
                deleteItem: loadingStates.deleteItem
              }}
            />}
          </div>

          {/* Payments Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border/40 pb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Payments</h3>
                {order && Array.isArray(order.payments) && order.payments.length > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/15 text-green-400 border border-green-500/30">
                    {order.payments.length}
                  </span>
                )}
              </div>
            </div>
            <OrderPaymentsTab
              order={order ? {
                ...order,
                // Ensure payments is always an array
                payments: Array.isArray(order.payments) ? order.payments : []
              } : null}
              showPaymentForm={showPaymentForm}
              setShowPaymentForm={setShowPaymentForm}
              canEdit={canEdit}
              onAddPayment={onPaymentSubmit}
              onEditPayment={handleEditPayment}
              onDeletePayment={handleDeletePayment}
              loadingStates={{
                addPayment: loadingStates.addPayment,
                editPayment: loadingStates.editPayment,
                deletePayment: loadingStates.deletePayment
              }}
            />
          </div>

          {/* Notes Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border/40 pb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Notes</h3>
                {order && Array.isArray(order.notes) && order.notes.length > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    {order.notes.length}
                  </span>
                )}
              </div>
            </div>
            {order && <OrderNotesTab order={{
              ...order,
              // Ensure notes is always an array
              notes: Array.isArray(order.notes) ? order.notes : []
            }}
              canEdit={canEdit}
              onEditNote={handleEditNote}
              onDeleteNote={handleDeleteNote}
              loadingStates={{
                editNote: loadingStates.editNote,
                deleteNote: loadingStates.deleteNote
              }}
            />}
          </div>
        </div>
      </div>
      )}
    </OrderSheet>
  );
};

export default OrderViewSheet;
