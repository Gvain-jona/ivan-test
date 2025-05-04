'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useOrdersData } from './OrdersDataContext';

// Define the metrics type
interface OrdersMetrics {
  totalOrders: number;
  revenue: number;
  activeClients: number;
  pendingOrders: number;
}

// Define the context type
interface OrdersMetricsContextType {
  stats: OrdersMetrics;
}

// Create the context
const OrdersMetricsContext = createContext<OrdersMetricsContextType | undefined>(undefined);

// Provider component
export const OrdersMetricsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Get orders data from OrdersDataContext
  const { orders } = useOrdersData();
  
  // Metrics state
  const [stats, setStats] = useState<OrdersMetrics>({
    totalOrders: 0,
    revenue: 0,
    activeClients: 0,
    pendingOrders: 0
  });
  
  // Calculate metrics when orders change
  useEffect(() => {
    if (orders && orders.length > 0) {
      // Calculate metrics from real data
      const totalOrders = orders.length;
      const revenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const activeClientsSet = new Set(orders.map(order => order.client_id));
      const activeClients = activeClientsSet.size;
      const pendingOrders = orders.filter(order =>
        order.status === 'pending' ||
        order.status === 'in_progress' ||
        order.status === 'draft'
      ).length;
      
      // Update metrics
      setStats({
        totalOrders,
        revenue,
        activeClients,
        pendingOrders
      });
    }
  }, [orders]);

  const contextValue = {
    stats
  };

  return (
    <OrdersMetricsContext.Provider value={contextValue}>
      {children}
    </OrdersMetricsContext.Provider>
  );
};

// Hook to use the orders metrics context
export const useOrdersMetrics = () => {
  const context = useContext(OrdersMetricsContext);
  if (context === undefined) {
    throw new Error('useOrdersMetrics must be used within an OrdersMetricsProvider');
  }
  return context;
};
