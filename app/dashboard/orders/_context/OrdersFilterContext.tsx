'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { Order, OrderStatus, PaymentStatus } from '@/types/orders';
import { useOrderFiltering } from '../_hooks/useOrderFiltering';
import { DateRange } from 'react-day-picker';
import { useOrdersData } from './OrdersDataContext';
import { ClientType } from '@/types/clients';

// Define the context type
interface OrdersFilterContextType {
  // Filtered orders
  filteredOrders: Order[];
  
  // Filter state
  filters: any;
  searchTerm: string;
  showFilters: boolean;
  
  // Quick filters
  selectedStatus: OrderStatus[];
  selectedPaymentStatus: PaymentStatus[];
  selectedClientType: ClientType[];
  dateRange?: DateRange;
  
  // Filter handlers
  handleFilterChange: (filters: any) => number;
  handleSearch: (searchTerm: string) => void;
  resetFilters: () => void;
  toggleFilters: () => void;
  filterByStatus: (status?: string[]) => void;
  
  // Quick filter handlers
  handleStatusFilterChange: (statuses: OrderStatus[]) => void;
  handlePaymentStatusFilterChange: (statuses: PaymentStatus[]) => void;
  handleClientTypeFilterChange: (types: ClientType[]) => void;
  handleDateRangeChange: (range: DateRange | undefined) => void;
}

// Create the context
const OrdersFilterContext = createContext<OrdersFilterContextType | undefined>(undefined);

// Provider component
export const OrdersFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Get orders data from OrdersDataContext
  const { orders, setCurrentFilters } = useOrdersData();
  
  // Quick filters state
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus[]>([]);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus[]>([]);
  const [selectedClientType, setSelectedClientType] = useState<ClientType[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  // Initialize the order filtering hook
  const {
    filters,
    filteredOrders,
    setFilteredOrders,
    searchTerm,
    showFilters,
    handleFilterChange: localHandleFilterChange,
    handleSearch: localHandleSearch,
    resetFilters: localResetFilters,
    toggleFilters,
    filterByStatus: localFilterByStatus,
    applyFilters
  } = useOrderFiltering(orders);
  
  // Update filtered orders when orders change
  useEffect(() => {
    if (orders && orders.length > 0) {
      // Apply current filters to the new orders
      const newFilteredOrders = applyFilters(orders, filters);
      setFilteredOrders(newFilteredOrders);
    }
  }, [orders, applyFilters, filters, setFilteredOrders]);
  
  // Handle status filter change
  const handleStatusFilterChange = useCallback((statuses: OrderStatus[]) => {
    setSelectedStatus(statuses);
    
    // Update server-side filters
    setCurrentFilters(prev => ({
      ...prev,
      status: statuses.length > 0 ? statuses : undefined
    }));
  }, [setCurrentFilters]);
  
  // Handle payment status filter change
  const handlePaymentStatusFilterChange = useCallback((statuses: PaymentStatus[]) => {
    setSelectedPaymentStatus(statuses);
    
    // Update server-side filters
    setCurrentFilters(prev => ({
      ...prev,
      paymentStatus: statuses.length > 0 ? statuses : undefined
    }));
  }, [setCurrentFilters]);
  
  // Handle client type filter change
  const handleClientTypeFilterChange = useCallback((types: ClientType[]) => {
    setSelectedClientType(types);
    
    // Client type is filtered client-side only
    const newFilters = {
      ...filters,
      clientType: types.length > 0 ? types : undefined
    };
    
    localHandleFilterChange(newFilters);
  }, [filters, localHandleFilterChange]);
  
  // Handle date range filter change
  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    setDateRange(range);
    
    // Update server-side filters
    setCurrentFilters(prev => ({
      ...prev,
      startDate: range?.from ? range.from.toISOString().split('T')[0] : undefined,
      endDate: range?.to ? range.to.toISOString().split('T')[0] : undefined
    }));
  }, [setCurrentFilters]);
  
  // Wrap the filter by status function to update selected status
  const filterByStatus = useCallback((status?: string[]) => {
    if (status) {
      setSelectedStatus(status as OrderStatus[]);
    } else {
      setSelectedStatus([]);
    }
    
    localFilterByStatus(status);
  }, [localFilterByStatus]);
  
  // Wrap the handle search function to update server-side filters
  const handleSearch = useCallback((term: string) => {
    localHandleSearch(term);
    
    // Update server-side filters
    setCurrentFilters(prev => ({
      ...prev,
      search: term || undefined
    }));
  }, [localHandleSearch, setCurrentFilters]);
  
  // Wrap the handle filter change function
  const handleFilterChange = useCallback((newFilters: any) => {
    return localHandleFilterChange(newFilters);
  }, [localHandleFilterChange]);
  
  // Wrap the reset filters function
  const resetFilters = useCallback(() => {
    localResetFilters();
    setSelectedStatus([]);
    setSelectedPaymentStatus([]);
    setSelectedClientType([]);
    setDateRange(undefined);
    
    // Reset server-side filters
    setCurrentFilters({});
  }, [localResetFilters, setCurrentFilters]);

  const contextValue = {
    // Filtered orders
    filteredOrders,
    
    // Filter state
    filters,
    searchTerm,
    showFilters,
    
    // Quick filters
    selectedStatus,
    selectedPaymentStatus,
    selectedClientType,
    dateRange,
    
    // Filter handlers
    handleFilterChange,
    handleSearch,
    resetFilters,
    toggleFilters,
    filterByStatus,
    
    // Quick filter handlers
    handleStatusFilterChange,
    handlePaymentStatusFilterChange,
    handleClientTypeFilterChange,
    handleDateRangeChange
  };

  return (
    <OrdersFilterContext.Provider value={contextValue}>
      {children}
    </OrdersFilterContext.Provider>
  );
};

// Hook to use the orders filter context
export const useOrdersFilter = () => {
  const context = useContext(OrdersFilterContext);
  if (context === undefined) {
    throw new Error('useOrdersFilter must be used within an OrdersFilterProvider');
  }
  return context;
};
