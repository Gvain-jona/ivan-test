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

// Cache TTL in milliseconds (increased for better performance)
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Prefetch TTL in milliseconds (increased for better performance)
const PREFETCH_INTERVAL = 15 * 60 * 1000; // 15 minutes

// Debug mode flag
const DEBUG = process.env.NODE_ENV !== 'production';

// Log only in debug mode
const debugLog = (...args: any[]) => {
  if (DEBUG) {
    console.log('[GlobalCache]', ...args);
  }
};

// Initial cache state
const initialCacheState: GlobalCache = {
  clients: { data: [], timestamp: 0, isLoading: false, error: null },
  categories: { data: [], timestamp: 0, isLoading: false, error: null },
  items: {}, // Empty record for items (keyed by parentId)
  sizes: { data: [], timestamp: 0, isLoading: false, error: null },
  suppliers: { data: [], timestamp: 0, isLoading: false, error: null },
};

// Cache keys for localStorage persistence
const CACHE_STORAGE_KEYS = {
  CLIENTS: 'dropdown_cache_clients',
  CATEGORIES: 'dropdown_cache_categories',
  SIZES: 'dropdown_cache_sizes',
  SUPPLIERS: 'dropdown_cache_suppliers',
  // Items are stored with dynamic keys based on parentId
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

    // Set a timeout to prevent infinite loading - reduced to 3 seconds for better UX
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

              // For timeouts, use any existing data we might have, even if stale
              const existingData = items[parentId]?.data || [];

              return {
                ...prev,
                items: {
                  ...items,
                  [parentId]: {
                    data: existingData,
                    timestamp: existingData.length > 0 ? Date.now() : 0,
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

              // For timeouts, use any existing data we might have, even if stale
              const existingData = currentEntityCache.data || [];

              return {
                ...prev,
                [entityType]: {
                  ...currentEntityCache,
                  data: existingData,
                  timestamp: existingData.length > 0 ? Date.now() : 0,
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
    }, 3000); // 3 second timeout for better user experience

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

  // Prefetch all common data - now optional and only called explicitly
  const prefetchAll = useCallback((entityTypes?: EntityType[]): void => {
    console.log('[GlobalCache] Prefetching selected data on demand...');

    // Mark as initialized immediately to prevent loading state delays
    setIsInitialized(true);

    // If specific entity types are provided, only fetch those
    if (entityTypes && entityTypes.length > 0) {
      console.log(`[GlobalCache] Prefetching specific entity types: ${entityTypes.join(', ')}`);
      entityTypes.forEach((entityType, index) => {
        // Stagger requests to prevent overwhelming the server
        setTimeout(() => {
          refreshOptions(entityType);
        }, index * 100);
      });
      return;
    }

    // Otherwise, don't fetch anything by default
    console.log('[GlobalCache] No entity types specified for prefetching');
  }, [refreshOptions]);

  // Initialize cache on mount with localStorage persistence
  useEffect(() => {
    debugLog('Initializing cache...');

    try {
      // Load cached data from localStorage
      const loadedCache: GlobalCache = {
        clients: { data: [], timestamp: 0, isLoading: false, error: null },
        categories: { data: [], timestamp: 0, isLoading: false, error: null },
        items: {}, // Empty record for items (keyed by parentId)
        sizes: { data: [], timestamp: 0, isLoading: false, error: null },
        suppliers: { data: [], timestamp: 0, isLoading: false, error: null },
      };

      // Load each entity type from localStorage
      if (typeof window !== 'undefined') {
        // Load clients
        const clientsData = localStorage.getItem(CACHE_STORAGE_KEYS.CLIENTS);
        if (clientsData) {
          try {
            const parsed = JSON.parse(clientsData);
            if (parsed && parsed.data && Array.isArray(parsed.data) && parsed.timestamp) {
              // Check if cache is still valid
              if (Date.now() - parsed.timestamp < CACHE_TTL) {
                loadedCache.clients = {
                  data: parsed.data,
                  timestamp: parsed.timestamp,
                  isLoading: false,
                  error: null
                };
                debugLog(`Loaded ${parsed.data.length} clients from localStorage cache`);
              } else {
                debugLog('Clients cache expired, will fetch fresh data');
              }
            }
          } catch (e) {
            console.warn('Error parsing clients cache:', e);
          }
        }

        // Load categories
        const categoriesData = localStorage.getItem(CACHE_STORAGE_KEYS.CATEGORIES);
        if (categoriesData) {
          try {
            const parsed = JSON.parse(categoriesData);
            if (parsed && parsed.data && Array.isArray(parsed.data) && parsed.timestamp) {
              // Check if cache is still valid
              if (Date.now() - parsed.timestamp < CACHE_TTL) {
                loadedCache.categories = {
                  data: parsed.data,
                  timestamp: parsed.timestamp,
                  isLoading: false,
                  error: null
                };
                debugLog(`Loaded ${parsed.data.length} categories from localStorage cache`);
              } else {
                debugLog('Categories cache expired, will fetch fresh data');
              }
            }
          } catch (e) {
            console.warn('Error parsing categories cache:', e);
          }
        }

        // Load sizes
        const sizesData = localStorage.getItem(CACHE_STORAGE_KEYS.SIZES);
        if (sizesData) {
          try {
            const parsed = JSON.parse(sizesData);
            if (parsed && parsed.data && Array.isArray(parsed.data) && parsed.timestamp) {
              // Check if cache is still valid
              if (Date.now() - parsed.timestamp < CACHE_TTL) {
                loadedCache.sizes = {
                  data: parsed.data,
                  timestamp: parsed.timestamp,
                  isLoading: false,
                  error: null
                };
                debugLog(`Loaded ${parsed.data.length} sizes from localStorage cache`);
              } else {
                debugLog('Sizes cache expired, will fetch fresh data');
              }
            }
          } catch (e) {
            console.warn('Error parsing sizes cache:', e);
          }
        }

        // Load suppliers
        const suppliersData = localStorage.getItem(CACHE_STORAGE_KEYS.SUPPLIERS);
        if (suppliersData) {
          try {
            const parsed = JSON.parse(suppliersData);
            if (parsed && parsed.data && Array.isArray(parsed.data) && parsed.timestamp) {
              // Check if cache is still valid
              if (Date.now() - parsed.timestamp < CACHE_TTL) {
                loadedCache.suppliers = {
                  data: parsed.data,
                  timestamp: parsed.timestamp,
                  isLoading: false,
                  error: null
                };
                debugLog(`Loaded ${parsed.data.length} suppliers from localStorage cache`);
              } else {
                debugLog('Suppliers cache expired, will fetch fresh data');
              }
            }
          } catch (e) {
            console.warn('Error parsing suppliers cache:', e);
          }
        }

        // Load items (look for any keys that start with 'dropdown_cache_items_')
        const itemsPrefix = 'dropdown_cache_items_';
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(itemsPrefix)) {
            try {
              const parentId = key.replace(itemsPrefix, '');
              const itemsData = localStorage.getItem(key);
              if (itemsData) {
                const parsed = JSON.parse(itemsData);
                if (parsed && parsed.data && Array.isArray(parsed.data) && parsed.timestamp) {
                  // Check if cache is still valid
                  if (Date.now() - parsed.timestamp < CACHE_TTL) {
                    loadedCache.items[parentId] = {
                      data: parsed.data,
                      timestamp: parsed.timestamp,
                      isLoading: false,
                      error: null
                    };
                    debugLog(`Loaded ${parsed.data.length} items for category ${parentId} from localStorage cache`);
                  }
                }
              }
            } catch (e) {
              console.warn(`Error parsing items cache for key ${key}:`, e);
            }
          }
        }
      }

      // Update cache with loaded data
      setCache(loadedCache);
    } catch (error) {
      console.error('Error loading cache from localStorage:', error);
      // Initialize with empty cache on error
      setCache(initialCacheState);
    }

    // Mark as initialized immediately to prevent loading state delays
    setIsInitialized(true);
    debugLog('Cache initialized - using localStorage persistence');

    // Listen for prefetch event from auth context but don't automatically fetch
    const handlePrefetchEvent = () => {
      debugLog('Received prefetch event, but not automatically fetching data');
      // No longer automatically fetch data here
      // Data will be fetched on-demand when components need it
    };

    // Add event listener for prefetch event
    if (typeof window !== 'undefined') {
      window.addEventListener('prefetch-app-data', handlePrefetchEvent);
    }

    return () => {
      // Remove event listener
      if (typeof window !== 'undefined') {
        window.removeEventListener('prefetch-app-data', handlePrefetchEvent);
      }

      // Clear all pending fetch timeouts
      Object.values(fetchTimeouts.current).forEach(timeout => {
        clearTimeout(timeout);
      });

      debugLog('Cleanup complete');
    };
  }, []); // Empty dependency array - only run on mount

  // Save cache to localStorage
  const saveToLocalStorage = useCallback((entityType: EntityType, data: CacheEntry, parentId?: string) => {
    if (typeof window === 'undefined') return;

    try {
      // Skip saving if there's no data or if it's loading
      if (!data || data.isLoading || !data.data || data.data.length === 0) return;

      // For items, we need to use the parentId
      if (entityType === 'items' && parentId) {
        const key = `dropdown_cache_items_${parentId}`;
        localStorage.setItem(key, JSON.stringify({
          data: data.data,
          timestamp: data.timestamp
        }));
        debugLog(`Saved ${data.data.length} items for category ${parentId} to localStorage`);
        return;
      }

      // For other entity types
      let storageKey: string;
      switch (entityType) {
        case 'clients':
          storageKey = CACHE_STORAGE_KEYS.CLIENTS;
          break;
        case 'categories':
          storageKey = CACHE_STORAGE_KEYS.CATEGORIES;
          break;
        case 'sizes':
          storageKey = CACHE_STORAGE_KEYS.SIZES;
          break;
        case 'suppliers':
          storageKey = CACHE_STORAGE_KEYS.SUPPLIERS;
          break;
        default:
          return; // Unknown entity type
      }

      localStorage.setItem(storageKey, JSON.stringify({
        data: data.data,
        timestamp: data.timestamp
      }));
      debugLog(`Saved ${data.data.length} ${entityType} to localStorage`);
    } catch (error) {
      console.error(`Error saving ${entityType} cache to localStorage:`, error);
    }
  }, []);

  // Watch for cache changes and save to localStorage
  useEffect(() => {
    // Save clients
    if (cache.clients && cache.clients.data && cache.clients.data.length > 0 && !cache.clients.isLoading) {
      saveToLocalStorage('clients', cache.clients);
    }

    // Save categories
    if (cache.categories && cache.categories.data && cache.categories.data.length > 0 && !cache.categories.isLoading) {
      saveToLocalStorage('categories', cache.categories);
    }

    // Save sizes
    if (cache.sizes && cache.sizes.data && cache.sizes.data.length > 0 && !cache.sizes.isLoading) {
      saveToLocalStorage('sizes', cache.sizes);
    }

    // Save suppliers
    if (cache.suppliers && cache.suppliers.data && cache.suppliers.data.length > 0 && !cache.suppliers.isLoading) {
      saveToLocalStorage('suppliers', cache.suppliers);
    }

    // Save items
    if (cache.items) {
      Object.entries(cache.items).forEach(([parentId, itemCache]) => {
        if (itemCache && itemCache.data && itemCache.data.length > 0 && !itemCache.isLoading) {
          saveToLocalStorage('items', itemCache, parentId);
        }
      });
    }
  }, [cache, saveToLocalStorage]);

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
