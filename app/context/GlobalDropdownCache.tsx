'use client';

// Add type declarations for global window properties
declare global {
  interface Window {
    __fetchedOptions?: Record<string, boolean>;
    __lastSearches?: Record<string, number>;
  }
}

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { fetchDropdownOptions, createDropdownOption, EntityType } from '../actions/options';
import { SmartComboboxOption } from '@/components/ui/smart-combobox';
import { toast } from '@/components/ui/use-toast';

// Define the cache structure
interface CacheEntry {
  data: SmartComboboxOption[];
  timestamp: number;
  isLoading: boolean;
  error: string | null;
}

interface GlobalCache {
  clients: CacheEntry;
  categories: CacheEntry;
  items: Record<string, CacheEntry>; // Keyed by parentId
  sizes: CacheEntry;
  suppliers: CacheEntry;
}

// Define the context value type
interface GlobalDropdownCacheContextValue {
  // Data access methods
  getOptions: (entityType: EntityType, parentId?: string) => SmartComboboxOption[];
  isLoading: (entityType: EntityType, parentId?: string) => boolean;
  hasError: (entityType: EntityType, parentId?: string) => boolean;

  // Data manipulation methods
  refreshOptions: (entityType: EntityType, parentId?: string, search?: string) => Promise<void>;
  createOption: (entityType: EntityType, name: string, parentId?: string) => Promise<SmartComboboxOption | null>;
  searchOptions: (entityType: EntityType, search: string, parentId?: string) => Promise<void>;

  // Cache management
  invalidateCache: (entityType: EntityType, parentId?: string) => void;
  prefetchAll: () => void;

  // Status
  isInitialized: boolean;

  // Direct cache access
  cache: GlobalCache;
}

// Create the context
const GlobalDropdownCacheContext = createContext<GlobalDropdownCacheContextValue | undefined>(undefined);

// Cache TTL in milliseconds (30 minutes)
const CACHE_TTL = 30 * 60 * 1000;

// Prefetch TTL in milliseconds (15 minutes)
const PREFETCH_INTERVAL = 15 * 60 * 1000;

// Initial cache state
const initialCacheState: GlobalCache = {
  clients: { data: [], timestamp: 0, isLoading: false, error: null },
  categories: { data: [], timestamp: 0, isLoading: false, error: null },
  items: {}, // Empty record for items (keyed by parentId)
  sizes: { data: [], timestamp: 0, isLoading: false, error: null },
  suppliers: { data: [], timestamp: 0, isLoading: false, error: null },
};

