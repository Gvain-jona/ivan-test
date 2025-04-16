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
 * Fetches dropdown options directly from Supabase
 */
async function fetchDropdownOptionsFromSupabase(
  entityType: EntityType,
  parentId?: string,
  search?: string
): Promise<DropdownResponse> {
  try {
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

    // Execute the query
    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching ${entityType}:`, error);
      return { options: [], error: error.message };
    }

    // Transform the data to SmartComboboxOption format
    const options: SmartComboboxOption[] = (data || []).map(item => ({
      label: item.name,
      value: item.id
    }));

    return { options };
  } catch (error) {
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
 * Uses SWR for caching and revalidation
 */
export function useDropdownData(
  entityType: EntityType,
  parentId?: string,
  initialSearch: string = ''
) {
  const [search, setSearch] = useState(initialSearch);

  // Generate a stable cache key
  const cacheKey = generateCacheKey(entityType, parentId, search);

  // Use SWR for data fetching with optimized settings
  const { data, error, isLoading, mutate } = useSWR<DropdownResponse>(
    cacheKey,
    () => fetchDropdownOptionsFromSupabase(entityType, parentId, search),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
      keepPreviousData: true,
      refreshInterval: 300000, // Only refresh every 5 minutes
      errorRetryCount: 2, // Limit retries
      suspense: false, // Don't use suspense
      revalidateIfStale: false // Don't revalidate stale data automatically
    }
  );

  /**
   * Handle search input
   */
  const handleSearch = useCallback((term: string) => {
    setSearch(term);
  }, []);

  /**
   * Create a new option
   */
  const createOption = useCallback(async (
    name: string
  ): Promise<SmartComboboxOption | null> => {
    try {
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
  }, [entityType, parentId, mutate]);

  /**
   * Refresh the options
   */
  const refreshOptions = useCallback(async () => {
    try {
      await mutate();
      return true;
    } catch (error) {
      console.error(`Error refreshing ${entityType} options:`, error);
      return false;
    }
  }, [entityType, mutate]);

  // Prefetch options on mount
  useEffect(() => {
    if (!search) {
      refreshOptions();
    }
  }, [entityType, parentId, refreshOptions]);

  return {
    options: data?.options || [],
    isLoading,
    isError: !!error,
    handleSearch,
    createOption,
    refreshOptions
  };
}
