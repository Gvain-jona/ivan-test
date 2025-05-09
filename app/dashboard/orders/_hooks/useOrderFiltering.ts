import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Order, OrdersTableFilters, OrderItem, OrderNote } from '@/types/orders';

/**
 * Custom hook to manage order filtering functionality
 */
export const useOrderFiltering = (initialOrders: Order[] | null | undefined) => {
  // Ensure initialOrders is always an array
  const safeInitialOrders = Array.isArray(initialOrders) ? initialOrders : [];
  const [filters, setFilters] = useState<OrdersTableFilters>({});
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(safeInitialOrders);
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

    // Filter by client type
    if (filtersToApply.clientType && filtersToApply.clientType.length > 0) {
      filtered = filtered.filter(order =>
        filtersToApply.clientType?.includes(order.client_type)
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

    // Enhanced search functionality for better UX
    if (filtersToApply.search) {
      const searchLower = filtersToApply.search.toLowerCase().trim();
      const searchTerms = searchLower.split(/\s+/); // Split by whitespace to search for each word

      filtered = filtered.filter(order => {
        // Check if all search terms are found in at least one of the searchable fields
        return searchTerms.every(term => {
          // Search in order ID and order number
          if (order.id?.toLowerCase().includes(term) ||
              order.order_number?.toLowerCase().includes(term)) {
            return true;
          }

          // Search in client name
          if (order.client_name?.toLowerCase().includes(term)) {
            return true;
          }

          // Search in items
          if (order.items?.some(item =>
            item.item_name?.toLowerCase().includes(term) ||
            item.description?.toLowerCase().includes(term)
          )) {
            return true;
          }

          // Search in notes
          if (order.notes?.some(note =>
            note.text?.toLowerCase().includes(term)
          )) {
            return true;
          }

          // Search in payment status
          if (order.payment_status?.toLowerCase().includes(term)) {
            return true;
          }

          // Search in status
          if (order.status?.toLowerCase().includes(term)) {
            return true;
          }

          // Search in date (if the term looks like a date)
          if (order.date?.includes(term) ||
              (order.date && new Date(order.date).toLocaleDateString().toLowerCase().includes(term))) {
            return true;
          }

          // No match found for this term
          return false;
        });
      });
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
    // Debug logging
    console.log('useOrderFiltering - Effect triggered:', {
      initialOrdersCount: initialOrders?.length || 0,
      isFirstRender: isFirstRenderRef.current,
      filtersApplied: Object.keys(filters).length > 0
    });

    // On first render, just set the refs and filtered orders
    if (isFirstRenderRef.current) {
      prevInitialOrdersRef.current = safeInitialOrders;
      prevFiltersRef.current = filters;
      const filtered = applyFilters(safeInitialOrders, filters);
      setFilteredOrders(filtered);
      console.log('useOrderFiltering - First render, setting filtered orders:', filtered.length);
      isFirstRenderRef.current = false;
      return;
    }

    // Skip if nothing has changed - use deep comparison
    const initialOrdersChanged = JSON.stringify(safeInitialOrders) !== JSON.stringify(prevInitialOrdersRef.current);
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(prevFiltersRef.current);

    console.log('useOrderFiltering - Change detection:', {
      initialOrdersChanged,
      filtersChanged,
      initialOrdersCount: safeInitialOrders.length,
      prevInitialOrdersCount: prevInitialOrdersRef.current?.length || 0
    });

    if (!initialOrdersChanged && !filtersChanged) {
      return;
    }

    // Update refs
    prevInitialOrdersRef.current = safeInitialOrders;
    prevFiltersRef.current = filters;

    // Apply current filters to new initialOrders
    const filtered = applyFilters(safeInitialOrders, filters);
    console.log('useOrderFiltering - Applying filters, result:', filtered.length);
    setFilteredOrders(filtered);
  }, [safeInitialOrders, applyFilters, filters]);



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
    const filtered = applyFilters(safeInitialOrders, newFilters);
    setFilteredOrders(filtered);

    return filtered.length; // Return count for pagination calculations
  }, [safeInitialOrders, applyFilters, filters, filteredOrders]);

  /**
   * Handle search for orders - enhanced for better UX with client-side filtering
   */
  const handleSearch = useCallback((term: string) => {
    // Skip if the search term hasn't changed
    if (term === searchTerm) {
      return;
    }

    // Update the search term state
    setSearchTerm(term);

    // Create new filters object with the search term
    const newFilters = {
      ...filters,
      search: term || undefined
    };

    // Apply filtering immediately using client-side filtering only
    setFilters(newFilters);

    // Apply the filters to the initial orders array
    const filtered = applyFilters(safeInitialOrders, newFilters);

    // Update the filtered orders state
    setFilteredOrders(filtered);

    // Return the number of filtered orders for pagination calculations
    return filtered.length;
  }, [filters, safeInitialOrders, applyFilters, searchTerm]);

  /**
   * Reset filters
   */
  const resetFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    setFilteredOrders(safeInitialOrders);
    setShowFilters(false);
  }, [safeInitialOrders]);

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
    const filtered = applyFilters(safeInitialOrders, newFilters);
    setFilteredOrders(filtered);
  }, [filters, safeInitialOrders, applyFilters]);

  return {
    filteredOrders,
    setFilteredOrders, // Expose the setter for direct manipulation
    filters,
    searchTerm,
    showFilters,
    setShowFilters,
    handleFilterChange,
    handleSearch,
    resetFilters,
    toggleFilters,
    filterByStatus,
    applyFilters // Expose the applyFilters function for direct use
  };
};