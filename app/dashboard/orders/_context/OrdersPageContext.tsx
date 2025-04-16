'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback, useMemo } from 'react';
import { useGlobalDropdownCache } from '@/context/GlobalDropdownCache';
import { Order, Task, TasksFilters, OrderStatus, PaymentStatus } from '../../../types/orders';
import { useToast } from '../../../components/ui/use-toast';
import { useOrdersData } from '@/hooks/useOrdersData';

// Import sample data for tasks and metrics
// Import custom hooks

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
  stats: {
    totalOrders: number;
    revenue: number;
    activeClients: number;
    pendingOrders: number;
  };

  // Tasks related state
  filteredTasks: Task[];
  taskFilters: TasksFilters;
  handleTaskFilterChange: (filters: TasksFilters) => void;
  handleTaskSearch: (searchTerm: string) => void;
  handleResetTaskFilters: () => void;
  handleCompleteTask: (taskId: string) => void;

  // Loading
  handleLoadMore: (showToast?: boolean) => Promise<void>;

  // Filtering
  filters: ReturnType<typeof useOrderFiltering>['filters'];
  filteredOrders: ReturnType<typeof useOrderFiltering>['filteredOrders'];
  searchTerm: ReturnType<typeof useOrderFiltering>['searchTerm'];
  showFilters: ReturnType<typeof useOrderFiltering>['showFilters'];
  handleFilterChange: ReturnType<typeof useOrderFiltering>['handleFilterChange'];
  handleSearch: ReturnType<typeof useOrderFiltering>['handleSearch'];
  resetFilters: ReturnType<typeof useOrderFiltering>['resetFilters'];
  toggleFilters: ReturnType<typeof useOrderFiltering>['toggleFilters'];
  filterByStatus: ReturnType<typeof useOrderFiltering>['filterByStatus'];

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
  const [initialLoading, setInitialLoading] = useState(false); // Changed to false to avoid double loading state
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('insights'); // 'insights', 'orders' or 'tasks'

  // Get the global dropdown cache
  const { prefetchAll, isInitialized } = useGlobalDropdownCache();
  const [userRole] = useState<'admin' | 'manager' | 'employee'>('admin'); // Placeholder, would come from auth
  const [stats, setStats] = useState({
    totalOrders: 0,
    revenue: 0,
    activeClients: 0,
    pendingOrders: 0
  });

  // Track if data has been loaded at least once
  const [dataLoaded, setDataLoaded] = useState(false);

  // Tasks related state
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [taskFilters, setTaskFilters] = useState<TasksFilters>({});

  // State for filters and pagination
  const [currentFilters, setCurrentFilters] = useState<{
    status?: OrderStatus[];
    paymentStatus?: PaymentStatus[];
    startDate?: string;
    endDate?: string;
    search?: string;
  }>({});

  const [currentPagination, setCurrentPagination] = useState({
    page: 1,
    pageSize: 50
  });

  // Initialize consolidated orders hook with memoized dependencies
  const memoizedFilters = useMemo(() => currentFilters, [JSON.stringify(currentFilters)]);
  const memoizedPagination = useMemo(() => currentPagination, [currentPagination.page, currentPagination.pageSize]);

  const {
    orders,
    totalCount,
    pageCount,
    isLoading: ordersLoading,
    refreshOrders,
    updateOrderStatus: apiUpdateOrderStatus
  } = useOrdersData(memoizedFilters, memoizedPagination);

  // Function to fetch orders with optional filters
  const fetchOrders = useCallback(async (filters?: any) => {
    try {
      setLoading(true);
      // Update filters and refresh data
      if (filters) {
        setCurrentFilters(filters);
      }
      // Trigger SWR to revalidate data
      await refreshOrders();
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch orders',
        variant: 'destructive',
      });
      setLoading(false);
    }
  }, [toast, refreshOrders, setCurrentFilters]);

  // Initialize custom hooks
  const {
    filters,
    filteredOrders,
    searchTerm,
    showFilters,
    handleFilterChange: localHandleFilterChange,
    handleSearch: localHandleSearch,
    resetFilters: localResetFilters,
    toggleFilters,
    filterByStatus: localFilterByStatus
  } = useOrderFiltering(orders || []);

  // Enhanced filter handlers that update SWR filters
  const handleFilterChange = useCallback((newFilters: any) => {
    localHandleFilterChange(newFilters);
    setCurrentFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, [localHandleFilterChange]);

  const handleSearch = useCallback((term: string) => {
    localHandleSearch(term);
    setCurrentFilters(prev => ({
      ...prev,
      search: term
    }));
  }, [localHandleSearch]);

  const resetFilters = useCallback(() => {
    localResetFilters();
    setCurrentFilters({});
  }, [localResetFilters]);

  const filterByStatus = useCallback((status: string) => {
    localFilterByStatus(status);
    setCurrentFilters(prev => ({
      ...prev,
      status: [status as any]
    }));
  }, [localFilterByStatus]);

  // Custom pagination handler that updates the SWR pagination
  const handleSWRPageChange = useCallback((page: number) => {
    setCurrentPagination(prev => ({
      ...prev,
      page
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Use the pagination hook for local pagination (will be phased out)
  const {
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedOrders,
    handlePageChange: legacyHandlePageChange,
    updateTotalPages
  } = useOrdersPagination(filteredOrders);

  // Use the SWR pagination for API pagination
  const handlePageChange = useCallback((page: number) => {
    handleSWRPageChange(page);
    legacyHandlePageChange(page);
  }, [handleSWRPageChange, legacyHandlePageChange]);

  // Get modal state and handlers from useOrderModals
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
    // We'll override this with our own implementation
    handleOrderStatusChange: _handleOrderStatusChange,
    handleSaveOrder
  } = useOrderModals();

  // Override handleOrderStatusChange to use our consolidated hook
  const handleOrderStatusChange = useCallback(async (order: Order, status: OrderStatus) => {
    console.log('Change order status:', order.id, 'to', status);

    try {
      setLoading(true);

      // Use our consolidated hook's updateOrderStatus function
      const success = await apiUpdateOrderStatus(order.id, status);

      if (!success) {
        throw new Error('Failed to update order status');
      }

      toast({
        title: 'Status Updated',
        description: `Order ${order.order_number || order.id.substring(0, 8)} is now ${status}`,
      });

      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast, apiUpdateOrderStatus, setLoading]);

  // Fetch orders on component mount - with a stable dependency array
  // We use useRef to ensure the dependency doesn't change between renders
  const initialFetchRef = React.useRef(false);

  // Effect to handle initial data loading
  useEffect(() => {
    // Only run this effect once
    if (!initialFetchRef.current) {
      const loadOrders = async () => {
        console.log('Initial orders fetch - should only run once');
        // Reset any filters to ensure all data is shown
        resetFilters();

        // Prefetch dropdown data
        if (!isInitialized) {
          console.log('Prefetching dropdown data...');
          await prefetchAll();
        }
      };

      loadOrders();
      initialFetchRef.current = true;
    }
  }, [resetFilters, prefetchAll, isInitialized]); // Stable dependency array

  // Effect to update dataLoaded state when orders are loaded
  useEffect(() => {
    if (orders && orders.length > 0 && !dataLoaded) {
      setDataLoaded(true);
      setInitialLoading(false);
      console.log('Orders data loaded successfully');
    }
  }, [orders, dataLoaded]);

  // Calculate metrics separately to avoid infinite loops
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

      setStats({
        totalOrders,
        revenue,
        activeClients,
        pendingOrders
      });
    }
  }, [orders]);

  // Update total pages when filtered orders change
  useEffect(() => {
    updateTotalPages(filteredOrders.length);
  }, [filteredOrders.length, updateTotalPages]);

  // Handle loading more items with debounce to prevent multiple calls
  const loadingRef = React.useRef(false);
  const loadingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleLoadMore = useCallback(async (showToast: boolean = true) => {
    // Prevent multiple simultaneous calls
    if (loadingRef.current) return;

    // Set loading state
    loadingRef.current = true;
    setLoading(true);

    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    try {
      // Use a cache-busting approach that doesn't modify the URL
      const timestamp = Date.now();

      // Force revalidation with a unique key
      await refreshOrders({
        revalidate: true,
        populateCache: true,
        rollbackOnError: true
      });

      // Only show toast if this was triggered by a manual refresh button click
      // and not by an automatic refresh after order creation
      if (showToast) {
        toast({
          title: "Data refreshed",
          description: "The latest order data has been loaded",
        });
      }
    } catch (error) {
      console.error('Error refreshing orders:', error);
      toast({
        title: "Error",
        description: "Failed to refresh orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);

      // Reset the loading flag after a short delay to prevent rapid successive calls
      loadingTimeoutRef.current = setTimeout(() => {
        loadingRef.current = false;
      }, 1000);
    }
  }, [refreshOrders, toast]);

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
    setFilteredTasks([]);
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
    filterByStatus,

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