// Provider component
export function GlobalDropdownCacheProvider({ children }: { children: React.ReactNode }) {
  // State for the cache
  const [cache, setCache] = useState<GlobalCache>(initialCacheState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs for tracking fetch operations
  const pendingFetches = useRef<Record<string, boolean>>({});
  const fetchTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  // Helper to get cache key
  const getCacheKey = (entityType: EntityType, parentId?: string): string => {
    return parentId ? `${entityType}-${parentId}` : entityType;
  };

  // Check if cache is stale
  const isCacheStale = useCallback((entityType: EntityType, parentId?: string): boolean => {
    const key = getCacheKey(entityType, parentId);

    if (entityType === 'items' && parentId) {
      const itemsCache = cache.items[parentId];
      if (!itemsCache) return true;
      return Date.now() - itemsCache.timestamp > CACHE_TTL;
    }

    const entityCache = cache[entityType as keyof Omit<GlobalCache, 'items'>];
    if (!entityCache) return true;
    return Date.now() - entityCache.timestamp > CACHE_TTL;
  }, [cache]);



  // Refresh options (fetch from server) with improved error handling and race condition prevention
  const refreshOptions = useCallback(async (entityType: EntityType, parentId?: string, search?: string): Promise<void> => {
    const cacheKey = getCacheKey(entityType, parentId);

    // Generate a unique request ID for this specific fetch operation
    const requestId = Date.now();

    // Skip if already fetching this exact data
    if (pendingFetches.current[cacheKey]) {
      console.log(`[GlobalCache] Already fetching ${cacheKey}, skipping duplicate request`);
      return;
    }

    // Check if we have fresh data and no search term
    if (!search && !isCacheStale(entityType, parentId)) {
      // If we have items for this category and they're not stale, don't fetch again
      if (entityType === 'items' && parentId && cache.items && cache.items[parentId]?.data?.length > 0) {
        console.log(`[GlobalCache] Using fresh cache for ${cacheKey} (${cache.items[parentId].data.length} items)`);
        return;
      }

      // For other entity types
      const entityCache = cache[entityType as keyof Omit<GlobalCache, 'items'>];
      if (entityCache?.data?.length > 0) {
        console.log(`[GlobalCache] Using fresh cache for ${entityType} (${entityCache.data.length} items)`);
        return;
      }
    }

    console.log(`[GlobalCache] Fetching ${cacheKey}${search ? ` with search: ${search}` : ''} (request ${requestId})`);

    // Mark as fetching with this request ID
    pendingFetches.current[cacheKey] = requestId;

    // Update loading state
    if (entityType === 'items' && parentId) {
      setCache(prev => {
        // Make sure items exists
        const items = prev.items || {};

        return {
          ...prev,
          items: {
            ...items,
            [parentId]: {
              ...(items[parentId] || { data: [], timestamp: 0, error: null }),
              isLoading: true
            }
          }
        };
      });
    } else {
      setCache(prev => {
        // Get the current entity cache or create a default one
        const entityKey = entityType as keyof Omit<GlobalCache, 'items'>;
        const currentEntityCache = prev[entityKey] || { data: [], timestamp: 0, isLoading: false, error: null };

        return {
          ...prev,
          [entityType]: {
            ...currentEntityCache,
            isLoading: true
          }
        };
      });
    }

    // Set a timeout to prevent infinite loading
    fetchTimeouts.current[cacheKey] = setTimeout(() => {
      console.warn(`[GlobalCache] Fetch timeout for ${cacheKey} (request ${requestId})`);

      // Only update state if this is still the active request
      if (pendingFetches.current[cacheKey] === requestId) {
        try {
          // Update error state
          if (entityType === 'items' && parentId) {
            setCache(prev => {
              // Make sure items exists
              const items = prev.items || {};

              return {
                ...prev,
                items: {
                  ...items,
                  [parentId]: {
                    ...(items[parentId] || { data: [], timestamp: 0 }),
                    isLoading: false,
                    error: 'Request timed out'
                  }
                }
              };
            });
          } else {
            setCache(prev => {
              // Get the current entity cache or create a default one
              const entityKey = entityType as keyof Omit<GlobalCache, 'items'>;
              const currentEntityCache = prev[entityKey] || { data: [], timestamp: 0, isLoading: false, error: null };

              return {
                ...prev,
                [entityType]: {
                  ...currentEntityCache,
                  isLoading: false,
                  error: 'Request timed out'
                }
              };
            });
          }
        } catch (error) {
          console.error(`[GlobalCache] Error updating timeout state for ${cacheKey}:`, error);
        }

        // Clear pending flag
        delete pendingFetches.current[cacheKey];
      } else {
        console.log(`[GlobalCache] Ignoring timeout for stale request ${requestId} (current: ${pendingFetches.current[cacheKey]})`);
      }
    }, 15000); // 15 second timeout

    try {
      // Fetch options from server
      const { options, error } = await fetchDropdownOptions({
        entityType,
        parentId,
        search
      });

      // Clear timeout
      clearTimeout(fetchTimeouts.current[cacheKey]);
      delete fetchTimeouts.current[cacheKey];

      if (error) {
        console.error(`[GlobalCache] Error fetching ${entityType}:`, error);

        // Update error state
        if (entityType === 'items' && parentId) {
          setCache(prev => {
            // Make sure items exists
            const items = prev.items || {};

            return {
              ...prev,
              items: {
                ...items,
                [parentId]: {
                  ...(items[parentId] || { data: [], timestamp: 0 }),
                  isLoading: false,
                  error
                }
              }
            };
          });
        } else {
          setCache(prev => {
            // Get the current entity cache or create a default one
            const entityKey = entityType as keyof Omit<GlobalCache, 'items'>;
            const currentEntityCache = prev[entityKey] || { data: [], timestamp: 0, isLoading: false, error: null };

            return {
              ...prev,
              [entityType]: {
                ...currentEntityCache,
                isLoading: false,
                error
              }
            };
          });
        }
      } else {
        // Update cache with new data
        if (entityType === 'items' && parentId) {
          setCache(prev => {
            // Make sure items exists
            const items = prev.items || {};

            return {
              ...prev,
              items: {
                ...items,
                [parentId]: {
                  data: options,
                  timestamp: Date.now(),
                  isLoading: false,
                  error: null
                }
              }
            };
          });
        } else {
          setCache(prev => {
            return {
              ...prev,
              [entityType]: {
                data: options,
                timestamp: Date.now(),
                isLoading: false,
                error: null
              }
            };
          });
        }
      }
    } catch (error) {
      console.error(`[GlobalCache] Unexpected error fetching ${entityType}:`, error);

      // Clear timeout
      clearTimeout(fetchTimeouts.current[cacheKey]);
      delete fetchTimeouts.current[cacheKey];

      // Update error state
      if (entityType === 'items' && parentId) {
        setCache(prev => {
          // Make sure items exists
          const items = prev.items || {};

          return {
            ...prev,
            items: {
              ...items,
              [parentId]: {
                ...(items[parentId] || { data: [], timestamp: 0 }),
                isLoading: false,
                error: 'Unexpected error occurred'
              }
            }
          };
        });
      } else {
        setCache(prev => {
          // Get the current entity cache or create a default one
          const entityKey = entityType as keyof Omit<GlobalCache, 'items'>;
          const currentEntityCache = prev[entityKey] || { data: [], timestamp: 0, isLoading: false, error: null };

          return {
            ...prev,
            [entityType]: {
              ...currentEntityCache,
              isLoading: false,
              error: 'Unexpected error occurred'
            }
          };
        });
      }
    } finally {
      // Clear pending flag
      delete pendingFetches.current[cacheKey];
    }
  }, []);

  // Get options from cache
  const getOptions = useCallback((entityType: EntityType, parentId?: string): SmartComboboxOption[] => {
    // For items, we need to check the parentId
    if (entityType === 'items' && parentId) {
      // Make sure cache.items exists
      if (!cache.items) {
        // Initialize items cache if it doesn't exist
        setCache(prev => ({
          ...prev,
          items: {}
        }));

        // Trigger a fetch but return empty array for now
        if (typeof window !== 'undefined') {
          requestAnimationFrame(() => {
            refreshOptions(entityType, parentId);
          });
        }
        return [];
      }

      const itemsCache = cache.items[parentId];

      // If not in cache or stale, trigger a fetch (but don't block)
      if (!itemsCache || isCacheStale(entityType, parentId)) {
        // Use requestAnimationFrame to avoid React state updates during render
        if (typeof window !== 'undefined') {
          requestAnimationFrame(() => {
            refreshOptions(entityType, parentId);
          });
        }
      }

      return itemsCache?.data || [];
    }

    // For other entity types
    const entityCache = cache[entityType as keyof Omit<GlobalCache, 'items'>];

    // If not in cache or stale, trigger a fetch (but don't block)
    // Check if entityCache exists and if data exists before checking length
    if (!entityCache || !entityCache.data || entityCache.data.length === 0 || isCacheStale(entityType)) {
      // Use requestAnimationFrame to avoid React state updates during render
      if (typeof window !== 'undefined') {
        requestAnimationFrame(() => {
          refreshOptions(entityType);
        });
      }
    }

    return entityCache?.data || [];
  }, [cache, isCacheStale, refreshOptions]);

  // Check if entity is loading
  const isLoading = useCallback((entityType: EntityType, parentId?: string): boolean => {
    if (entityType === 'items' && parentId) {
      // Make sure cache.items exists
      if (!cache.items) return false;
      return cache.items[parentId]?.isLoading || false;
    }

    // Make sure the entity cache exists
    const entityCache = cache[entityType as keyof Omit<GlobalCache, 'items'>];
    if (!entityCache) return false;

    return entityCache.isLoading || false;
  }, [cache]);

  // Check if entity has error
  const hasError = useCallback((entityType: EntityType, parentId?: string): boolean => {
    if (entityType === 'items' && parentId) {
      // Make sure cache.items exists
      if (!cache.items) return false;
      return !!cache.items[parentId]?.error;
    }

    // Make sure the entity cache exists
    const entityCache = cache[entityType as keyof Omit<GlobalCache, 'items'>];
    if (!entityCache) return false;

    return !!entityCache.error;
  }, [cache]);



  // Search options with debouncing to prevent excessive calls
  const searchOptions = useCallback(async (entityType: EntityType, search: string, parentId?: string): Promise<void> => {
    // Generate a unique cache key for this search
    const cacheKey = `${entityType}-${parentId || 'none'}-${search}`;

    // Initialize the lastSearches object if it doesn't exist
    if (!window.__lastSearches) window.__lastSearches = {};

    // Skip if we've searched this in the last second (debounce)
    const now = Date.now();
    const lastSearchTime = window.__lastSearches[cacheKey] || 0;
    const timeSinceLastSearch = now - lastSearchTime;

    if (timeSinceLastSearch < 1000) { // 1 second debounce
      console.log(`[GlobalCache] Skipping duplicate search for ${cacheKey} (${timeSinceLastSearch}ms ago)`);
      return;
    }

    // Track this search time
    window.__lastSearches[cacheKey] = now;

    // Use a try-catch to prevent unhandled promise rejections
    try {
      // Perform the search
      await refreshOptions(entityType, parentId, search);
    } catch (error) {
      console.error(`[GlobalCache] Error in searchOptions for ${entityType}:`, error);
      // Don't rethrow - we want to handle errors gracefully
    }
  }, [refreshOptions]);

  // Create a new option
  const createOption = useCallback(async (entityType: EntityType, name: string, parentId?: string): Promise<SmartComboboxOption | null> => {
    try {
      // Create option on server
      const { option, error } = await createDropdownOption({
        entityType,
        label: name,
        parentId
      });

      if (error) {
        console.error(`[GlobalCache] Error creating ${entityType}:`, error);
        toast({
          title: 'Error',
          description: `Failed to create ${entityType}: ${error}`,
          variant: 'destructive'
        });
        return null;
      }

      if (!option) {
        console.error(`[GlobalCache] No option returned when creating ${entityType}`);
        return null;
      }

      // Add to cache
      if (entityType === 'items' && parentId) {
        setCache(prev => {
          // Make sure items exists
          const items = prev.items || {};
          const itemCache = items[parentId] || { data: [], timestamp: 0, isLoading: false, error: null };

          return {
            ...prev,
            items: {
              ...items,
              [parentId]: {
                ...itemCache,
                data: [option, ...(itemCache.data || [])]
              }
            }
          };
        });
      } else {
        setCache(prev => {
          // Get the current entity cache or create a default one
          const entityKey = entityType as keyof Omit<GlobalCache, 'items'>;
          const currentEntityCache = prev[entityKey] || { data: [], timestamp: 0, isLoading: false, error: null };

          return {
            ...prev,
            [entityType]: {
              ...currentEntityCache,
              data: [option, ...(currentEntityCache.data || [])]
            }
          };
        });
      }

      return option;
    } catch (error) {
      console.error(`[GlobalCache] Unexpected error creating ${entityType}:`, error);
      toast({
        title: 'Error',
        description: `Failed to create ${entityType}`,
        variant: 'destructive'
      });
      return null;
    }
  }, []);

  // Invalidate cache for an entity
  const invalidateCache = useCallback((entityType: EntityType, parentId?: string): void => {
    if (entityType === 'items' && parentId) {
      setCache(prev => {
        const newCache = { ...prev };
        if (newCache.items[parentId]) {
          delete newCache.items[parentId];
        }
        return newCache;
      });
    } else {
      setCache(prev => ({
        ...prev,
        [entityType]: {
          ...prev[entityType as keyof Omit<GlobalCache, 'items'>],
          timestamp: 0 // Force refresh on next access
        }
      }));
    }
  }, []);

  // Prefetch all common data - simplified to avoid circular dependencies
  const prefetchAll = useCallback((): void => {
    console.log('[GlobalCache] Prefetching all common data...');

    // Fetch each entity type separately to avoid race conditions
    setTimeout(() => refreshOptions('clients'), 0);
    setTimeout(() => refreshOptions('categories'), 200);
    setTimeout(() => refreshOptions('sizes'), 400);
    setTimeout(() => refreshOptions('suppliers'), 600);

    // Mark as initialized
    setIsInitialized(true);
  }, [refreshOptions]);

  // Initialize cache on mount - simplified to avoid circular dependencies
  useEffect(() => {
    console.log('[GlobalCache] Initializing cache...');

    // Initialize the cache with empty data
    setCache({
      clients: { data: [], timestamp: 0, isLoading: false, error: null },
      categories: { data: [], timestamp: 0, isLoading: false, error: null },
      items: {}, // Empty record for items (keyed by parentId)
      sizes: { data: [], timestamp: 0, isLoading: false, error: null },
      suppliers: { data: [], timestamp: 0, isLoading: false, error: null },
    });

    // Mark as initialized
    setIsInitialized(true);

    // Prefetch common data with a delay to avoid render loops
    const initialFetchTimer = setTimeout(() => {
      console.log('[GlobalCache] Starting initial data fetch...');
      // Fetch each entity type separately to avoid race conditions
      refreshOptions('clients');
      refreshOptions('categories');
      refreshOptions('sizes');
      refreshOptions('suppliers');
    }, 1000); // Longer delay for initial load

    return () => {
      // Clean up timer
      clearTimeout(initialFetchTimer);

      // Clear all pending fetch timeouts
      Object.values(fetchTimeouts.current).forEach(timeout => {
        clearTimeout(timeout);
      });

      console.log('[GlobalCache] Cleanup complete');
    };
  }, []); // Empty dependency array - only run on mount

  // Context value
  const contextValue: GlobalDropdownCacheContextValue = {
    getOptions,
    isLoading,
    hasError,
    refreshOptions,
    createOption,
    searchOptions,
    invalidateCache,
    prefetchAll,
    isInitialized,
    cache // Expose the cache directly
  };

  return (
    <GlobalDropdownCacheContext.Provider value={contextValue}>
      {children}
    </GlobalDropdownCacheContext.Provider>
  );
}

// Hook to use the global dropdown cache
export function useGlobalDropdownCache() {
  const context = useContext(GlobalDropdownCacheContext);

  if (!context) {
    throw new Error('useGlobalDropdownCache must be used within a GlobalDropdownCacheProvider');
  }

  return context;
}
