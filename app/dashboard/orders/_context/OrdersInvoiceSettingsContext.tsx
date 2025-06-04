'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { InvoiceSettings } from '@/app/features/invoices/types';
import { emptyInvoiceSettings } from '@/app/features/invoices/context/InvoiceContext';
import { useInvoiceSettings } from '@/app/features/invoices/hooks/useInvoiceSettingsV2';

interface OrdersInvoiceSettingsContextValue {
  invoiceSettings: InvoiceSettings;
  isLoadingInvoiceSettings: boolean;
  invoiceSettingsError: any;
  refetchInvoiceSettings: () => void;
}

const OrdersInvoiceSettingsContext = createContext<OrdersInvoiceSettingsContextValue | undefined>(undefined);

export const OrdersInvoiceSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use the invoice settings hook to fetch default settings
  const { settings, isLoading, error, mutate } = useInvoiceSettings();

  // Always have settings available - use defaults if none exist
  const invoiceSettings = settings || emptyInvoiceSettings;

  const value: OrdersInvoiceSettingsContextValue = {
    invoiceSettings,
    isLoadingInvoiceSettings: isLoading,
    invoiceSettingsError: error,
    refetchInvoiceSettings: mutate,
  };

  return (
    <OrdersInvoiceSettingsContext.Provider value={value}>
      {children}
    </OrdersInvoiceSettingsContext.Provider>
  );
};

export const useOrdersInvoiceSettings = () => {
  const context = useContext(OrdersInvoiceSettingsContext);
  if (context === undefined) {
    throw new Error('useOrdersInvoiceSettings must be used within an OrdersInvoiceSettingsProvider');
  }
  return context;
};