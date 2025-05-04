'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { HOME_METRICS_DATA, RECENT_ORDERS, UPCOMING_TASKS, RECENT_ACTIVITY } from '../_data/home-data';

// Define the context type
interface HomePageContextType {
  // State
  initialLoading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Data
  metrics: typeof HOME_METRICS_DATA;
  recentOrders: typeof RECENT_ORDERS;
  upcomingTasks: typeof UPCOMING_TASKS;
  recentActivity: typeof RECENT_ACTIVITY;

  // Actions
  handleViewOrder: (orderId: string) => void;
  handleViewTask: (taskId: string) => void;
  handleCreateOrder: () => void;
  handleCreateTask: () => void;
  refreshData: () => void;
}

// Create the context
const HomePageContext = createContext<HomePageContextType | undefined>(undefined);

// Provider component
export const HomePageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();

  // State
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState(HOME_METRICS_DATA);
  const [recentOrders, setRecentOrders] = useState(RECENT_ORDERS);
  const [upcomingTasks, setUpcomingTasks] = useState(UPCOMING_TASKS);
  const [recentActivity, setRecentActivity] = useState(RECENT_ACTIVITY);

  // Load initial data
  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Actions
  const handleViewOrder = useCallback((orderId: string) => {
    router.push(`/dashboard/orders?view=${orderId}`);
  }, [router]);

  const handleViewTask = useCallback((taskId: string) => {
    router.push(`/dashboard/todo?view=${taskId}`);
  }, [router]);

  const handleCreateOrder = useCallback(() => {
    router.push('/dashboard/orders?action=create');
  }, [router]);

  const handleCreateTask = useCallback(() => {
    router.push('/dashboard/todo?action=create');
  }, [router]);

  const refreshData = useCallback(() => {
    setInitialLoading(true);

    // Simulate API call
    setTimeout(() => {
      setMetrics(HOME_METRICS_DATA);
      setRecentOrders(RECENT_ORDERS);
      setUpcomingTasks(UPCOMING_TASKS);
      setRecentActivity(RECENT_ACTIVITY);
      setInitialLoading(false);
    }, 500);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    initialLoading,
    activeTab,
    setActiveTab,
    metrics,
    recentOrders,
    upcomingTasks,
    recentActivity,
    handleViewOrder,
    handleViewTask,
    handleCreateOrder,
    handleCreateTask,
    refreshData,
  }), [
    initialLoading,
    activeTab,
    setActiveTab,
    metrics,
    recentOrders,
    upcomingTasks,
    recentActivity,
    handleViewOrder,
    handleViewTask,
    handleCreateOrder,
    handleCreateTask,
    refreshData,
  ]);

  return (
    <HomePageContext.Provider value={contextValue}>
      {children}
    </HomePageContext.Provider>
  );
};

// Custom hook to use the context
export const useHomePage = () => {
  const context = useContext(HomePageContext);

  if (context === undefined) {
    throw new Error('useHomePage must be used within a HomePageProvider');
  }

  return context;
};
