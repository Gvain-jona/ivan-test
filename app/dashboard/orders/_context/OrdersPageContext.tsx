'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback, useMemo } from 'react';
import { Order, Task, TasksFilters, OrderStatus, PaymentStatus } from '../../../types/orders';
import { useToast } from '../../../components/ui/use-toast';
import { useLoading } from '@/components/loading';
import { useOrders, OrdersFilters, PaginationParams } from '@/hooks/useData';
import { createSWRConfig } from '@/lib/swr-config';

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
  activeModal: 'view' | 'create' | 'invoice' | null;
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
  createModalOpen: ReturnType<typeof useOrderModals>['createModalOpen'];
  invoiceModalOpen: ReturnType<typeof useOrderModals>['invoiceModalOpen'];
  setViewModalOpen: ReturnType<typeof useOrderModals>['setViewModalOpen'];
  setCreateModalOpen: ReturnType<typeof useOrderModals>['setCreateModalOpen'];
  setInvoiceModalOpen: ReturnType<typeof useOrderModals>['setInvoiceModalOpen'];
  handleViewOrder: ReturnType<typeof useOrderModals>['handleViewOrder'];
  handleCreateOrder: ReturnType<typeof useOrderModals>['handleCreateOrder'];
  handleDeleteOrder: ReturnType<typeof useOrderModals>['handleDeleteOrder'];
  handleDuplicateOrder: ReturnType<typeof useOrderModals>['handleDuplicateOrder'];
  handleGenerateInvoice: ReturnType<typeof useOrderModals>['handleGenerateInvoice'];
  handleOrderStatusChange: ReturnType<typeof useOrderModals>['handleOrderStatusChange'];
  handleSaveOrder: ReturnType<typeof useOrderModals>['handleSaveOrder'];
  handleInlineEdit: ReturnType<typeof useOrderModals>['handleInlineEdit'];
}

// Create the context
const OrdersPageContext = createContext<OrdersPageContextType | undefined>(undefined);

