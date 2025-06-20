'use client';

import React, { ReactNode } from 'react';
import { OrdersDataProvider, useOrdersData } from './OrdersDataContext';
import { OrdersUIProvider, useOrdersUI } from './OrdersUIContext';
import { OrdersFilterProvider, useOrdersFilter } from './OrdersFilterContext';
import { OrdersPaginationProvider, useOrdersPagination } from './OrdersPaginationContext';
import { OrdersMetricsProvider, useOrdersMetrics } from './OrdersMetricsContext';
import { OrdersTasksProvider, useOrdersTasks } from './OrdersTasksContext';
import { OrdersInvoiceSettingsProvider, useOrdersInvoiceSettings } from './OrdersInvoiceSettingsContext';

// Create a composite hook that combines all the individual hooks
export const useOrdersPage = () => {
  // Get data from all contexts
  const ordersData = useOrdersData();
  const ordersUI = useOrdersUI();
  const ordersFilter = useOrdersFilter();
  const ordersPagination = useOrdersPagination();
  const ordersMetrics = useOrdersMetrics();
  const ordersTasks = useOrdersTasks();
  const ordersInvoiceSettings = useOrdersInvoiceSettings();
  
  // Combine all context values into a single object
  return {
    // Data
    ...ordersData,
    
    // UI
    ...ordersUI,
    
    // Filtering
    ...ordersFilter,
    
    // Pagination
    ...ordersPagination,
    
    // Metrics
    ...ordersMetrics,
    
    // Tasks
    ...ordersTasks,
    
    // Invoice Settings
    ...ordersInvoiceSettings
  };
};

// Provider component that composes all the individual providers
export const OrdersPageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <OrdersDataProvider>
      <OrdersInvoiceSettingsProvider>
        <OrdersUIProvider>
          <OrdersFilterProvider>
            <OrdersPaginationProvider>
              <OrdersMetricsProvider>
                <OrdersTasksProvider>
                  {children}
                </OrdersTasksProvider>
              </OrdersMetricsProvider>
            </OrdersPaginationProvider>
          </OrdersFilterProvider>
        </OrdersUIProvider>
      </OrdersInvoiceSettingsProvider>
    </OrdersDataProvider>
  );
};
