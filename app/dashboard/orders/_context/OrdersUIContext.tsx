'use client';

import React, { createContext, useContext, ReactNode, useState } from 'react';
import { Order } from '@/types/orders';
import { useOrderModals } from '../_hooks/useOrderModals';

// Define the context type
interface OrdersUIContextType {
  // Tab state
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  // User role
  userRole: 'admin' | 'manager' | 'employee';
  
  // Active modal tracking
  activeModal: 'view' | 'create' | 'invoice' | null;
  
  // Modal states and handlers from useOrderModals
  selectedOrder: Order | null;
  viewModalOpen: boolean;
  createModalOpen: boolean;
  invoiceModalOpen: boolean;
  setViewModalOpen: (open: boolean) => void;
  setCreateModalOpen: (open: boolean) => void;
  setInvoiceModalOpen: (open: boolean) => void;
  handleViewOrder: (order: Order) => void;
  handleCreateOrder: () => void;
  handleDeleteOrder: (orderId: string) => Promise<boolean>;
  handleDuplicateOrder: (order: Order) => void;
  handleGenerateInvoice: (order: Order) => void;
  handleOrderStatusChange: (orderId: string, status: string) => Promise<boolean>;
  handleSaveOrder: (order: Order) => Promise<{ success: boolean; data?: any; error?: any; }>;
  handleInlineEdit: (order: Order) => void;
}

// Create the context
const OrdersUIContext = createContext<OrdersUIContextType | undefined>(undefined);

// Provider component
export const OrdersUIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Basic UI state
  const [activeTab, setActiveTab] = useState('orders'); // 'insights', 'orders' or 'invoices'
  const [activeModal, setActiveModal] = useState<'view' | 'create' | 'invoice' | null>(null);
  
  // User role state - in development mode, default to admin
  const [userRole] = useState<'admin' | 'manager' | 'employee'>('admin');
  
  // Get modal state and handlers from useOrderModals
  const {
    selectedOrder,
    viewModalOpen,
    createModalOpen,
    invoiceModalOpen,
    setViewModalOpen: setViewModalOpenBase,
    setCreateModalOpen: setCreateModalOpenBase,
    setInvoiceModalOpen: setInvoiceModalOpenBase,
    handleViewOrder: handleViewOrderBase,
    handleCreateOrder: handleCreateOrderBase,
    handleDeleteOrder,
    handleDuplicateOrder,
    handleGenerateInvoice: handleGenerateInvoiceBase,
    handleOrderStatusChange,
    handleSaveOrder,
    handleInlineEdit
  } = useOrderModals();
  
  // Wrap modal handlers to update activeModal state
  const setViewModalOpen = (open: boolean) => {
    setViewModalOpenBase(open);
    setActiveModal(open ? 'view' : null);
  };
  
  const setCreateModalOpen = (open: boolean) => {
    setCreateModalOpenBase(open);
    setActiveModal(open ? 'create' : null);
  };
  
  const setInvoiceModalOpen = (open: boolean) => {
    setInvoiceModalOpenBase(open);
    setActiveModal(open ? 'invoice' : null);
  };
  
  const handleViewOrder = (order: Order) => {
    handleViewOrderBase(order);
    setActiveModal('view');
  };
  
  const handleCreateOrder = () => {
    handleCreateOrderBase();
    setActiveModal('create');
  };
  
  const handleGenerateInvoice = (order: Order) => {
    handleGenerateInvoiceBase(order);
    setActiveModal('invoice');
  };

  const contextValue = {
    // Tab state
    activeTab,
    setActiveTab,
    
    // User role
    userRole,
    
    // Active modal tracking
    activeModal,
    
    // Modal states and handlers
    selectedOrder,
    viewModalOpen,
    createModalOpen,
    invoiceModalOpen,
    setViewModalOpen,
    setCreateModalOpen,
    setInvoiceModalOpen,
    handleViewOrder,
    handleCreateOrder,
    handleDeleteOrder,
    handleDuplicateOrder,
    handleGenerateInvoice,
    handleOrderStatusChange,
    handleSaveOrder,
    handleInlineEdit
  };

  return (
    <OrdersUIContext.Provider value={contextValue}>
      {children}
    </OrdersUIContext.Provider>
  );
};

// Hook to use the orders UI context
export const useOrdersUI = () => {
  const context = useContext(OrdersUIContext);
  if (context === undefined) {
    throw new Error('useOrdersUI must be used within an OrdersUIProvider');
  }
  return context;
};
