import { useState, useCallback } from 'react';
import { Order, OrderStatus } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';
import { useOrders } from '@/hooks/useData';
import { createSWRConfig } from '@/lib/swr-config';

/**
 * Custom hook to manage order modals state and functionality
 */
export const useOrderModals = () => {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Modal visibility states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  // Handle view order - show the view modal
  const handleViewOrder = useCallback((order: Order) => {
    setSelectedOrder(order);
    setViewModalOpen(true);
    console.log('View order:', order.id);
    toast({
      title: "Order Details",
      description: `Viewing details for order ${order.id}`,
    });
  }, [toast]);

  // Edit functionality has been consolidated to use only inline editing in the OrderViewSheet

  // Handle create new order - show the create modal
  const handleCreateOrder = useCallback(() => {
    setSelectedOrder(null);
    setCreateModalOpen(true);
    toast({
      title: "New Order",
      description: "Creating a new order",
    });
  }, [toast]);

  // Handle delete order
  const handleDeleteOrder = useCallback((order: Order) => {
    console.log('Delete order:', order.id);
    // In a real app, make API call to delete
    // Only show toast after successful deletion
    toast({
      title: "Order Deleted",
      description: `Order ${order.id} has been deleted`,
    });
  }, [toast]);

  // Handle duplicate order
  const handleDuplicateOrder = useCallback((order: Order) => {
    console.log('Duplicate order:', order.id);
    toast({
      title: "Order Duplicated",
      description: `Created a copy of order ${order.id}`,
    });
    // In a real app, make API call to duplicate
  }, [toast]);

  // Handle generate or view invoice
  const handleGenerateInvoice = useCallback(async (order: Order) => {
    setSelectedOrder(order);
    setInvoiceModalOpen(true);

    // Check if this order already has an invoice
    const hasInvoice = order.latest_invoice_id || order.invoice_generated_at;

    console.log(hasInvoice ? 'View invoice for order:' : 'Generate invoice for order:', order.id);

    toast({
      title: hasInvoice ? "View Invoice" : "Generate Invoice",
      description: hasInvoice
        ? `Viewing invoice for order ${order.id}`
        : `Preparing invoice for order ${order.id}`,
    });
  }, [toast]);

  // Get the updateOrderStatus function from our consolidated hook
  // We're only using this for the type, the actual function is passed from the context
  const { updateOrderStatus: _updateOrderStatus } = useOrders();

  // Handle order status change
  const handleOrderStatusChange = useCallback(async (order: Order, status: OrderStatus) => {
    console.log('Change order status:', order.id, 'to', status);

    try {
      // We'll implement this in the OrdersPageContext using our consolidated hook
      // This is just a placeholder that will be overridden
      toast({
        title: "Status Updated",
        description: `Order ${order.order_number || order.id.substring(0, 8)} is now ${status}`,
      });
      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: `Failed to update order status`,
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Handle inline edit for order items, payments, and notes without opening the edit modal
  const handleInlineEdit = useCallback(async (order: Order) => {
    console.log('Inline edit order:', order);

    // Log detailed information about items, payments, and notes
    if (order.items) {
      console.log('Items to update:', order.items.length);
      order.items.forEach((item, index) => {
        console.log(`Item ${index + 1}:`, {
          id: item.id,
          order_id: item.order_id,
          item_id: item.item_id,
          category_id: item.category_id,
          item_name: item.item_name,
          category_name: item.category_name,
          size: item.size,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_amount: item.total_amount
        });
      });
    }

    if (order.payments) {
      console.log('Payments to update:', order.payments.length);
    }

    if (order.notes) {
      console.log('Notes to update:', order.notes.length);
    }

    try {
      // Extract only the fields we need to update
      const { id, items, payments, notes, total_amount, amount_paid, balance, payment_status } = order;

      // Validate required fields
      if (!id) {
        throw new Error('Order ID is required');
      }

      // Make API call to save the order using the inline-edit endpoint
      // IMPORTANT: We must NOT send total_amount, amount_paid, or payment_status
      // These fields are managed by database triggers and have constraints
      const response = await fetch(`/api/orders/${id}/inline-edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items,
          payments,
          notes
          // Do not include total_amount, amount_paid, balance, or payment_status
          // These are calculated by database triggers
        })
      });

      if (!response.ok) {
        // Try to get detailed error message from the response
        const errorData = await response.json().catch(() => null);
        console.error('API error response:', errorData);

        // Extract the error message from the response
        const errorMessage = errorData?.message ||
                            errorData?.error?.message ||
                            `Failed to update order (${response.status})`;

        throw new Error(errorMessage);
      }

      const result = await response.json();

      // Note: We don't show a toast here because the individual components will show their own toasts

      // Update the selected order with the latest data from the API
      if (result.order) {
        setSelectedOrder(result.order);
      } else {
        // If the API doesn't return the updated order, use the one we have
        setSelectedOrder(order);
      }

      return { success: true, data: result };
    } catch (error) {
      console.error(`Error updating order:`, error);

      // Provide more specific error message
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });

      return { success: false, error };
    }
  }, [toast]);

  // Handle save order (create or update)
  const handleSaveOrder = useCallback(async (order: Order) => {
    console.log('Save order:', order);

    try {
      // Make API call to save the order
      const response = await fetch('/api/orders', {
        method: order.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(order)
      });

      if (!response.ok) {
        throw new Error(`Failed to ${order.id ? 'update' : 'create'} order`);
      }

      const result = await response.json();

      toast({
        title: order.id ? "Order Updated" : "Order Created",
        description: order.id ? `Order ${order.id} has been updated` : "New order has been created",
      });

      // Close modal after save
      setCreateModalOpen(false);

      return { success: true, data: result };
    } catch (error) {
      console.error(`Error ${order.id ? 'updating' : 'creating'} order:`, error);

      toast({
        title: "Error",
        description: `Failed to ${order.id ? 'update' : 'create'} order`,
        variant: "destructive"
      });

      return { success: false, error };
    }
  }, [toast]);

  return {
    // State
    selectedOrder,
    viewModalOpen,
    createModalOpen,
    invoiceModalOpen,

    // Setters
    setViewModalOpen,
    setCreateModalOpen,
    setInvoiceModalOpen,

    // Handlers
    handleViewOrder,
    handleCreateOrder,
    handleDeleteOrder,
    handleDuplicateOrder,
    handleGenerateInvoice,
    handleOrderStatusChange,
    handleSaveOrder,
    handleInlineEdit
  };
};