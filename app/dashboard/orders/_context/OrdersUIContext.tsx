'use client';

import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { Order, OrderStatus } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';
import { useOrdersStore } from './OrdersStoreContext';

interface OrdersUIContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedOrder: Order | null;
  viewSheetOpen: boolean;
  createSheetOpen: boolean;
  invoiceSheetOpen: boolean;
  setViewSheetOpen: (open: boolean) => void;
  setCreateSheetOpen: (open: boolean) => void;
  setInvoiceSheetOpen: (open: boolean) => void;
  handleViewOrder: (order: Order) => void;
  handleCreateOrder: () => void;
  handleGenerateInvoice: (order: Order) => Promise<void>;
  handleDeleteOrder: (orderId: string) => Promise<boolean>;
  handleOrderStatusChange: (orderId: string, status: OrderStatus) => Promise<boolean>;
  handleSaveOrder: (order: Order) => Promise<{ success: boolean; data?: unknown; error?: unknown }>;
  handleInlineEdit: (order: Order) => Promise<{ success: boolean; data?: unknown; error?: unknown }>;
}

const OrdersUIContext = createContext<OrdersUIContextType | undefined>(undefined);

export const OrdersUIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const store = useOrdersStore();

  const [activeTab, setActiveTab] = useState('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [invoiceSheetOpen, setInvoiceSheetOpen] = useState(false);

  const handleViewOrder = useCallback((order: Order) => {
    setSelectedOrder(order);
    setViewSheetOpen(true);
  }, []);

  const handleCreateOrder = useCallback(() => {
    setSelectedOrder(null);
    setCreateSheetOpen(true);
  }, []);

  const handleGenerateInvoice = useCallback(async (order: Order) => {
    setSelectedOrder(order);
    setInvoiceSheetOpen(true);
    if (!order.invoice_generated_at) {
      try {
        await fetch(`/api/orders/${order.id}/invoice-timestamp`, { method: 'PUT' });
      } catch {
        // Non-blocking
      }
    }
  }, []);

  const handleDeleteOrder = useCallback(async (orderId: string): Promise<boolean> => {
    return store.deleteOrder(orderId);
  }, [store]);

  const handleOrderStatusChange = useCallback(async (orderId: string, status: OrderStatus): Promise<boolean> => {
    return store.updateOrderStatus(orderId, status);
  }, [store]);

  const handleSaveOrder = useCallback(async (order: Order): Promise<{ success: boolean; data?: unknown; error?: unknown }> => {
    try {
      const res = await fetch('/api/orders', {
        method: order.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      if (!res.ok) throw new Error(`Failed to ${order.id ? 'update' : 'create'} order`);
      const data = await res.json();
      toast({
        title: order.id ? 'Order Updated' : 'Order Created',
        description: order.id ? `Order has been updated` : 'New order has been created',
      });
      setCreateSheetOpen(false);
      await store.refresh();
      return { success: true, data };
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save order', variant: 'destructive' });
      return { success: false, error };
    }
  }, [store, toast]);

  const handleInlineEdit = useCallback(async (order: Order): Promise<{ success: boolean; data?: unknown; error?: unknown }> => {
    try {
      const res = await fetch(`/api/orders/${order.id}/inline-edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: order.items, payments: order.payments, notes: order.notes }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Failed to update order (${res.status})`);
      }
      const data = await res.json();
      if (data.order) setSelectedOrder(data.order);
      await store.refresh();
      return { success: true, data };
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update order',
        variant: 'destructive',
      });
      return { success: false, error };
    }
  }, [store, toast]);

  return (
    <OrdersUIContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedOrder,
        viewSheetOpen,
        createSheetOpen,
        invoiceSheetOpen,
        setViewSheetOpen,
        setCreateSheetOpen,
        setInvoiceSheetOpen,
        handleViewOrder,
        handleCreateOrder,
        handleGenerateInvoice,
        handleDeleteOrder,
        handleOrderStatusChange,
        handleSaveOrder,
        handleInlineEdit,
      }}
    >
      {children}
    </OrdersUIContext.Provider>
  );
};

export const useOrdersUI = (): OrdersUIContextType => {
  const ctx = useContext(OrdersUIContext);
  if (!ctx) throw new Error('useOrdersUI must be used within an OrdersUIProvider');
  return ctx;
};
