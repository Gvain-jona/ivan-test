'use client';

import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { Task, TasksFilters } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';
import { useOrdersData } from './OrdersDataContext';

// Define the context type
interface OrdersTasksContextType {
  // Tasks state
  filteredTasks: Task[];
  taskFilters: TasksFilters;
  
  // Tasks handlers
  handleTaskFilterChange: (filters: TasksFilters) => void;
  handleTaskSearch: (searchTerm: string) => void;
  handleResetTaskFilters: () => void;
  handleCompleteTask: (taskId: string) => void;
}

// Create the context
const OrdersTasksContext = createContext<OrdersTasksContextType | undefined>(undefined);

// Provider component
export const OrdersTasksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const { orders, refreshOrders } = useOrdersData();
  
  // Tasks state
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [taskFilters, setTaskFilters] = useState<TasksFilters>({});
  
  // Generate tasks from orders
  const generateTasksFromOrders = useCallback(() => {
    if (!orders || orders.length === 0) return [];
    
    const tasks: Task[] = [];
    
    // Generate tasks for orders with balance > 0
    orders.forEach(order => {
      if (order.balance && order.balance > 0) {
        tasks.push({
          id: `payment-${order.id}`,
          type: 'payment',
          title: `Collect payment for Order #${order.order_number || order.id.substring(0, 8)}`,
          description: `${order.client_name} has an outstanding balance of ${order.balance.toLocaleString()} UGX`,
          due_date: order.due_date || new Date().toISOString(),
          status: 'pending',
          priority: 'high',
          related_id: order.id,
          amount: order.balance
        });
      }
      
      // Generate tasks for orders that are pending delivery
      if (order.status === 'pending' || order.status === 'in_progress') {
        tasks.push({
          id: `delivery-${order.id}`,
          type: 'delivery',
          title: `Deliver Order #${order.order_number || order.id.substring(0, 8)}`,
          description: `${order.client_name}'s order is ready for delivery`,
          due_date: order.delivery_date || new Date().toISOString(),
          status: 'pending',
          priority: 'medium',
          related_id: order.id
        });
      }
    });
    
    return tasks;
  }, [orders]);
  
  // Apply filters to tasks
  const applyTaskFilters = useCallback((tasks: Task[], filters: TasksFilters) => {
    let filtered = [...tasks];
    
    // Filter by type
    if (filters.type) {
      filtered = filtered.filter(task => task.type === filters.type);
    }
    
    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }
    
    // Filter by priority
    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }
    
    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm)
      );
    }
    
    return filtered;
  }, []);
  
  // Update filtered tasks when orders or filters change
  React.useEffect(() => {
    const allTasks = generateTasksFromOrders();
    const filtered = applyTaskFilters(allTasks, taskFilters);
    setFilteredTasks(filtered);
  }, [orders, taskFilters, generateTasksFromOrders, applyTaskFilters]);
  
  // Handle task filter change
  const handleTaskFilterChange = useCallback((filters: TasksFilters) => {
    setTaskFilters(prev => ({ ...prev, ...filters }));
  }, []);
  
  // Handle task search
  const handleTaskSearch = useCallback((searchTerm: string) => {
    setTaskFilters(prev => ({ ...prev, search: searchTerm }));
  }, []);
  
  // Reset task filters
  const handleResetTaskFilters = useCallback(() => {
    setTaskFilters({});
  }, []);
  
  // Handle completing a task
  const handleCompleteTask = useCallback((taskId: string) => {
    // Find the task
    const task = filteredTasks.find(t => t.id === taskId);
    if (!task) {
      toast({
        title: "Error",
        description: "Task not found",
        variant: "destructive"
      });
      return;
    }
    
    // Handle different task types
    if (task.type === 'payment') {
      // For payment tasks, we would update the order's payment status
      // This would typically be an API call
      toast({
        title: "Payment Recorded",
        description: `Payment for Order #${task.related_id.substring(0, 8)} has been recorded.`
      });
    } else if (task.type === 'delivery') {
      // For delivery tasks, we would update the order's status to 'delivered'
      // This would typically be an API call
      toast({
        title: "Delivery Completed",
        description: `Order #${task.related_id.substring(0, 8)} has been marked as delivered.`
      });
    }
    
    // Refresh orders to get updated data
    refreshOrders();
    
    // Update the task in the local state
    const updatedTasks = filteredTasks.map(t =>
      t.id === taskId ? { ...t, status: 'completed' } : t
    );
    setFilteredTasks(updatedTasks);
  }, [filteredTasks, refreshOrders, toast]);

  const contextValue = {
    // Tasks state
    filteredTasks,
    taskFilters,
    
    // Tasks handlers
    handleTaskFilterChange,
    handleTaskSearch,
    handleResetTaskFilters,
    handleCompleteTask
  };

  return (
    <OrdersTasksContext.Provider value={contextValue}>
      {children}
    </OrdersTasksContext.Provider>
  );
};

// Hook to use the orders tasks context
export const useOrdersTasks = () => {
  const context = useContext(OrdersTasksContext);
  if (context === undefined) {
    throw new Error('useOrdersTasks must be used within an OrdersTasksProvider');
  }
  return context;
};
