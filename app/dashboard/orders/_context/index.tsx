'use client';

import type { ReactNode } from 'react';
import React from 'react';
import { OrdersStoreProvider } from './OrdersStoreContext';
import { OrdersUIProvider } from './OrdersUIContext';

export { OrdersStoreProvider, useOrdersStore } from './OrdersStoreContext';
export type { OrderListFilters } from './OrdersStoreContext';
export { OrdersUIProvider, useOrdersUI } from './OrdersUIContext';

/**
 * Orders page providers. The legacy `useOrdersPage()` compat façade —
 * ~25 any-typed stubs that kept the unmigrated Invoices/Tasks/Insights
 * tabs compiling — was deleted in cleanup Phase 2 along with those
 * consumers (docs/v2-migration/ORDERS_CLEANUP.md). Components use
 * useOrdersStore() / useOrdersUI() directly.
 */
export const OrdersPageProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
  <OrdersStoreProvider>
    <OrdersUIProvider>{children}</OrdersUIProvider>
  </OrdersStoreProvider>
);
