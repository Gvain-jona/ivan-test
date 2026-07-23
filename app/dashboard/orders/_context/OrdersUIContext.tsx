'use client';

import type { ReactNode} from 'react';
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useOrderMutations } from '@/hooks/orders/useOrders';
import type { OrderSummary, OrderCreateInput } from '@/hooks/orders/useOrders';
import { useOrdersStore } from './OrdersStoreContext';

interface OrdersUIContextType {
  selectedOrder: OrderSummary | null;
  viewSheetOpen: boolean;
  createSheetOpen: boolean;
  setViewSheetOpen: (open: boolean) => void;
  setCreateSheetOpen: (open: boolean) => void;
  handleViewOrder: (order: OrderSummary) => void;
  handleViewOrderById: (orderId: string) => void;
  handleCreateOrder: () => void;
  handleDeleteOrder: (orderId: string) => Promise<boolean>;
  handleOrderStatusChange: (orderId: string, status: string) => Promise<boolean>;
  handleSaveOrder: (input: OrderCreateInput) => Promise<{ success: boolean; error?: unknown }>;
}

const OrdersUIContext = createContext<OrdersUIContextType | undefined>(undefined);

export const OrdersUIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const store = useOrdersStore();
  const { createOrder } = useOrderMutations();

  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);

  const handleViewOrder = useCallback((order: OrderSummary) => {
    setSelectedOrder(order);
    setViewSheetOpen(true);
  }, []);

  /**
   * Open the view sheet for an order known only by id — the deep-link path
   * (e.g. tapping a card on the mobile Home feed → `?order=<id>`). The sheet
   * fetches its own detail from the id via useOrder, so if the order isn't in
   * the loaded page yet we seed a minimal summary and let the sheet hydrate.
   */
  const handleViewOrderById = useCallback((orderId: string) => {
    const existing = store.orders.find((o) => o.id === orderId) ?? null;
    setSelectedOrder(existing ?? ({ id: orderId } as OrderSummary));
    setViewSheetOpen(true);
  }, [store.orders]);

  const handleCreateOrder = useCallback(() => {
    setSelectedOrder(null);
    setCreateSheetOpen(true);
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
      const ok = await store.updateOrderStatus(orderId, status);
      if (ok) toast({ title: 'Order updated', description: `Status changed to ${status.replace(/_/g, ' ')}` });
      else toast({ title: 'Error', description: 'Failed to update order status', variant: 'destructive' });
      return ok;
    },
    [store, toast],
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
        selectedOrder,
        viewSheetOpen,
        createSheetOpen,
        setViewSheetOpen,
        setCreateSheetOpen,
        handleViewOrder,
        handleViewOrderById,
        handleCreateOrder,
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
