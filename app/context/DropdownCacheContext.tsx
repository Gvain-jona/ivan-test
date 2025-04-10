'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SmartComboboxOption } from '@/components/ui/smart-combobox';
import { toast } from '@/components/ui/use-toast';

// Define the entity types we'll cache
export type EntityType = 'clients' | 'categories' | 'items' | 'suppliers' | 'sizes';

// Define the cache structure
interface DropdownCache {
  [entityType: string]: {
    data: SmartComboboxOption[];
    lastFetched: number;
    isLoading: boolean;
    error: string | null;
  };
}

// Define the context value type
interface DropdownCacheContextValue {
  cache: DropdownCache;
  getOptions: (entityType: EntityType, parentId?: string) => SmartComboboxOption[];
  isLoading: (entityType: EntityType) => boolean;
  refreshCache: (entityType: EntityType, parentId?: string) => Promise<void>;
  createOption: (entityType: EntityType, label: string, parentId?: string) => Promise<SmartComboboxOption | null>;
  invalidateCache: (entityType: EntityType) => void;
  initialLoadComplete: boolean;
}

// Create the context
const DropdownCacheContext = createContext<DropdownCacheContextValue | undefined>(undefined);

// Cache expiration time (30 minutes)
const CACHE_EXPIRATION = 30 * 60 * 1000;

// Helper function to transform data to options
function transformDataToOptions(data: any[]): SmartComboboxOption[] {
  return data.map((item) => ({
    id: item.id,
    value: item.id,
    label: item.name,
    ...item, // Include all original data for reference
  }));
}

