'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { useMaterialPurchasesList } from '@/hooks/materials/useMaterialPurchases';
import { MaterialPurchase, MaterialPurchaseFilters, PaginationParams } from '@/types/materials';
import { DateRange } from 'react-day-picker';
import { format, addDays, startOfDay } from 'date-fns';

// Task filter types (for the tasks tab)
export type TaskFilterType = 'all' | 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek' | 'thisMonth' | 'upcoming' | 'overdue';

// Define the context type
interface MaterialPurchasesContextType {
  // Data
  purchases: MaterialPurchase[];
  filteredPurchases: MaterialPurchase[]; // Client-side filtered purchases
  total: number;
  isLoading: boolean;
  isError: boolean;

  // Server-side filters (for API calls)
  filters: MaterialPurchaseFilters;
  setFilters: (filters: MaterialPurchaseFilters) => void;
  pagination: PaginationParams;
  setPagination: (pagination: PaginationParams) => void;

  // Client-side filtering flag
  useClientSideFiltering: boolean;
  setUseClientSideFiltering: (value: boolean) => void;

  // Client-side filters (for tasks tab and purchases tab)
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  taskFilter: TaskFilterType;
  setTaskFilter: (filter: TaskFilterType) => void;

  // UI state for purchases tab
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  paymentStatusFilter: string;
  setPaymentStatusFilter: (status: string) => void;

  // Helper methods
  resetAllFilters: () => void;
  syncFilters: (tab: 'purchases' | 'tasks') => void;

  // Actions
  refreshPurchases: () => Promise<void>;
  createMaterialPurchase: (purchaseData: any) => Promise<MaterialPurchase>;
  updateMaterialPurchase: (id: string, purchaseData: any) => Promise<MaterialPurchase>;
  deleteMaterialPurchase: (id: string) => Promise<void>;
  isSubmitting: boolean;
}

// Create the context with a default value
const MaterialPurchasesContext = createContext<MaterialPurchasesContextType | undefined>(undefined);

