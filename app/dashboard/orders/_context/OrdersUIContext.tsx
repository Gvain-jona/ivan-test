'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import type { OrderSummary } from '@/hooks/orders/useOrders';
import { useSheets } from '@/context/sheet-host';
import { useOrdersStore } from './OrdersStoreContext';

/**
 * Orders-page UI actions. Opening the create/view sheets is delegated to the
 * app-wide sheet host (see DESIGN_PHILOSOPHY.md → "Overlays & sheets") — this
 * context no longer owns any sheet state; it only wires the list-row actions
 * (view / delete / status change) to the store and the host.
 */
interface OrdersUIContextType {
  handleViewOrder: (order: OrderSummary) => void;
  handleCreateOrder: () => void;
  handleDeleteOrder: (orderId: string) => Promise<boolean>;
  handleOrderStatusChange: (orderId: string, status: string) => Promise<boolean>;
}

const OrdersUIContext = createContext<OrdersUIContextType | undefined>(undefined);

export const OrdersUIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const store = useOrdersStore();
  const { openOrder, openCreateOrder } = useSheets();

  const handleViewOrder = useCallback(
    (order: OrderSummary) => openOrder(order.id),
    [openOrder],
  );

  const handleCreateOrder = useCallback(() => openCreateOrder(), [openCreateOrder]);

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

  return (
    <OrdersUIContext.Provider
      value={{
        handleViewOrder,
        handleCreateOrder,
        handleDeleteOrder,
        handleOrderStatusChange,
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
