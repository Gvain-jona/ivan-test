import { useState, useCallback } from 'react';
import { Order, OrderStatus } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';
import { useOrders } from '@/hooks/useOrders';

/**
 * Custom hook to manage order modals state and functionality
 */
export const useOrderModals = () => {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Modal visibility states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
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

  // Handle edit order - show the edit modal
  const handleEditOrder = useCallback((order: Order) => {
    setSelectedOrder(order);
    setEditModalOpen(true);
    console.log('Edit order:', order.id);
    toast({
      title: "Edit Order",
      description: `Editing order ${order.id}`,
    });
  }, [toast]);

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

  // Handle save order (create or update)
  const handleSaveOrder = useCallback((order: Order) => {
    console.log('Save order:', order);
    toast({
      title: order.id ? "Order Updated" : "Order Created",
      description: order.id ? `Order ${order.id} has been updated` : "New order has been created",
    });
    // Close modals after save
    setEditModalOpen(false);
    setCreateModalOpen(false);
    // In a real app, make API call to save
  }, [toast]);

  return {
    // State
    selectedOrder,
    viewModalOpen,
    editModalOpen,
    createModalOpen,
    invoiceModalOpen,

    // Setters
    setViewModalOpen,
    setEditModalOpen,
    setCreateModalOpen,
    setInvoiceModalOpen,

    // Handlers
    handleViewOrder,
    handleEditOrder,
    handleCreateOrder,
    handleDeleteOrder,
    handleDuplicateOrder,
    handleGenerateInvoice,
    handleOrderStatusChange,
    handleSaveOrder
  };
};