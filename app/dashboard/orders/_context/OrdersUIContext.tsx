'use client';

import type { ReactNode} from 'react';
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useOrderMutations } from '@/hooks/orders/useOrders';
import type { OrderSummary, OrderCreateInput } from '@/hooks/orders/useOrders';
import { useOrdersStore } from './OrdersStoreContext';

interface OrdersUIContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedOrder: OrderSummary | null;
  viewSheetOpen: boolean;
  createSheetOpen: boolean;
  invoiceSheetOpen: boolean;
  setViewSheetOpen: (open: boolean) => void;
  setCreateSheetOpen: (open: boolean) => void;
  setInvoiceSheetOpen: (open: boolean) => void;
  handleViewOrder: (order: OrderSummary) => void;
  handleCreateOrder: () => void;
  handleGenerateInvoice: (order: OrderSummary) => Promise<void>;
  handleDeleteOrder: (orderId: string) => Promise<boolean>;
  handleOrderStatusChange: (orderId: string, status: string) => Promise<boolean>;
  handleSaveOrder: (input: OrderCreateInput) => Promise<{ success: boolean; error?: unknown }>;
}

const OrdersUIContext = createContext<OrdersUIContextType | undefined>(undefined);

export const OrdersUIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const store = useOrdersStore();
  const { createOrder } = useOrderMutations();

  const [activeTab, setActiveTab] = useState('orders');
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [invoiceSheetOpen, setInvoiceSheetOpen] = useState(false);

  const handleViewOrder = useCallback((order: OrderSummary) => {
    setSelectedOrder(order);
    setViewSheetOpen(true);
  }, []);

  const handleCreateOrder = useCallback(() => {
    setSelectedOrder(null);
    setCreateSheetOpen(true);
  }, []);

  /**
   * Invoicing waits on v2.documents + issue_document; the sheet is
   * disconnected until that module migrates. State still tracks the
   * intent so the button can show a "coming with documents" notice.
   */
  const handleGenerateInvoice = useCallback(async (order: OrderSummary) => {
    setSelectedOrder(order);
    setInvoiceSheetOpen(true);
  }, []);

  /** v2 never hard-deletes — routed to status 'cancelled'. */
  const handleDeleteOrder = useCallback(
    async (orderId: string): Promise<boolean> => {
      const ok = await store.cancelOrder(orderId);
      if (ok) toast({ title: 'Order cancelled' });
      else toast({ title: 'Error', description: 'Failed to cancel order', variant: 'destructive' });
      return ok;
    },
    [store, toast],
  );

  const handleOrderStatusChange = useCallback(
    async (orderId: string, status: string): Promise<boolean> => {
      return store.updateOrderStatus(orderId, status);
    },
    [store],
  );

  const handleSaveOrder = useCallback(
    async (input: OrderCreateInput): Promise<{ success: boolean; error?: unknown }> => {
      try {
        await createOrder(input);
        toast({ title: 'Order Created', description: 'New order has been created' });
        setCreateSheetOpen(false);
        await store.refresh();
        return { success: true };
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to save order',
          variant: 'destructive',
        });
        return { success: false, error };
      }
    },
    [createOrder, store, toast],
  );

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
