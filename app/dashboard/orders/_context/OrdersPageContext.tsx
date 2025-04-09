'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Order, Task, TasksFilters } from '../../../types/orders';
import { useToast } from '../../../components/ui/use-toast';
import { useRealOrders } from '@/app/hooks/useRealOrders';

// Import sample data for tasks and metrics
import { SAMPLE_TASKS } from '../_data/sample-tasks';
import { METRICS_DATA } from '../_data/metrics-data';

// Import custom hooks
import { useOrderFiltering } from '../_hooks/useOrderFiltering';
import { useOrdersPagination } from '../_hooks/useOrdersPagination';
import { useOrderModals } from '../_hooks/useOrderModals';

// Define the context type
interface OrdersPageContextType {
  // State
  initialLoading: boolean;
  loading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: 'admin' | 'manager' | 'employee';
  stats: typeof METRICS_DATA;

  // Tasks related state
  filteredTasks: Task[];
  taskFilters: TasksFilters;
  handleTaskFilterChange: (filters: TasksFilters) => void;
  handleTaskSearch: (searchTerm: string) => void;
  handleResetTaskFilters: () => void;
  handleCompleteTask: (taskId: string) => void;

  // Loading
  handleLoadMore: () => void;

  // Filtering
  filters: ReturnType<typeof useOrderFiltering>['filters'];
  filteredOrders: ReturnType<typeof useOrderFiltering>['filteredOrders'];
  searchTerm: ReturnType<typeof useOrderFiltering>['searchTerm'];
  showFilters: ReturnType<typeof useOrderFiltering>['showFilters'];
  handleFilterChange: ReturnType<typeof useOrderFiltering>['handleFilterChange'];
  handleSearch: ReturnType<typeof useOrderFiltering>['handleSearch'];
  resetFilters: ReturnType<typeof useOrderFiltering>['resetFilters'];
  toggleFilters: ReturnType<typeof useOrderFiltering>['toggleFilters'];

  // Pagination
  currentPage: ReturnType<typeof useOrdersPagination>['currentPage'];
  itemsPerPage: ReturnType<typeof useOrdersPagination>['itemsPerPage'];
  totalPages: ReturnType<typeof useOrdersPagination>['totalPages'];
  paginatedOrders: ReturnType<typeof useOrdersPagination>['paginatedOrders'];
  handlePageChange: ReturnType<typeof useOrdersPagination>['handlePageChange'];

  // Modals
  selectedOrder: ReturnType<typeof useOrderModals>['selectedOrder'];
  viewModalOpen: ReturnType<typeof useOrderModals>['viewModalOpen'];
  editModalOpen: ReturnType<typeof useOrderModals>['editModalOpen'];
  createModalOpen: ReturnType<typeof useOrderModals>['createModalOpen'];
  invoiceModalOpen: ReturnType<typeof useOrderModals>['invoiceModalOpen'];
  setViewModalOpen: ReturnType<typeof useOrderModals>['setViewModalOpen'];
  setEditModalOpen: ReturnType<typeof useOrderModals>['setEditModalOpen'];
  setCreateModalOpen: ReturnType<typeof useOrderModals>['setCreateModalOpen'];
  setInvoiceModalOpen: ReturnType<typeof useOrderModals>['setInvoiceModalOpen'];
  handleViewOrder: ReturnType<typeof useOrderModals>['handleViewOrder'];
  handleEditOrder: ReturnType<typeof useOrderModals>['handleEditOrder'];
  handleCreateOrder: ReturnType<typeof useOrderModals>['handleCreateOrder'];
  handleDeleteOrder: ReturnType<typeof useOrderModals>['handleDeleteOrder'];
  handleDuplicateOrder: ReturnType<typeof useOrderModals>['handleDuplicateOrder'];
  handleGenerateInvoice: ReturnType<typeof useOrderModals>['handleGenerateInvoice'];
  handleOrderStatusChange: ReturnType<typeof useOrderModals>['handleOrderStatusChange'];
  handleSaveOrder: ReturnType<typeof useOrderModals>['handleSaveOrder'];
}

// Create the context
const OrdersPageContext = createContext<OrdersPageContextType | undefined>(undefined);