// Provider component
export function DropdownCacheProvider({ children }: { children: React.ReactNode }) {
  const [cache, setCache] = useState<DropdownCache>({});
  const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);
  const supabase = createClient();

  // Function to check if cache is valid
  const isCacheValid = useCallback((entityType: EntityType): boolean => {
    const entityCache = cache[entityType];
    if (!entityCache) return false;

    const now = Date.now();

    // Consider cache valid even with an error if we have fallback data and it's recent
    const hasValidData = entityCache.data.length > 0;
    const isRecent = now - entityCache.lastFetched < CACHE_EXPIRATION;
    const isNotLoading = !entityCache.isLoading;

    // If we have data and it's recent, consider it valid even if there was an error
    // This prevents constant retries when the database is unavailable
    return hasValidData && isRecent && isNotLoading;
  }, [cache]);

  // Track fetch attempts and timeouts
  const fetchAttemptsRef = React.useRef<Record<string, number>>({});
  const timeoutIdsRef = React.useRef<Record<string, NodeJS.Timeout>>({});

  // Calculate backoff time based on number of attempts
  const getBackoffTime = (attempts: number): number => {
    // Exponential backoff: 1s, 2s, 4s, 8s, max 10s
    return Math.min(Math.pow(2, attempts) * 1000, 10000);
  };

  // Helper function to check Supabase connection
  const checkConnection = async (): Promise<boolean> => {
    try {
      console.log('[DropdownCache] Checking Supabase connection...');
      // Use a simple query to check if Supabase is responding
      const { data, error } = await supabase.from('categories').select('count').limit(1);

      if (error) {
        console.error('[DropdownCache] Supabase connection check failed:', error);
        return false;
      }

      console.log('[DropdownCache] Supabase connection check successful');
      return true;
    } catch (error) {
      console.error('[DropdownCache] Error checking Supabase connection:', error);
      return false;
    }
  };

  // Function to fetch data for an entity type with retry logic
  const fetchData = useCallback(async (entityType: EntityType, parentId?: string): Promise<void> => {
    // Generate a unique key for this fetch operation
    const fetchKey = parentId ? `${entityType}-${parentId}` : entityType;

    // Skip if already loading
    if (cache[entityType]?.isLoading) {
      console.log(`[DropdownCache] Already loading ${entityType}, skipping fetch`);
      return;
    }

    // Clear any existing timeout for this entity
    if (timeoutIdsRef.current[fetchKey]) {
      clearTimeout(timeoutIdsRef.current[fetchKey]);
      delete timeoutIdsRef.current[fetchKey];
    }

    // Track fetch attempt
    fetchAttemptsRef.current[fetchKey] = (fetchAttemptsRef.current[fetchKey] || 0) + 1;
    const attempts = fetchAttemptsRef.current[fetchKey];

    // Update loading state
    setCache((prev) => ({
      ...prev,
      [entityType]: {
        ...(prev[entityType] || { data: [] }),
        isLoading: true,
        error: null,
      },
    }));

    // Set a timeout to prevent infinite loading
    // Use exponential backoff for the timeout duration
    const timeoutDuration = getBackoffTime(attempts);
    console.log(`[DropdownCache] Setting timeout for ${entityType} (attempt ${attempts}): ${timeoutDuration}ms`);

    timeoutIdsRef.current[fetchKey] = setTimeout(() => {
      console.log(`[DropdownCache] Fetch timeout for ${entityType}, resetting loading state (attempt ${attempts})`);

      // Create fallback data for essential entity types
      let fallbackData: SmartComboboxOption[] = [];

      if (entityType === 'categories') {
        fallbackData = [
          { id: 'fallback-category-1', value: 'fallback-category-1', label: 'General Printing' },
          { id: 'fallback-category-2', value: 'fallback-category-2', label: 'Business Cards' },
        ];
      } else if (entityType === 'sizes') {
        fallbackData = [
          { id: 'fallback-size-1', value: 'fallback-size-1', label: 'Standard' },
          { id: 'fallback-size-2', value: 'fallback-size-2', label: 'A4' },
        ];
      }

      setCache((prev) => ({
        ...prev,
        [entityType]: {
          ...(prev[entityType] || { data: [] }),
          data: fallbackData.length > 0 ? fallbackData : (prev[entityType]?.data || []),
          isLoading: false,
          error: 'Fetch timeout',
          lastFetched: Date.now(), // Update lastFetched to prevent immediate retry
        },
      }));

      // Clear the timeout reference
      delete timeoutIdsRef.current[fetchKey];

      // If we've tried too many times, reset the counter and use fallback data
      if (attempts >= 3) {
        console.log(`[DropdownCache] Too many fetch attempts for ${entityType}, using fallback data`);
        fetchAttemptsRef.current[fetchKey] = 0;

        // If this is an essential entity type and we have fallback data, mark as successful
        if ((entityType === 'categories' || entityType === 'sizes') && fallbackData.length > 0) {
          console.log(`[DropdownCache] Using fallback data for ${entityType}`);
          // No need to do anything else, we've already updated the cache
        }
      }
    }, timeoutDuration);

    try {
      // Generate a unique key for this fetch operation
      const fetchKey = parentId ? `${entityType}-${parentId}` : entityType;
      console.log(`[DropdownCache] Fetching ${entityType}... (attempt ${fetchAttemptsRef.current[fetchKey]})`, { parentId });

      // If this is a retry attempt, add a small delay to prevent overwhelming the server
      if (fetchAttemptsRef.current[fetchKey] > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Build the query based on entity type and parent ID
      let query = supabase.from(entityType).select('*');

      // Add filters for parent ID if needed
      if (parentId && entityType === 'items') {
        query = query.eq('category_id', parentId);
      }

      // Add order by and limit
      query = query.order('name').limit(100);

      // Execute the query
      const { data, error } = await query;

      if (error) {
        // Try without status filter if status column doesn't exist
        if (error.message.includes('column "status" does not exist')) {
          console.log(`[DropdownCache] Retrying ${entityType} query without status filter...`);
          let retryQuery = supabase
            .from(entityType)
            .select('*')
            .order('name')
            .limit(100);

          if (parentId && entityType === 'items') {
            retryQuery = retryQuery.eq('category_id', parentId);
          }

          const retryResult = await retryQuery;

          if (retryResult.error) {
            console.error(`[DropdownCache] Retry failed for ${entityType}:`, retryResult.error);
            throw retryResult.error;
          }

          console.log(`[DropdownCache] Retry successful for ${entityType}, got ${retryResult.data?.length || 0} items`);
          const transformedOptions = transformDataToOptions(retryResult.data || []);

          // Clear the timeout
          if (timeoutIdsRef.current[fetchKey]) {
            clearTimeout(timeoutIdsRef.current[fetchKey]);
            delete timeoutIdsRef.current[fetchKey];
          }

          // Reset fetch attempts counter on success
          fetchAttemptsRef.current[fetchKey] = 0;

          setCache((prev) => ({
            ...prev,
            [entityType]: {
              data: transformedOptions,
              lastFetched: Date.now(),
              isLoading: false,
              error: null,
            },
          }));

          return;
        } else {
          console.error(`[DropdownCache] Error fetching ${entityType}:`, error);
          throw error;
        }
      }

      // Clear the timeout
      if (timeoutIdsRef.current[fetchKey]) {
        clearTimeout(timeoutIdsRef.current[fetchKey]);
        delete timeoutIdsRef.current[fetchKey];
      }

      // Reset fetch attempts counter on success
      fetchAttemptsRef.current[fetchKey] = 0;

      // Transform data to options
      const transformedOptions = transformDataToOptions(data || []);

      // Update cache
      setCache((prev) => ({
        ...prev,
        [entityType]: {
          data: transformedOptions,
          lastFetched: Date.now(),
          isLoading: false,
          error: null,
        },
      }));

      console.log(`[DropdownCache] Fetched ${entityType}:`, { count: transformedOptions.length });
    } catch (error: any) {
      // Generate a unique key for this fetch operation
      const fetchKey = parentId ? `${entityType}-${parentId}` : entityType;

      // Clear the timeout
      if (timeoutIdsRef.current[fetchKey]) {
        clearTimeout(timeoutIdsRef.current[fetchKey]);
        delete timeoutIdsRef.current[fetchKey];
      }

      console.error(`[DropdownCache] Error fetching ${entityType}:`, error);

      // Update cache with error
      setCache((prev) => ({
        ...prev,
        [entityType]: {
          ...(prev[entityType] || { data: [] }),
          isLoading: false,
          error: error.message || 'Unknown error',
        },
      }));

      // Only show toast for meaningful errors and only on the first few attempts
      const attempts = fetchAttemptsRef.current[fetchKey] || 0;
      if (attempts <= 2 && error && (error.message || Object.keys(error).length > 0)) {
        toast({
          title: 'Error',
          description: `Failed to load ${entityType}. ${error?.message || ''}`,
          variant: 'destructive',
        });
      }
    }
  }, [supabase, cache]);

  // Function to check if data needs to be fetched
  const checkAndFetchData = useCallback((entityType: EntityType, parentId?: string): void => {
    // Generate a unique key for this fetch operation
    const fetchKey = parentId ? `${entityType}-${parentId}` : entityType;

    // If we've tried too many times recently, wait before trying again
    const attempts = fetchAttemptsRef.current[fetchKey] || 0;
    if (attempts > 3) {
      const lastFetched = cache[entityType]?.lastFetched || 0;
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetched;

      // If we've tried recently, don't try again for a while
      if (timeSinceLastFetch < 30000) { // 30 seconds
        return;
      }

      // Reset the counter after waiting
      fetchAttemptsRef.current[fetchKey] = 0;
    }

    // If it's items with a parent ID, we need to filter by parent
    if (entityType === 'items' && parentId) {
      // If not in cache or empty, trigger a fetch
      if (!cache[entityType]?.data?.length && !cache[entityType]?.isLoading) {
        console.log(`[DropdownCache] Need to fetch ${entityType} with parentId ${parentId}`);
        // Use requestAnimationFrame to schedule after render
        if (typeof window !== 'undefined') {
          requestAnimationFrame(() => fetchData(entityType, parentId));
        }
      }
      return;
    }

    // For other entity types, check if cache is valid
    if (!isCacheValid(entityType) && !cache[entityType]?.isLoading) {
      console.log(`[DropdownCache] Need to fetch ${entityType}, cache invalid`);
      // Use requestAnimationFrame to schedule after render
      if (typeof window !== 'undefined') {
        requestAnimationFrame(() => fetchData(entityType));
      }
    }
  }, [cache, isCacheValid, fetchData]);

  // Function to get options for an entity type
  const getOptions = useCallback((entityType: EntityType, parentId?: string): SmartComboboxOption[] => {
    // Use requestAnimationFrame to schedule data fetching after render
    // This prevents the "Cannot update a component while rendering a different component" error
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        checkAndFetchData(entityType, parentId);
      });
    }

    // If it's items with a parent ID, we need to filter by parent
    if (entityType === 'items' && parentId) {
      // If we have items in cache, filter them by parent ID
      if (cache[entityType]?.data?.length > 0) {
        return cache[entityType].data.filter(
          (item) => item.category_id === parentId
        );
      }
      return [];
    }

    // Return cached data or empty array
    return cache[entityType]?.data || [];
  }, [cache, checkAndFetchData]);

  // Function to check if an entity type is loading
  const isLoading = useCallback((entityType: EntityType): boolean => {
    return cache[entityType]?.isLoading || false;
  }, [cache]);

  // Function to refresh the cache for an entity type
  const refreshCache = useCallback(async (entityType: EntityType, parentId?: string): Promise<void> => {
    await fetchData(entityType, parentId);
  }, [fetchData]);

  // Function to invalidate the cache for an entity type
  const invalidateCache = useCallback((entityType: EntityType): void => {
    setCache((prev) => {
      const newCache = { ...prev };
      delete newCache[entityType];
      return newCache;
    });
  }, []);

  // Function to create a new option
  const createOption = useCallback(async (
    entityType: EntityType,
    label: string,
    parentId?: string
  ): Promise<SmartComboboxOption | null> => {
    try {
      console.log(`[DropdownCache] Creating new ${entityType}:`, { label, parentId });

      // Prepare data for insertion
      const newData: any = {
        name: label,
      };

      // Add parent ID if needed
      if (parentId && entityType === 'items') {
        newData.category_id = parentId;
      }

      // Insert data
      let insertResult = await supabase
        .from(entityType)
        .insert(newData)
        .select()
        .single();

      // Handle errors
      if (insertResult.error) {
        // Try without status field if status column doesn't exist
        if (insertResult.error.message.includes('column "status" does not exist')) {
          delete newData.status;
          insertResult = await supabase
            .from(entityType)
            .insert(newData)
            .select()
            .single();
        }

        if (insertResult.error) {
          throw insertResult.error;
        }
      }

      // Transform data to option
      const newOption = transformDataToOptions([insertResult.data])[0];

      // Update cache
      setCache((prev) => {
        const entityCache = prev[entityType] || { data: [], lastFetched: 0, isLoading: false, error: null };

        // Check if option already exists to avoid duplicates
        const exists = entityCache.data.some((opt) => opt.value === newOption.value);

        if (exists) {
          return prev;
        }

        return {
          ...prev,
          [entityType]: {
            ...entityCache,
            data: [newOption, ...entityCache.data],
            lastFetched: Date.now(),
          },
        };
      });

      console.log(`[DropdownCache] Created new ${entityType}:`, newOption);

      // Refresh cache after a short delay to ensure consistency
      setTimeout(() => {
        refreshCache(entityType, parentId);
      }, 500);

      return newOption;
    } catch (error: any) {
      console.error(`[DropdownCache] Error creating ${entityType}:`, error);

      // Provide specific error messages
      let errorMessage = `Failed to create new ${entityType.slice(0, -1)}.`;

      if (error?.message) {
        if (error.message.includes('duplicate key')) {
          errorMessage = `A ${entityType.slice(0, -1)} with this name already exists.`;
        } else if (error.message.includes('violates foreign key constraint')) {
          errorMessage = `Invalid reference to another record. Please check your selection.`;
        } else if (error.message.includes('permission denied')) {
          errorMessage = `You don't have permission to create a new ${entityType.slice(0, -1)}.`;
        } else {
          errorMessage += ` ${error.message}`;
        }
      }

      // Only show toast for meaningful errors
      if (error && (error.message || Object.keys(error).length > 0)) {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }

      // Create a fallback option for the user to continue working
      const fallbackOption: SmartComboboxOption = {
        id: `temp-${Date.now()}`,
        value: `temp-${Date.now()}`,
        label: label,
      };

      console.log(`[DropdownCache] Created fallback option for ${entityType}:`, fallbackOption);
      return fallbackOption;
    }
  }, [supabase, refreshCache]);

  // Function to check Supabase connection
  const checkSupabaseConnection = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[DropdownCache] Checking Supabase connection...');
      // Use a simple query to check if Supabase is responding
      const { data, error } = await supabase.from('categories').select('count').limit(1);

      if (error) {
        console.error('[DropdownCache] Supabase connection check failed:', error);
        return false;
      }

      console.log('[DropdownCache] Supabase connection check successful');
      return true;
    } catch (error) {
      console.error('[DropdownCache] Error checking Supabase connection:', error);
      return false;
    }
  }, [supabase]);

  // Function to create fallback data if fetch fails
  const createFallbackData = useCallback((entityType: EntityType) => {
    console.log(`[DropdownCache] Creating fallback data for ${entityType}`);

    let fallbackData: SmartComboboxOption[] = [];

    // Create fallback data based on entity type
    if (entityType === 'categories') {
      fallbackData = [
        { id: 'fallback-category-1', value: 'fallback-category-1', label: 'General Printing' },
        { id: 'fallback-category-2', value: 'fallback-category-2', label: 'Business Cards' },
        { id: 'fallback-category-3', value: 'fallback-category-3', label: 'Banners' },
      ];
    } else if (entityType === 'sizes') {
      fallbackData = [
        { id: 'fallback-size-1', value: 'fallback-size-1', label: 'Standard' },
        { id: 'fallback-size-2', value: 'fallback-size-2', label: 'A4' },
        { id: 'fallback-size-3', value: 'fallback-size-3', label: 'A3' },
      ];
    }

    // Update cache with fallback data
    setCache((prev) => ({
      ...prev,
      [entityType]: {
        data: fallbackData,
        lastFetched: Date.now(),
        isLoading: false,
        error: null,
      },
    }));

    return fallbackData;
  }, []);

  // Prefetch common data on mount
  useEffect(() => {
    const prefetchData = async () => {
      console.log('[DropdownCache] Prefetching common dropdown data...');

      // First check if Supabase is responding
      const isConnected = await checkSupabaseConnection();

      if (!isConnected) {
        console.warn('[DropdownCache] Supabase connection unavailable, using fallback data');
        // Create fallback data for essential entity types
        createFallbackData('categories');
        createFallbackData('sizes');

        // Mark initial load as complete even with fallback data
        setInitialLoadComplete(true);
        console.log('[DropdownCache] Initial load marked as complete with fallback data');
        return;
      }

      // Track which entity types failed to load
      const failedEntityTypes: EntityType[] = [];

      // Helper function to prefetch with error handling
      const prefetchWithFallback = async (entityType: EntityType) => {
        try {
          console.log(`[DropdownCache] Prefetching ${entityType}...`);
          await fetchData(entityType);
          return true;
        } catch (error) {
          console.error(`[DropdownCache] Error prefetching ${entityType}:`, error);
          failedEntityTypes.push(entityType);
          return false;
        }
      };

      // Prefetch essential entity types first with longer delays
      // This helps prevent overwhelming the database and reduces race conditions
      await prefetchWithFallback('categories');
      await new Promise(resolve => setTimeout(resolve, 800));

      await prefetchWithFallback('sizes');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mark initial load as complete after essential data is loaded
      // This allows the app to proceed even if non-essential data is still loading
      setInitialLoadComplete(true);
      console.log('[DropdownCache] Initial load marked as complete after essential data');

      // Then load non-essential data
      await prefetchWithFallback('clients');
      await new Promise(resolve => setTimeout(resolve, 800));

      await prefetchWithFallback('items');

      // Handle any failed entity types
      if (failedEntityTypes.length > 0) {
        console.warn(`[DropdownCache] Failed to prefetch: ${failedEntityTypes.join(', ')}`);

        // Only show toast if essential data failed
        const essentialFailed = failedEntityTypes.some(type =>
          type === 'categories' || type === 'sizes'
        );

        if (essentialFailed) {
          toast({
            title: 'Data Loading Issue',
            description: 'Some dropdown data could not be loaded. Using fallback data.',
            variant: 'destructive',
          });
        }

        // Create fallback data for essential entity types that failed
        failedEntityTypes.forEach(entityType => {
          if (entityType === 'categories' || entityType === 'sizes') {
            createFallbackData(entityType);
          }
        });
      } else {
        console.log('[DropdownCache] Prefetch complete successfully');
      }

      console.log('[DropdownCache] All prefetch operations completed');
    };

    // Start prefetching with a small delay to allow the component to mount fully
    const prefetchTimer = setTimeout(() => {
      prefetchData();
    }, 800); // Increased delay to ensure component is fully mounted

    // Set up a refresh interval (every 30 minutes)
    const intervalId = setInterval(() => {
      console.log('[DropdownCache] Refreshing cache...');
      prefetchData();
    }, CACHE_EXPIRATION);

    return () => {
      // Clean up all timeouts on unmount
      clearTimeout(prefetchTimer);
      clearInterval(intervalId);

      // Clear all fetch timeouts
      Object.values(timeoutIdsRef.current).forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      timeoutIdsRef.current = {};
    };
  }, [fetchData, createFallbackData]);

  // Create context value
  const value: DropdownCacheContextValue = {
    cache,
    getOptions,
    isLoading,
    refreshCache,
    createOption,
    invalidateCache,
    initialLoadComplete,
  };

  return (
    <DropdownCacheContext.Provider value={value}>
      {children}
    </DropdownCacheContext.Provider>
  );
}

// Hook to use the dropdown cache
export function useDropdownCache() {
  const context = useContext(DropdownCacheContext);

  if (context === undefined) {
    throw new Error('useDropdownCache must be used within a DropdownCacheProvider');
  }

  return context;
}
