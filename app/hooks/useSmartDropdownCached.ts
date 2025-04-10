'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { SmartComboboxOption } from '@/components/ui/smart-combobox';
import { useDropdownCache, EntityType } from '@/context/DropdownCacheContext';

interface UseSmartDropdownCachedProps {
  entityType: EntityType;
  parentId?: string;
  initialOptions?: SmartComboboxOption[];
  cacheKey?: string;
}

interface UseSmartDropdownCachedReturn {
  options: SmartComboboxOption[];
  recentOptions: SmartComboboxOption[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  createOption: (label: string) => Promise<SmartComboboxOption | null>;
  refreshOptions: () => Promise<void>;
  instanceId: string;
}

/**
 * A hook that provides cached dropdown options for smart comboboxes
 * This version uses the global dropdown cache for better performance
 */
export function useSmartDropdownCached({
  entityType,
  parentId,
  initialOptions = [], // Always use an empty array to prevent hardcoded values
  cacheKey,
}: UseSmartDropdownCachedProps): UseSmartDropdownCachedReturn {
  // Get the dropdown cache
  const { getOptions, isLoading: isCacheLoading, refreshCache, createOption: createCacheOption } = useDropdownCache();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [recentOptions, setRecentOptions] = useState<SmartComboboxOption[]>([]);

  // Create a unique instance ID for this hook instance
  const instanceId = useMemo(() => `${entityType}-${Math.random().toString(36).substring(2, 9)}`, [entityType]);

  // Track loading timeout
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track local loading state
  const [localLoading, setLocalLoading] = useState(false);

  // Get options from cache
  const options = useMemo(() => {
    const cacheOptions = getOptions(entityType, parentId);

    // If we have a search query, filter the options
    if (searchQuery) {
      return cacheOptions.filter((option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return cacheOptions;
  }, [getOptions, entityType, parentId, searchQuery]);

  // Check if loading using useMemo to prevent unnecessary recalculations
  // Also handle local loading state
  const isLoading = useMemo(() => {
    const cacheIsLoading = isCacheLoading(entityType);

    // If cache starts loading, set local loading state
    if (cacheIsLoading && !localLoading) {
      setLocalLoading(true);

      // Set a timeout to reset local loading state after a reasonable time
      // This prevents the UI from being stuck in loading state
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      loadingTimeoutRef.current = setTimeout(() => {
        setLocalLoading(false);
        console.log(`[SmartDropdownCached] Force reset loading state for ${entityType} after timeout`);
      }, 5000); // 5 second max loading time
    }

    // If cache stops loading, reset local loading state
    if (!cacheIsLoading && localLoading) {
      setLocalLoading(false);

      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }

    return cacheIsLoading || localLoading;
  }, [isCacheLoading, entityType, localLoading]);

  // Function to add an option to recent options
  const addToRecentOptions = useCallback((option: SmartComboboxOption) => {
    setRecentOptions((prev) => {
      // Check if already in recent options
      const exists = prev.some((opt) => opt.value === option.value);

      if (exists) {
        // Move to the top
        return [
          option,
          ...prev.filter((opt) => opt.value !== option.value),
        ].slice(0, 5); // Keep only the 5 most recent
      }

      // Add to the top
      return [option, ...prev].slice(0, 5); // Keep only the 5 most recent
    });

    // Store in localStorage if we have a cache key
    if (cacheKey) {
      try {
        const storageKey = `recent-${cacheKey}`;
        const recentData = JSON.stringify([option, ...recentOptions].slice(0, 5));
        localStorage.setItem(storageKey, recentData);
      } catch (error) {
        console.error('Error storing recent options in localStorage:', error);
      }
    }
  }, [recentOptions, cacheKey]);

  // Function to create a new option
  const createOption = useCallback(async (label: string): Promise<SmartComboboxOption | null> => {
    const newOption = await createCacheOption(entityType, label, parentId);

    if (newOption) {
      // Add to recent options
      addToRecentOptions(newOption);
    }

    return newOption;
  }, [createCacheOption, entityType, parentId, addToRecentOptions]);

  // Function to refresh options
  const refreshOptions = useCallback(async (): Promise<void> => {
    await refreshCache(entityType, parentId);
  }, [refreshCache, entityType, parentId]);

  // Load recent options from localStorage on mount
  useEffect(() => {
    if (cacheKey) {
      try {
        const storageKey = `recent-${cacheKey}`;
        const storedData = localStorage.getItem(storageKey);

        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setRecentOptions(parsedData);
        }
      } catch (error) {
        console.error('Error loading recent options from localStorage:', error);
      }
    }

    // Clean up loading timeout on unmount
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, [cacheKey]);

  // Return the hook interface
  return {
    options,
    recentOptions,
    isLoading,
    searchQuery,
    setSearchQuery,
    createOption,
    refreshOptions,
    instanceId,
  };
}
