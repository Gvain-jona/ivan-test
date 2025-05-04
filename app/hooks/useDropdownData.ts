'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import { SmartComboboxOption } from '@/components/ui/smart-combobox';

// Define the entity types
export type EntityType = 'clients' | 'categories' | 'items' | 'sizes' | 'suppliers';

// Define the response type
interface DropdownResponse {
  options: SmartComboboxOption[];
  error?: string;
}

/**
 * Fetches dropdown options directly from Supabase with improved error handling and timeout
 */
async function fetchDropdownOptionsFromSupabase(
  entityType: EntityType,
  parentId?: string,
  search?: string
): Promise<DropdownResponse> {
  // Create an AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  try {
    console.log(`[DropdownData] Fetching ${entityType} options`, { parentId, search });

    // Create Supabase client
    const supabase = createClient();

    // Define the query based on entity type
    let query;

    switch (entityType) {
      case 'clients':
        query = supabase
          .from('clients')
          .select('id, name')
          .order('name');

        if (search) {
          query = query.ilike('name', `%${search}%`);
        }

        break;

      case 'categories':
        query = supabase
          .from('categories')
          .select('id, name')
          .order('name');

        if (search) {
          query = query.ilike('name', `%${search}%`);
        }

        break;

      case 'items':
        query = supabase
          .from('items')
          .select('id, name, category_id')
          .order('name');

        if (parentId) {
          query = query.eq('category_id', parentId);
        }

        if (search) {
          query = query.ilike('name', `%${search}%`);
        }

        break;

      case 'sizes':
        query = supabase
          .from('sizes')
          .select('id, name')
          .order('name');

        if (search) {
          query = query.ilike('name', `%${search}%`);
        }

        break;

      case 'suppliers':
        query = supabase
          .from('suppliers')
          .select('id, name')
          .order('name');

        if (search) {
          query = query.ilike('name', `%${search}%`);
        }

        break;

      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }

    // Execute the query with the abort signal
    const { data, error } = await query.abortSignal(controller.signal);

    // Clear the timeout since the request completed
    clearTimeout(timeoutId);

    if (error) {
      console.error(`Error fetching ${entityType}:`, error);
      return { options: [], error: error.message };
    }

    // Transform the data to SmartComboboxOption format
    const options: SmartComboboxOption[] = (data || []).map(item => ({
      label: item.name,
      value: item.id
    }));

    console.log(`[DropdownData] Successfully fetched ${options.length} ${entityType} options`);
    return { options };
  } catch (error) {
    // Clear the timeout
    clearTimeout(timeoutId);

    // Handle abort errors specially
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`Request timeout fetching ${entityType} options`);
      return {
        options: [],
        error: `Request timeout fetching ${entityType}`
      };
    }

    console.error(`Error in fetchDropdownOptionsFromSupabase for ${entityType}:`, error);
    return {
      options: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Creates a new dropdown option in Supabase
 */
async function createDropdownOptionInSupabase(
  entityType: EntityType,
  name: string,
  parentId?: string
): Promise<{ option?: SmartComboboxOption; error?: string }> {
  try {
    // Create Supabase client
    const supabase = createClient();

    // Define the insertion based on entity type
    let result;

    switch (entityType) {
      case 'clients':
        result = await supabase
          .from('clients')
          .insert({ name })
          .select()
          .single();
        break;

      case 'categories':
        result = await supabase
          .from('categories')
          .insert({ name })
          .select()
          .single();
        break;

      case 'items':
        if (!parentId) {
          return { error: 'Category ID is required for creating an item' };
        }

        result = await supabase
          .from('items')
          .insert({ name, category_id: parentId })
          .select()
          .single();
        break;

      case 'sizes':
        result = await supabase
          .from('sizes')
          .insert({ name })
          .select()
          .single();
        break;

      case 'suppliers':
        result = await supabase
          .from('suppliers')
          .insert({ name })
          .select()
          .single();
        break;

      default:
        return { error: `Unsupported entity type: ${entityType}` };
    }

    if (result.error) {
      console.error(`Error creating ${entityType}:`, result.error);
      return { error: result.error.message };
    }

    // Transform the result to SmartComboboxOption format
    const option: SmartComboboxOption = {
      label: result.data.name,
      value: result.data.id
    };

    return { option };
  } catch (error) {
    console.error(`Error in createDropdownOptionInSupabase for ${entityType}:`, error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate a stable cache key for SWR
 */
function generateCacheKey(
  entityType: EntityType,
  parentId?: string,
  search?: string
): string {
  return JSON.stringify({
    entityType,
    parentId,
    search
  });
}

/**
 * Hook for fetching and managing dropdown options
 * Uses SWR for caching and revalidation with improved error handling and lazy loading
 */
export function useDropdownData(
  entityType: EntityType,
  parentId?: string,
  initialSearch: string = ''
) {
  const [search, setSearch] = useState(initialSearch);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Generate a stable cache key
  const cacheKey = generateCacheKey(entityType, parentId, search);

  // Use SWR for data fetching with optimized settings
  const { data, error, isLoading, mutate } = useSWR<DropdownResponse>(
    // Only fetch data when needed (not on initial load)
    isInitialLoad ? null : cacheKey,
    () => fetchDropdownOptionsFromSupabase(entityType, parentId, search),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60 * 60 * 1000, // 60 minutes - increased to reduce API calls
      keepPreviousData: true,
      refreshInterval: 0, // Don't automatically refresh
      errorRetryCount: 2, // Reduced retry count to prevent excessive retries
      errorRetryInterval: 5000, // 5 seconds between retries - increased to reduce API calls
      suspense: false, // Don't use suspense
      revalidateIfStale: false, // Don't revalidate stale data automatically
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // Only retry up to 3 times
        if (retryCount >= 3) return;

        // Retry after 3 seconds
        setTimeout(() => revalidate({ retryCount }), 3000);
      }
    }
  );

  /**
   * Handle search input and trigger data loading
   */
  const handleSearch = useCallback((term: string) => {
    setSearch(term);

    // If this is the first search, mark that we're no longer in initial load
    if (isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [isInitialLoad]);

  /**
   * Create a new option
   */
  const createOption = useCallback(async (
    name: string
  ): Promise<SmartComboboxOption | null> => {
    try {
      // If we're still in initial load, mark that we're no longer in initial load
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }

      const { option, error } = await createDropdownOptionInSupabase(
        entityType,
        name,
        parentId
      );

      if (error || !option) {
        console.error(`Error creating ${entityType}:`, error);
        return null;
      }

      // Update the cache with the new option
      mutate(
        (currentData) => {
          if (!currentData) return { options: [option] };

          return {
            ...currentData,
            options: [option, ...currentData.options]
          };
        },
        { revalidate: false }
      );

      return option;
    } catch (error) {
      console.error(`Error in createOption for ${entityType}:`, error);
      return null;
    }
  }, [entityType, parentId, mutate, isInitialLoad]);

  /**
   * Refresh the options
   */
  const refreshOptions = useCallback(async () => {
    try {
      // If we're still in initial load, mark that we're no longer in initial load
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }

      await mutate();
      return true;
    } catch (error) {
      console.error(`Error refreshing ${entityType} options:`, error);
      return false;
    }
  }, [entityType, mutate, isInitialLoad]);

  // No longer prefetch options on mount - we'll load them on demand

  return {
    options: data?.options || [],
    isLoading: !isInitialLoad && isLoading, // Only show loading if we're actually fetching
    isError: !!error,
    handleSearch,
    createOption,
    refreshOptions,
    // Add a method to explicitly load data when needed (e.g., when dropdown is opened)
    loadOptions: () => {
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    }
  };
}
