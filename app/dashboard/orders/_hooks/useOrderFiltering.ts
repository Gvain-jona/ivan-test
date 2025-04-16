import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Order, OrdersTableFilters, OrderItem, OrderNote } from '@/types/orders';

/**
 * Custom hook to manage order filtering functionality
 */
export const useOrderFiltering = (initialOrders: Order[]) => {
  const [filters, setFilters] = useState<OrdersTableFilters>({});
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  /**
   * Apply filters to orders without changing state
   * This is used internally to avoid circular dependencies
   */
  const applyFilters = useCallback((ordersToFilter: Order[], filtersToApply: OrdersTableFilters) => {
    let filtered = [...ordersToFilter];

    // Filter by status
    if (filtersToApply.status && filtersToApply.status.length > 0) {
      filtered = filtered.filter(order =>
        filtersToApply.status?.includes(order.status)
      );
    }

    // Filter by payment status
    if (filtersToApply.paymentStatus && filtersToApply.paymentStatus.length > 0) {
      filtered = filtered.filter(order =>
        filtersToApply.paymentStatus?.includes(order.payment_status)
      );
    }

    // Filter by date range
    if (filtersToApply.startDate) {
      filtered = filtered.filter(order =>
        new Date(order.date) >= new Date(filtersToApply.startDate!)
      );
    }

    if (filtersToApply.endDate) {
      filtered = filtered.filter(order =>
        new Date(order.date) <= new Date(filtersToApply.endDate!)
      );
    }

    // Filter by client name
    if (filtersToApply.clientName) {
      filtered = filtered.filter(order =>
        order.client_name?.toLowerCase().includes(filtersToApply.clientName!.toLowerCase())
      );
    }

    // Filter by search term
    if (filtersToApply.search) {
      const searchLower = filtersToApply.search.toLowerCase();
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchLower) ||
        order.client_name?.toLowerCase().includes(searchLower) ||
        order.items?.some((item) =>
          item.item_name?.toLowerCase().includes(searchLower)
        ) ||
        order.notes?.some((note) =>
          note.text.toLowerCase().includes(searchLower)
        )
      );
    }

    return filtered;
  }, []);

  // Update filtered orders when initialOrders change
  // Use a ref to track previous values to prevent unnecessary updates
  const prevInitialOrdersRef = React.useRef<Order[]>([]);
  const prevFiltersRef = React.useRef<OrdersTableFilters>({});

  // Use a ref to track if this is the first render
  const isFirstRenderRef = React.useRef(true);

  useEffect(() => {
    // On first render, just set the refs and filtered orders
    if (isFirstRenderRef.current) {
      prevInitialOrdersRef.current = initialOrders;
      prevFiltersRef.current = filters;
      const filtered = applyFilters(initialOrders, filters);
      setFilteredOrders(filtered);
      isFirstRenderRef.current = false;
      return;
    }

    // Skip if nothing has changed - use deep comparison
    const initialOrdersChanged = JSON.stringify(initialOrders) !== JSON.stringify(prevInitialOrdersRef.current);
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(prevFiltersRef.current);

    if (!initialOrdersChanged && !filtersChanged) {
      return;
    }

    // Update refs
    prevInitialOrdersRef.current = initialOrders;
    prevFiltersRef.current = filters;

    // Apply current filters to new initialOrders
    const filtered = applyFilters(initialOrders, filters);
    setFilteredOrders(filtered);
  }, [initialOrders, applyFilters, filters]);



  /**
   * Handle filter changes for orders
   */
  const handleFilterChange = useCallback((newFilters: OrdersTableFilters) => {
    // Skip if filters haven't changed
    if (JSON.stringify(newFilters) === JSON.stringify(filters)) {
      return filteredOrders.length;
    }

    setFilters(newFilters);

    // Apply filters to orders
    const filtered = applyFilters(initialOrders, newFilters);
    setFilteredOrders(filtered);

    return filtered.length; // Return count for pagination calculations
  }, [initialOrders, applyFilters, filters, filteredOrders]);

  /**
   * Handle search for orders
   */
  const handleSearch = useCallback((term: string) => {
    // Skip if the search term hasn't changed
    if (term === searchTerm) {
      return;
    }

    setSearchTerm(term);
    const newFilters = {
      ...filters,
      search: term || undefined
    };

    // Apply filtering immediately
    setFilters(newFilters);
    const filtered = applyFilters(initialOrders, newFilters);
    setFilteredOrders(filtered);
  }, [filters, initialOrders, applyFilters, searchTerm]);

  /**
   * Reset filters
   */
  const resetFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    setFilteredOrders(initialOrders);
    setShowFilters(false);
  }, [initialOrders]);

  /**
   * Toggle filter visibility
   */
  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  /**
   * Filter orders by status (used by metric cards)
   */
  const filterByStatus = useCallback((status?: string[]) => {
    let newFilters: OrdersTableFilters;

    if (!status) {
      // Clear status filter
      newFilters = { ...filters };
      delete newFilters.status;
    } else {
      // Apply status filter
      newFilters = {
        ...filters,
        status: status as any[]
      };
    }

    // Skip if filters haven't changed
    if (JSON.stringify(newFilters) === JSON.stringify(filters)) {
      return;
    }

    // Apply the new filters
    setFilters(newFilters);
    const filtered = applyFilters(initialOrders, newFilters);
    setFilteredOrders(filtered);
  }, [filters, initialOrders, applyFilters]);

  return {
    filteredOrders,
    filters,
    searchTerm,
    showFilters,
    setShowFilters,
    handleFilterChange,
    handleSearch,
    resetFilters,
    toggleFilters,
    filterByStatus
  };
};