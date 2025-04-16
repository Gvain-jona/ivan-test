import { useState, useEffect } from 'react';
import { create } from 'zustand';
import { fetchDropdownOptions, EntityType } from '../actions/options';
import { SmartComboboxOption } from '@/components/ui/smart-combobox';

// Define the cache store structure
interface DropdownCacheState {
  // Cache for each entity type
  clients: SmartComboboxOption[];
  categories: SmartComboboxOption[];
  items: Record<string, SmartComboboxOption[]>; // Keyed by parentId
  sizes: SmartComboboxOption[];
  
  // Loading states
  loading: Record<string, boolean>;
  
  // Last updated timestamps
  lastUpdated: Record<string, number>;
  
  // Methods
  getOptions: (entityType: EntityType, parentId?: string) => SmartComboboxOption[];
  isLoading: (entityType: EntityType, parentId?: string) => boolean;
  setOptions: (entityType: EntityType, options: SmartComboboxOption[], parentId?: string) => void;
  setLoading: (entityType: EntityType, loading: boolean, parentId?: string) => void;
  addOption: (entityType: EntityType, option: SmartComboboxOption, parentId?: string) => void;
  clearCache: () => void;
}

// Create the store
const useDropdownCacheStore = create<DropdownCacheState>((set, get) => ({
  // Initial state
  clients: [],
  categories: [],
  items: {},
  sizes: [],
  loading: {},
  lastUpdated: {},
  
  // Get options from cache
  getOptions: (entityType: EntityType, parentId?: string) => {
    const state = get();
    
    if (entityType === 'items' && parentId) {
      return state.items[parentId] || [];
    }
    
    return state[entityType] || [];
  },
  
  // Check if entity is loading
  isLoading: (entityType: EntityType, parentId?: string) => {
    const key = parentId ? `${entityType}-${parentId}` : entityType;
    return get().loading[key] || false;
  },
  
  // Set options in cache
  setOptions: (entityType: EntityType, options: SmartComboboxOption[], parentId?: string) => {
    const timestamp = Date.now();
    
    if (entityType === 'items' && parentId) {
      set(state => ({
        items: {
          ...state.items,
          [parentId]: options
        },
        lastUpdated: {
          ...state.lastUpdated,
          [`${entityType}-${parentId}`]: timestamp
        }
      }));
    } else {
      set(state => ({
        [entityType]: options,
        lastUpdated: {
          ...state.lastUpdated,
          [entityType]: timestamp
        }
      }));
    }
  },
  
  // Set loading state
  setLoading: (entityType: EntityType, loading: boolean, parentId?: string) => {
    const key = parentId ? `${entityType}-${parentId}` : entityType;
    set(state => ({
      loading: {
        ...state.loading,
        [key]: loading
      }
    }));
  },
  
  // Add a single option to the cache
  addOption: (entityType: EntityType, option: SmartComboboxOption, parentId?: string) => {
    if (entityType === 'items' && parentId) {
      set(state => {
        const currentOptions = state.items[parentId] || [];
        return {
          items: {
            ...state.items,
            [parentId]: [option, ...currentOptions]
          }
        };
      });
    } else {
      set(state => {
        const currentOptions = state[entityType] || [];
        return {
          [entityType]: [option, ...currentOptions]
        };
      });
    }
  },
  
  // Clear the entire cache
  clearCache: () => {
    set({
      clients: [],
      categories: [],
      items: {},
      sizes: [],
      loading: {},
      lastUpdated: {}
    });
  }
}));

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Hook to access and manage dropdown options with caching
 */
export function useDropdownCache(entityType: EntityType, parentId?: string) {
  const [
    getOptions,
    isLoading,
    setOptions,
    setLoading,
    addOption,
    lastUpdated
  ] = useDropdownCacheStore(state => [
    state.getOptions,
    state.isLoading,
    state.setOptions,
    state.setLoading,
    state.addOption,
    state.lastUpdated
  ]);
  
  const [initialized, setInitialized] = useState(false);
  
  // Get the cache key
  const cacheKey = parentId ? `${entityType}-${parentId}` : entityType;
  
  // Check if cache is stale
  const isCacheStale = () => {
    const lastUpdate = lastUpdated[cacheKey];
    return !lastUpdate || (Date.now() - lastUpdate > CACHE_TTL);
  };
  
  // Fetch options if not in cache or cache is stale
  useEffect(() => {
    const fetchOptions = async () => {
      // Skip if already loading
      if (isLoading(entityType, parentId)) return;
      
      // Get current options
      const currentOptions = getOptions(entityType, parentId);
      
      // If we have options and cache is not stale, don't fetch
      if (currentOptions.length > 0 && !isCacheStale()) {
        setInitialized(true);
        return;
      }
      
      // Set loading state
      setLoading(entityType, true, parentId);
      
      try {
        // Fetch options from server
        const { options, error } = await fetchDropdownOptions({
          entityType,
          parentId,
          search: ''
        });
        
        if (error) {
          console.error(`Error fetching ${entityType} options:`, error);
        } else {
          // Update cache
          setOptions(entityType, options, parentId);
        }
      } catch (error) {
        console.error(`Error fetching ${entityType} options:`, error);
      } finally {
        setLoading(entityType, false, parentId);
        setInitialized(true);
      }
    };
    
    fetchOptions();
  }, [entityType, parentId]);
  
  // Return the cached options and utility functions
  return {
    options: getOptions(entityType, parentId),
    isLoading: isLoading(entityType, parentId),
    addOption: (option: SmartComboboxOption) => addOption(entityType, option, parentId),
    initialized
  };
}

// Export the store for direct access if needed
export { useDropdownCacheStore };