// Provider component
export function MaterialPurchasesProvider({ children }: { children: ReactNode }) {
  // Server-side filters and pagination
  const [filters, setFilters] = useState<MaterialPurchaseFilters>({});
  const [pagination, setPagination] = useState<PaginationParams>({ page: 1, limit: 100 });

  // UI state for purchases tab
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  // Initialize payment status filter to 'all' to show all purchases
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');

  // Debug log for initial filter state
  useEffect(() => {
    console.log('MaterialPurchasesContext - Initial filter state:', {
      dateRange,
      paymentStatusFilter,
      searchQuery: '',
      taskFilter: 'all'
    });
  }, []);

  // Client-side filtering flag
  const [useClientSideFiltering, setUseClientSideFiltering] = useState(true);

  // Client-side filters for tasks tab and purchases tab
  const [searchQuery, setSearchQuery] = useState('');
  const [taskFilter, setTaskFilter] = useState<TaskFilterType>('all');

  // Always fetch all data for client-side filtering
  const apiFilters = useMemo(() => {
    return {};
  }, []);

  // Fetch material purchases with the current filters and pagination
  const {
    purchases,
    total,
    isLoading,
    isError,
    mutate,
    createMaterialPurchase,
    updateMaterialPurchase,
    deleteMaterialPurchase,
    isSubmitting
  } = useMaterialPurchasesList(
    apiFilters,
    pagination,
    { includePayments: true, includeNotes: true, includeInstallments: true }
  );

  // Function to refresh purchases with improved error handling
  const refreshPurchases = useCallback(async () => {
    try {
      console.log('MaterialPurchasesContext - Refreshing purchases data');
      const startTime = Date.now();

      // Add a timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Refresh purchases timeout - operation took too long'));
        }, 15000); // 15 second timeout
      });

      // Race the mutate against the timeout
      await Promise.race([
        mutate(),
        timeoutPromise
      ]);

      const duration = Date.now() - startTime;
      console.log(`MaterialPurchasesContext - Purchases data refreshed in ${duration}ms`);

      return Promise.resolve();
    } catch (error) {
      console.error('MaterialPurchasesContext - Error refreshing purchases data:', error);
      return Promise.reject(error);
    }
  }, [mutate]);

  // Load initial data when context is created with improved error handling
  useEffect(() => {
    console.log('MaterialPurchasesContext - Loading initial data');

    // Use refreshPurchases instead of mutate directly to get error handling
    refreshPurchases().catch(error => {
      console.error('MaterialPurchasesContext - Error during initial data load:', error);
    });

    // Set up a retry mechanism for failed initial loads
    const retryTimeout = setTimeout(() => {
      if (isError || (!isLoading && (!purchases || purchases.length === 0))) {
        console.log('MaterialPurchasesContext - Retrying initial data load after timeout');
        refreshPurchases().catch(error => {
          console.error('MaterialPurchasesContext - Error during retry of initial data load:', error);
        });
      }
    }, 5000); // 5 second retry

    return () => clearTimeout(retryTimeout);
  }, [mutate, refreshPurchases, isError, isLoading, purchases]);

  // Reset all filters
  const resetAllFilters = useCallback(() => {
    console.log('MaterialPurchasesContext - Resetting all filters');

    // Reset server-side filters
    setFilters({});
    setPagination({ page: 1, limit: 100 });

    // Reset UI state
    setDateRange(undefined);
    setPaymentStatusFilter('all');

    // Reset client-side filters
    setSearchQuery('');
    setTaskFilter('all');

    // Keep client-side filtering enabled
    setUseClientSideFiltering(true);

    console.log('MaterialPurchasesContext - Filters reset to defaults');

    // Always refresh data to ensure we have the latest
    console.log('MaterialPurchasesContext - Refreshing data after filter reset');

    // Force a refresh with a slight delay to ensure state updates have propagated
    setTimeout(() => {
      mutate();
    }, 0);
  }, [mutate]);

  // Convert between filter types
  const syncFilters = useCallback((tab: 'purchases' | 'tasks') => {
    if (tab === 'purchases') {
      // Convert task filters to purchase filters
      if (taskFilter !== 'all') {
        const today = startOfDay(new Date());

        // Convert task filter to date range
        let newDateRange: DateRange | undefined;

        switch (taskFilter) {
          case 'today':
            newDateRange = { from: today, to: today };
            break;
          case 'tomorrow':
            const tomorrow = addDays(today, 1);
            newDateRange = { from: tomorrow, to: tomorrow };
            break;
          case 'thisWeek':
            newDateRange = { from: today, to: addDays(today, 7) };
            break;
          case 'nextWeek':
            newDateRange = { from: addDays(today, 7), to: addDays(today, 14) };
            break;
          case 'thisMonth':
            const nextMonth = new Date(today);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            newDateRange = { from: today, to: nextMonth };
            break;
          case 'upcoming':
            newDateRange = { from: today, to: undefined };
            break;
          case 'overdue':
            // For overdue, we need to set an end date of yesterday
            const yesterday = addDays(today, -1);
            newDateRange = { from: undefined, to: yesterday };
            break;
        }

        setDateRange(newDateRange);
      }

      // Apply search query
      if (searchQuery) {
        // In purchases tab, we search by supplier
        setFilters(prev => ({ ...prev, supplier: searchQuery }));
      }

    } else if (tab === 'tasks') {
      // Convert purchase filters to task filters

      // Apply date range to task filter
      if (dateRange) {
        const today = startOfDay(new Date());
        const tomorrow = addDays(today, 1);
        const nextWeek = addDays(today, 7);

        if (dateRange.from && dateRange.to) {
          if (dateRange.from.getTime() === today.getTime() && dateRange.to.getTime() === today.getTime()) {
            setTaskFilter('today');
          } else if (dateRange.from.getTime() === tomorrow.getTime() && dateRange.to.getTime() === tomorrow.getTime()) {
            setTaskFilter('tomorrow');
          } else if (dateRange.from.getTime() === today.getTime() && dateRange.to.getTime() <= nextWeek.getTime()) {
            setTaskFilter('thisWeek');
          } else {
            setTaskFilter('upcoming');
          }
        } else if (dateRange.from && !dateRange.to) {
          setTaskFilter('upcoming');
        } else if (!dateRange.from && dateRange.to && dateRange.to.getTime() < today.getTime()) {
          setTaskFilter('overdue');
        }
      }

      // Apply search query from supplier filter
      if (filters.supplier) {
        setSearchQuery(filters.supplier);
      }
    }
  }, [taskFilter, searchQuery, dateRange, filters.supplier]);

  // Apply client-side filtering for the purchases tab
  const filteredPurchases = useMemo(() => {
    // Ensure purchases is a valid array
    if (!purchases || !Array.isArray(purchases)) {
      console.log('MaterialPurchasesContext - purchases is not a valid array');
      return [];
    }

    // Start with all purchases
    let filtered = [...purchases];
    console.log('MaterialPurchasesContext - initial purchases count:', purchases.length);

    // Debug all filter values
    console.log('MaterialPurchasesContext - current filter values:', {
      searchQuery,
      dateRange,
      paymentStatusFilter
    });

    // If we have no purchases, return empty array
    if (purchases.length === 0) {
      console.log('MaterialPurchasesContext - No purchases available, returning empty array');
      return [];
    }

    // Apply search filter if provided
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(purchase =>
        (purchase.supplier_name || '').toLowerCase().includes(searchLower) ||
        (purchase.material_name || '').toLowerCase().includes(searchLower)
      );
      console.log('MaterialPurchasesContext - after search filter:', filtered.length);
    }

    // Apply date range filter if provided
    if (dateRange && (dateRange.from || dateRange.to)) {
      filtered = filtered.filter(purchase => {
        // Ensure purchase.date is valid
        if (!purchase.date) return true;

        const purchaseDate = new Date(purchase.date);
        if (isNaN(purchaseDate.getTime())) return true; // Skip invalid dates

        // If from date is provided, filter out purchases before that date
        if (dateRange.from && purchaseDate < dateRange.from) {
          return false;
        }

        // If to date is provided, filter out purchases after that date
        if (dateRange.to) {
          const toDateEnd = new Date(dateRange.to);
          toDateEnd.setHours(23, 59, 59, 999); // End of the day
          if (purchaseDate > toDateEnd) {
            return false;
          }
        }

        return true;
      });
      console.log('MaterialPurchasesContext - after date range filter:', filtered.length);
    }

    // Apply payment status filter if provided and not set to 'all'
    if (paymentStatusFilter && paymentStatusFilter !== 'all') {
      filtered = filtered.filter(purchase => {
        // Debug individual purchase payment status
        if (filtered.length < 10) {
          console.log(`Purchase ${purchase.id} payment status: ${purchase.payment_status}`);
        }
        return purchase.payment_status === paymentStatusFilter;
      });
      console.log('MaterialPurchasesContext - after payment status filter:', filtered.length, 'paymentStatusFilter:', paymentStatusFilter);
    } else {
      console.log('MaterialPurchasesContext - payment status filter is "all", not filtering');
    }

    // Debug the final filtered purchases
    console.log('MaterialPurchasesContext - final filtered purchases count:', filtered.length);

    // If we have purchases but no filtered purchases, return all purchases
    // This is a safety measure to ensure we always show data
    if (purchases.length > 0 && filtered.length === 0) {
      console.log('MaterialPurchasesContext - No filtered purchases but have data, returning all purchases');
      return purchases;
    }

    return filtered;
  }, [purchases, searchQuery, dateRange, paymentStatusFilter]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    // Data
    purchases: purchases || [],
    filteredPurchases: filteredPurchases,
    total: filteredPurchases.length,
    isLoading,
    isError,

    // Server-side filters and pagination
    filters,
    setFilters,
    pagination,
    setPagination,

    // Client-side filtering flag
    useClientSideFiltering,
    setUseClientSideFiltering,

    // Client-side filters
    searchQuery,
    setSearchQuery,
    taskFilter,
    setTaskFilter,

    // UI state for purchases tab
    dateRange,
    setDateRange,
    paymentStatusFilter,
    setPaymentStatusFilter,

    // Helper methods
    resetAllFilters,
    syncFilters,

    // Actions
    refreshPurchases,
    createMaterialPurchase,
    updateMaterialPurchase,
    deleteMaterialPurchase,
    isSubmitting
  }), [
    purchases,
    filteredPurchases,
    total,
    isLoading,
    isError,
    filters,
    setFilters,
    pagination,
    setPagination,
    useClientSideFiltering,
    setUseClientSideFiltering,
    searchQuery,
    setSearchQuery,
    taskFilter,
    setTaskFilter,
    dateRange,
    setDateRange,
    paymentStatusFilter,
    setPaymentStatusFilter,
    resetAllFilters,
    syncFilters,
    refreshPurchases,
    createMaterialPurchase,
    updateMaterialPurchase,
    deleteMaterialPurchase,
    isSubmitting
  ]);

  return (
    <MaterialPurchasesContext.Provider value={contextValue}>
      {children}
    </MaterialPurchasesContext.Provider>
  );
}

// Custom hook to use the context
export function useMaterialPurchases() {
  const context = useContext(MaterialPurchasesContext);
  if (context === undefined) {
    throw new Error('useMaterialPurchases must be used within a MaterialPurchasesProvider');
  }
  return context;
}
