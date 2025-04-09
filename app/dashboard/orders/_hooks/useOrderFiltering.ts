import { useState, useCallback } from 'react';
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
   * Handle filter changes for orders
   */
  const handleFilterChange = useCallback((newFilters: OrdersTableFilters) => {
    setFilters(newFilters);
    
    // Apply filters to orders
    let filtered = [...initialOrders];
    
    // Filter by status
    if (newFilters.status && newFilters.status.length > 0) {
      filtered = filtered.filter(order => 
        newFilters.status?.includes(order.status)
      );
    }
    
    // Filter by payment status
    if (newFilters.paymentStatus && newFilters.paymentStatus.length > 0) {
      filtered = filtered.filter(order => 
        newFilters.paymentStatus?.includes(order.payment_status)
      );
    }
    
    // Filter by date range
    if (newFilters.startDate) {
      filtered = filtered.filter(order => 
        new Date(order.date) >= new Date(newFilters.startDate!)
      );
    }
    
    if (newFilters.endDate) {
      filtered = filtered.filter(order => 
        new Date(order.date) <= new Date(newFilters.endDate!)
      );
    }
    
    // Filter by search term
    if (newFilters.search) {
      const searchLower = newFilters.search.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchLower) ||
        order.client_name?.toLowerCase().includes(searchLower) ||
        order.items?.some((item: OrderItem) => 
          item.item_name?.toLowerCase().includes(searchLower)
        ) ||
        order.notes?.some((note: OrderNote) => 
          note.text.toLowerCase().includes(searchLower)
        )
      );
    }
    
    setFilteredOrders(filtered);
    
    return filtered.length; // Return count for pagination calculations
  }, [initialOrders]);
  
  /**
   * Handle search for orders
   */
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    const newFilters = {
      ...filters,
      search: term || undefined
    };
    
    // Apply filtering immediately
    handleFilterChange(newFilters);
  }, [filters, handleFilterChange]);
  
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
  
  return {
    filters,
    filteredOrders,
    searchTerm,
    showFilters,
    handleFilterChange,
    handleSearch,
    resetFilters,
    toggleFilters
  };
}; 