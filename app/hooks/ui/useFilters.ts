import { useState, useCallback, useEffect, useMemo } from 'react';

interface UseFiltersProps<T, F> {
  initialFilters?: Partial<F>;
  data: T[];
  filterFn: (item: T, filters: Partial<F>) => boolean;
  onFiltersChange?: (filters: Partial<F>) => void;
}

interface UseFiltersReturn<T, F> {
  filters: Partial<F>;
  filteredData: T[];
  setFilter: <K extends keyof F>(key: K, value: F[K] | undefined) => void;
  setFilters: (filters: Partial<F>) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

/**
 * Custom hook for managing filter state and filtered data
 */
export const useFilters = <T, F>({
  initialFilters = {},
  data,
  filterFn,
  onFiltersChange,
}: UseFiltersProps<T, F>): UseFiltersReturn<T, F> => {
  const [filters, setFiltersState] = useState<Partial<F>>(initialFilters);
  
  // Set a single filter value
  const setFilter = useCallback(<K extends keyof F>(key: K, value: F[K] | undefined) => {
    setFiltersState(prev => {
      // Create a new object to avoid mutating the previous state
      const newFilters = { ...prev };
      
      if (value === undefined || value === null || value === '') {
        // Remove the filter if value is empty
        delete newFilters[key];
      } else {
        // Set the filter value
        newFilters[key] = value;
      }
      
      // Call the change handler if provided
      if (onFiltersChange) {
        onFiltersChange(newFilters);
      }
      
      return newFilters;
    });
  }, [onFiltersChange]);
  
  // Set multiple filters at once
  const setFilters = useCallback((newFilters: Partial<F>) => {
    setFiltersState(prev => {
      const updatedFilters = { ...prev, ...newFilters };
      
      // Remove any undefined or null values
      Object.keys(updatedFilters).forEach(key => {
        const typedKey = key as keyof F;
        if (updatedFilters[typedKey] === undefined || updatedFilters[typedKey] === null || updatedFilters[typedKey] === '') {
          delete updatedFilters[typedKey];
        }
      });
      
      // Call the change handler if provided
      if (onFiltersChange) {
        onFiltersChange(updatedFilters);
      }
      
      return updatedFilters;
    });
  }, [onFiltersChange]);
  
  // Reset filters to initial state
  const resetFilters = useCallback(() => {
    setFiltersState({});
    
    if (onFiltersChange) {
      onFiltersChange({});
    }
  }, [onFiltersChange]);
  
  // Apply filters to data
  const filteredData = useMemo(() => {
    return data.filter(item => filterFn(item, filters));
  }, [data, filters, filterFn]);
  
  // Check if there are any active filters
  const hasActiveFilters = Object.keys(filters).length > 0;
  
  // Notify on mount with initial filters
  useEffect(() => {
    if (onFiltersChange && Object.keys(initialFilters).length > 0) {
      onFiltersChange(initialFilters);
    }
  }, [onFiltersChange, initialFilters]);
  
  return {
    filters,
    filteredData,
    setFilter,
    setFilters,
    resetFilters,
    hasActiveFilters,
  };
};

export default useFilters; 