// Provider component
export const OrdersPageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();

  // Basic state
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'tasks'
  const [userRole] = useState<'admin' | 'manager' | 'employee'>('admin'); // Placeholder, would come from auth
  const stats = METRICS_DATA;

  // Tasks related state
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(SAMPLE_TASKS);
  const [taskFilters, setTaskFilters] = useState<TasksFilters>({});

  // Initialize real orders hook
  const {
    orders,
    totalCount,
    pageCount,
    loading: ordersLoading,
    fetchOrders,
  } = useRealOrders();

  // Initialize custom hooks
  const {
    filters,
    filteredOrders,
    searchTerm,
    showFilters,
    handleFilterChange,
    handleSearch,
    resetFilters,
    toggleFilters
  } = useOrderFiltering(orders || []);

  const {
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedOrders,
    handlePageChange,
    updateTotalPages
  } = useOrdersPagination(filteredOrders);

  const {
    selectedOrder,
    viewModalOpen,
    editModalOpen,
    createModalOpen,
    invoiceModalOpen,
    setViewModalOpen,
    setEditModalOpen,
    setCreateModalOpen,
    setInvoiceModalOpen,
    handleViewOrder,
    handleEditOrder,
    handleCreateOrder,
    handleDeleteOrder,
    handleDuplicateOrder,
    handleGenerateInvoice,
    handleOrderStatusChange,
    handleSaveOrder
  } = useOrderModals();

  // Fetch orders on component mount
  useEffect(() => {
    const loadOrders = async () => {
      await fetchOrders();
      setInitialLoading(false);
    };

    loadOrders();
  }, [fetchOrders]);

  // Update total pages when filtered orders change
  useEffect(() => {
    updateTotalPages(filteredOrders.length);
  }, [filteredOrders.length, updateTotalPages]);

  // Handle loading more items
  const handleLoadMore = async () => {
    setLoading(true);
    try {
      await fetchOrders();
      toast({
        title: "Data refreshed",
        description: "The latest order data has been loaded",
      });
    } catch (error) {
      console.error('Error refreshing orders:', error);
      toast({
        title: "Error",
        description: "Failed to refresh orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Tasks handlers
  const handleTaskFilterChange = (newFilters: TasksFilters) => {
    setTaskFilters(newFilters);
    console.log('Task filters changed:', newFilters);
  };

  const handleTaskSearch = (searchTerm: string) => {
    // Apply task filtering
    console.log('Search tasks for:', searchTerm);
  };

  const handleResetTaskFilters = () => {
    setTaskFilters({});
    setFilteredTasks(SAMPLE_TASKS);
    console.log('Task filters reset');
  };

  const handleCompleteTask = (taskId: string) => {
    console.log('Task completion toggled:', taskId);
    // Update task status
    const newTasks = filteredTasks.map(task =>
      task.id === taskId
        ? {...task, status: task.status === 'completed' ? ('pending' as const) : ('completed' as const)}
        : task
    );
    setFilteredTasks(newTasks);

    const completed = newTasks.find(task => task.id === taskId)?.status === 'completed';

    toast({
      title: completed ? "Task Completed" : "Task Reopened",
      description: `Task has been marked as ${completed ? 'completed' : 'pending'}`,
    });
  };

  const contextValue = {
    // Basic state
    initialLoading,
    loading,
    activeTab,
    setActiveTab,
    userRole,
    stats,

    // Tasks
    filteredTasks,
    taskFilters,
    handleTaskFilterChange,
    handleTaskSearch,
    handleResetTaskFilters,
    handleCompleteTask,

    // Loading
    handleLoadMore,

    // Filtering
    filters,
    filteredOrders,
    searchTerm,
    showFilters,
    handleFilterChange,
    handleSearch,
    resetFilters,
    toggleFilters,

    // Pagination
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedOrders,
    handlePageChange,

    // Modals
    selectedOrder,
    viewModalOpen,
    editModalOpen,
    createModalOpen,
    invoiceModalOpen,
    setViewModalOpen,
    setEditModalOpen,
    setCreateModalOpen,
    setInvoiceModalOpen,
    handleViewOrder,
    handleEditOrder,
    handleCreateOrder,
    handleDeleteOrder,
    handleDuplicateOrder,
    handleGenerateInvoice,
    handleOrderStatusChange,
    handleSaveOrder
  };

  return (
    <OrdersPageContext.Provider value={contextValue}>
      {children}
    </OrdersPageContext.Provider>
  );
};

// Hook to use the orders page context
export const useOrdersPage = () => {
  const context = useContext(OrdersPageContext);
  if (context === undefined) {
    throw new Error('useOrdersPage must be used within an OrdersPageProvider');
  }
  return context;
};