// Provider component
export const OrdersPageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();

  // Basic state
  const [initialLoading, setInitialLoading] = useState(false); // Changed to false to avoid double loading state
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('insights'); // 'insights', 'orders' or 'invoices'
  const [refreshTimestamp, setRefreshTimestamp] = useState(Date.now()); // Track last refresh time

  // Track which modal is currently active to prevent conflicts
  const [activeModal, setActiveModal] = useState<'view' | 'create' | 'invoice' | null>(null);

  // User role state - in development mode, default to admin
  const [userRole] = useState<'admin' | 'manager' | 'employee'>('admin'); // Default to admin in development
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
  const memoizedFilters = useMemo(() => currentFilters, [
    // Explicitly list all filter properties to avoid unnecessary re-renders
    currentFilters.status?.join(','),
    currentFilters.paymentStatus?.join(','),
    currentFilters.startDate,
    currentFilters.endDate,
    currentFilters.search
  ]);
  const memoizedPagination = useMemo(() => currentPagination, [currentPagination.page, currentPagination.pageSize]);

  // Use the loading provider for component-specific loading states
  const { startLoading, stopLoading } = useLoading();

  const {
    orders,
    totalCount,
    pageCount,
    isLoading: ordersLoading,
    mutate: refreshOrders,
    isEmpty,
    updateOrderStatus: apiUpdateOrderStatus
  } = useOrders(memoizedFilters, memoizedPagination, {
    ...createSWRConfig('list', {
      // Enable revalidation on focus to catch updates
      revalidateOnFocus: true,
      // Always revalidate stale data
      revalidateIfStale: true
    })
  });

  // Determine if we have data loaded
  const ordersDataLoaded = !isEmpty && !ordersLoading;

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
      // Only show toast if we have no data at all
      if (!orders || orders.length === 0) {
        toast({
          title: 'Error',
          description: 'Failed to fetch orders',
          variant: 'destructive',
        });
      }
      setLoading(false);
    }
  }, [toast, refreshOrders, setCurrentFilters]);

  // Make sure we have a valid array of orders for filtering
  const ordersArray = useMemo(() => {
    // Ensure orders is always an array
    if (!orders) return [];
    if (!Array.isArray(orders)) {
      console.warn('Orders is not an array:', orders);
      return [];
    }
    return orders;
  }, [orders]);

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
  } = useOrderFiltering(ordersArray);

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
    // We'll override this with our own implementation
    handleOrderStatusChange: _handleOrderStatusChange,
    handleSaveOrder,
    handleInlineEdit
  } = useOrderModals();

  // Override modal setters to track active modal
  const setViewModalOpen = useCallback((open: boolean) => {
    setViewModalOpenBase(open);
    setActiveModal(open ? 'view' : null);
  }, [setViewModalOpenBase]);

  const setCreateModalOpen = useCallback((open: boolean) => {
    setCreateModalOpenBase(open);
    setActiveModal(open ? 'create' : null);
  }, [setCreateModalOpenBase]);

  const setInvoiceModalOpen = useCallback((open: boolean) => {
    setInvoiceModalOpenBase(open);
    setActiveModal(open ? 'invoice' : null);
  }, [setInvoiceModalOpenBase]);

  // Override handlers to use our custom setters
  const handleViewOrder = useCallback((order: Order) => {
    handleViewOrderBase(order);
    setActiveModal('view');
  }, [handleViewOrderBase]);

  const handleCreateOrder = useCallback(() => {
    handleCreateOrderBase();
    setActiveModal('create');
  }, [handleCreateOrderBase]);

  const handleGenerateInvoice = useCallback((order: Order) => {
    handleGenerateInvoiceBase(order);
    setActiveModal('invoice');
  }, [handleGenerateInvoiceBase]);

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

  // Effect to handle initial data loading - optimized for faster loading
  useEffect(() => {
    // Only run this effect once
    if (!initialFetchRef.current) {
      const loadOrders = async () => {
        console.log('Initial orders fetch - should only run once');
        // Reset any filters to ensure all data is shown
        resetFilters();

        try {
          // Only fetch orders data, no dropdown prefetching
          await refreshOrders({
            revalidate: true,
            populateCache: true
          });
        } catch (error) {
          console.error('Error in initial orders fetch:', error);
          // Don't show a toast here to avoid duplicate error messages
        } finally {
          // Set initial loading to false after data is loaded, even if there was an error
          setInitialLoading(false);
          setDataLoaded(true); // Mark data as loaded even if empty
        }
      };

      loadOrders();
      initialFetchRef.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array since we only want this to run once

  // Handle loading more items with debounce to prevent multiple calls
  const loadingRef = React.useRef(false);
  const loadingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Define a function to refresh data that can be used by both manual refresh and auto-refresh
  // Optimized for better performance and reduced loading states
  const refreshData = useCallback(async (showToast: boolean = false) => { // Default to false to reduce toast noise
    // Prevent multiple simultaneous calls
    if (loadingRef.current) {
      console.log('Skipping refresh - already loading');
      return;
    }

    // Set loading state but don't show skeleton for quick refreshes
    loadingRef.current = true;
    setLoading(true);
    startLoading('orders-refresh');

    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    try {
      // Update refresh timestamp to force cache invalidation
      const timestamp = Date.now();
      setRefreshTimestamp(timestamp);

      // Force revalidation with more aggressive options
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

      // Mark data as loaded immediately
      setDataLoaded(true);
      setInitialLoading(false);
    } catch (error) {
      console.error('Error refreshing orders:', error);
      // Only show toast for manual refreshes and if we have no data at all
      if (showToast && (!orders || orders.length === 0)) {
        toast({
          title: "Error",
          description: "Failed to refresh orders",
          variant: "destructive"
        });
      }
    } finally {
      // Clear loading state immediately
      setLoading(false);
      setInitialLoading(false);
      stopLoading('orders-refresh');

      // Reset the loading flag immediately to allow quick successive refreshes if needed
      loadingRef.current = false;
    }
  }, [refreshOrders, toast, startLoading, stopLoading]);

  // Alias handleLoadMore to refreshData for API compatibility
  const handleLoadMore = refreshData;

  // Effect to update dataLoaded state when orders are loaded
  // Use the hasData flag from useOrdersData to determine if data is loaded
  useEffect(() => {
    console.log('OrdersPageContext - Data loading state changed:', {
      ordersDataLoaded,
      ordersCount: orders?.length || 0,
      filteredOrdersCount: filteredOrders?.length || 0,
      paginatedOrdersCount: paginatedOrders?.length || 0
    });

    if (ordersDataLoaded || (orders && orders.length > 0)) {
      // Data is loaded (even if it's an empty array)
      setDataLoaded(true);
      setInitialLoading(false);
      setLoading(false);
      console.log('Orders data loaded successfully:', orders ? orders.length : 0, 'orders');

      // Force update filtered orders when data is loaded
      if (orders && orders.length > 0) {
        // Use localHandleFilterChange to apply current filters
        // Wrap in setTimeout to avoid potential circular updates
        setTimeout(() => {
          localHandleFilterChange(filters);
          console.log('Forced update of filtered orders using localHandleFilterChange');
        }, 0);
      }
    } else if (ordersLoading) {
      // Only set loading state if we're actually loading
      console.log('Still waiting for orders data...');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, ordersDataLoaded, ordersLoading]);

  // Auto-refresh data periodically when tab is visible
  // But only if we have actual data to refresh
  useEffect(() => {
    // Function to check if tab is visible and refresh if needed
    const checkAndRefresh = () => {
      if (document.visibilityState === 'visible') {
        // Check if it's been more than 5 minutes since last refresh
        // Increased from 2 minutes to reduce unnecessary API calls
        const now = Date.now();
        const timeSinceLastRefresh = now - refreshTimestamp;

        if (timeSinceLastRefresh > 5 * 60 * 1000) { // 5 minutes
          console.log('Auto-refreshing orders data');
          refreshData(false); // Don't show toast for auto-refresh
        }
      }
    };

    // Only set up auto-refresh if we have data or are in the orders tab
    // This prevents unnecessary API calls when there's no data to refresh
    if (dataLoaded || activeTab === 'orders') {
      // Set up interval to check every 2 minutes instead of every minute
      // This reduces the number of checks and potential API calls
      const intervalId = setInterval(checkAndRefresh, 2 * 60 * 1000); // 2 minutes

      // Also refresh when tab becomes visible, but only if it's been at least 5 minutes
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          const now = Date.now();
          const timeSinceLastRefresh = now - refreshTimestamp;

          if (timeSinceLastRefresh > 5 * 60 * 1000) { // 5 minutes
            checkAndRefresh();
          }
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearInterval(intervalId);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    // Return empty cleanup function if we're not setting up auto-refresh
    return () => {};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTimestamp, refreshData, dataLoaded, activeTab]);

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

      // Use functional update to avoid dependency on previous state
      setStats({
        totalOrders,
        revenue,
        activeClients,
        pendingOrders
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders?.length]); // Only recalculate when the number of orders changes

  // Update total pages when filtered orders change
  useEffect(() => {
    if (filteredOrders && Array.isArray(filteredOrders)) {
      updateTotalPages(filteredOrders.length);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredOrders?.length]);

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
    activeModal,

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