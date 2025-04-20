import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Calendar, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import OrderSheet from '@/components/ui/sheets/OrderSheet';
import { OrderViewSheetProps } from './types';
import { OrderPayment } from '@/types/orders';
import { useOrder } from '@/hooks/useData';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrderDetailsTab } from './OrderDetailsTab';
import { OrderItemsTab } from './OrderItemsTab.enhanced';
import { OrderPaymentsTab } from './OrderPaymentsTab';
import { OrderNotesTab } from './OrderNotesTab';
import { OrderInvoiceTab } from './OrderInvoiceTab';
import { useOrderUpdates } from './hooks/useOrderUpdates.enhanced';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

/**
 * Enhanced OrderViewSheet component with improved loading states and data handling
 */
export const OrderViewSheet: React.FC<OrderViewSheetProps> = ({
  open,
  onClose,
  initialOrder,
  onPrint,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  
  // Use state for orderId to ensure it updates when initialOrder changes
  const [orderId, setOrderId] = useState<string | undefined>(initialOrder?.id);
  
  // Update orderId when initialOrder changes
  useEffect(() => {
    if (initialOrder?.id) {
      console.log('OrderViewSheet - Updating orderId from', orderId, 'to', initialOrder.id);
      setOrderId(initialOrder.id);
    }
  }, [initialOrder]); // Only depend on initialOrder to avoid infinite loops
  
  // Create a unique SWR key that includes both the order ID and open state
  const orderKey = useMemo(() => {
    const key = open && orderId ? `${API_ENDPOINTS.ORDERS}/${orderId}` : null;
    console.log('OrderViewSheet - SWR key:', key);
    return key;
  }, [open, orderId]);
  
  // Fetch order data only when the sheet is open and we have an orderId
  const { 
    order: fetchedOrder, 
    isLoading, 
    isError, 
    mutate: refreshOrderBase 
  } = useOrder(orderKey, {
    fallbackData: initialOrder, // Use initialOrder as fallback data
    revalidateOnMount: true, // Always revalidate to ensure fresh data
    keepPreviousData: false, // Don't keep previous data to avoid showing stale data
    revalidateOnFocus: false, // Don't revalidate on focus to avoid unnecessary API calls
    dedupingInterval: 0, // Disable deduping to ensure fresh data on each request
  });
  
  // Use the fetched order if available, otherwise fall back to the initial order
  const order = fetchedOrder || initialOrder;
  
  // Ensure order always has arrays for items, payments, and notes
  if (order) {
    if (!order.items) order.items = [];
    if (!order.payments) order.payments = [];
    if (!order.notes) order.notes = [];
  }
  
  // Debug log to track order data flow - only log when orderId changes to avoid infinite loops
  useEffect(() => {
    if (order) {
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
  }, [orderId]); // Only depend on orderId to avoid infinite loops
  
  // Wrap the refresh function to handle optimistic updates
  const refreshOrder = async (optimisticData?: any, shouldRevalidate = true) => {
    return refreshOrderBase(optimisticData, shouldRevalidate);
  };
  
  // Use our enhanced order updates hook
  const { 
    loadingStates,
    handleAddPayment,
    handleEditPayment,
    handleDeletePayment
  } = useOrderUpdates({ 
    order, 
    onEdit: async (updatedOrder) => {
      try {
        // Call the API to update the order
        const response = await fetch(`/api/orders/${updatedOrder.id}/inline-edit`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedOrder),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update order');
        }
        
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Error updating order:', error);
        return {
          success: false,
          error: {
            message: error instanceof Error ? error.message : 'Failed to update order'
          }
        };
      }
    },
    refreshOrder
  });
  
  // Handle payment submission
  const handlePaymentSubmit = async (payment: Partial<OrderPayment>) => {
    await handleAddPayment(payment);
    setShowPaymentForm(false);
  };
  
  // Clear order data when sheet is closed
  useEffect(() => {
    if (!open) {
      // Small delay to ensure the sheet is closed before clearing data
      const timer = setTimeout(() => {
        if (!open && onClose) {
          onClose();
          // Clear the SWR cache for this order
          if (orderId) {
            console.log('OrderViewSheet - Clearing SWR cache for order:', orderId);
            refreshOrderBase(undefined, true);
          }
        }
      }, 300);
      return () => clearTimeout(timer);
    }
    
    // Cleanup function to clear the SWR cache when the component unmounts
    return () => {
      if (orderId) {
        console.log('OrderViewSheet - Component unmounting, clearing SWR cache for order:', orderId);
        refreshOrderBase(undefined, true);
      }
    };
  }, [open, onClose, orderId, refreshOrderBase]);
  
  // If no order data is available, show a loading state
  if (!order && isLoading) {
    return (
      <OrderSheet open={open} onClose={onClose} className="sm:max-w-xl">
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </OrderSheet>
    );
  }
  
  // If there was an error loading the order, show an error state
  if (!order && isError) {
    return (
      <OrderSheet open={open} onClose={onClose} className="sm:max-w-xl">
        <div className="flex flex-col justify-center items-center h-96 text-center">
          <div className="text-destructive mb-4">Failed to load order details</div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </OrderSheet>
    );
  }
  
  // If no order data is available and we're not loading, close the sheet
  if (!order && !isLoading) {
    if (onClose) onClose();
    return null;
  }

  return (
    <OrderSheet open={open} onClose={onClose} className="sm:max-w-xl">
      {order && (
        <>
          {/* Header */}
          <div className="px-6 py-4 border-b border-border/40">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3 bg-orange-100">
                  <AvatarFallback className="bg-orange-100 text-orange-700">
                    {getInitials(order.client_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">{order.client_name}</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="bg-background">
                      {order.order_number}
                    </Badge>
                    <span className="text-muted-foreground">•</span>
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      {formatDate(order.created_at)}
                    </div>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => onPrint && onPrint(order)}
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <div className="px-6 pt-4 border-b border-border/40">
              <TabsList className="grid grid-cols-5 h-9">
                <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
                <TabsTrigger value="items" className="text-xs">
                  Items
                  {order.items?.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1">
                      {order.items.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="payments" className="text-xs">
                  Payments
                  {order.payments?.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1">
                      {order.payments.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="notes" className="text-xs">
                  Notes
                  {order.notes?.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1">
                      {order.notes.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="invoice" className="text-xs">Invoice</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="details" className="p-6 m-0 h-full">
                <OrderDetailsTab
                  order={order}
                  onStatusChange={onStatusChange}
                  refreshOrder={refreshOrder}
                />
              </TabsContent>
              
              <TabsContent value="items" className="p-6 m-0 h-full">
                <OrderItemsTab
                  order={order}
                  onEdit={async (updatedOrder) => {
                    try {
                      // Call the API to update the order
                      const response = await fetch(`/api/orders/${updatedOrder.id}/inline-edit`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(updatedOrder),
                      });
                      
                      if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to update order');
                      }
                      
                      const result = await response.json();
                      return result;
                    } catch (error) {
                      console.error('Error updating order:', error);
                      return {
                        success: false,
                        error: {
                          message: error instanceof Error ? error.message : 'Failed to update order'
                        }
                      };
                    }
                  }}
                  refreshOrder={refreshOrder}
                  isLoading={isLoading}
                  isError={isError}
                />
              </TabsContent>
              
              <TabsContent value="payments" className="p-6 m-0 h-full">
                <OrderPaymentsTab
                  order={order}
                  onAddPayment={() => setShowPaymentForm(true)}
                  onEditPayment={handleEditPayment}
                  onDeletePayment={handleDeletePayment}
                  showPaymentForm={showPaymentForm}
                  onPaymentSubmit={handlePaymentSubmit}
                  onCancelPaymentForm={() => setShowPaymentForm(false)}
                  isLoading={isLoading}
                  isError={isError}
                  loadingStates={loadingStates}
                />
              </TabsContent>
              
              <TabsContent value="notes" className="p-6 m-0 h-full">
                <OrderNotesTab
                  order={order}
                  onEdit={async (updatedOrder) => {
                    try {
                      // Call the API to update the order
                      const response = await fetch(`/api/orders/${updatedOrder.id}/inline-edit`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(updatedOrder),
                      });
                      
                      if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to update order');
                      }
                      
                      const result = await response.json();
                      return result;
                    } catch (error) {
                      console.error('Error updating order:', error);
                      return {
                        success: false,
                        error: {
                          message: error instanceof Error ? error.message : 'Failed to update order'
                        }
                      };
                    }
                  }}
                  refreshOrder={refreshOrder}
                  isLoading={isLoading}
                  isError={isError}
                />
              </TabsContent>
              
              <TabsContent value="invoice" className="p-6 m-0 h-full">
                <OrderInvoiceTab
                  order={order}
                  onPrint={() => onPrint && onPrint(order)}
                />
              </TabsContent>
            </div>
          </Tabs>
        </>
      )}
    </OrderSheet>
  );
};
