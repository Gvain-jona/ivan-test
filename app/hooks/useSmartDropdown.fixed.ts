'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SmartComboboxOption } from '@/components/ui/smart-combobox'
import { toast } from '@/components/ui/use-toast'

type EntityType = 'clients' | 'categories' | 'items' | 'suppliers' | 'sizes'

interface UseSmartDropdownProps {
  entityType: EntityType
  parentId?: string // For related entities (e.g., items need category_id)
  initialOptions?: SmartComboboxOption[]
  limit?: number
  cacheKey?: string
  filterField?: string
  filterValue?: string
}

interface UseSmartDropdownReturn {
  options: SmartComboboxOption[]
  recentOptions: SmartComboboxOption[]
  isLoading: boolean
  searchQuery: string
  setSearchQuery: (query: string) => void
  createOption: (label: string) => Promise<SmartComboboxOption | null>
  refreshOptions: () => Promise<void>
}

// Helper to get localStorage key for recent options
const getRecentOptionsKey = (entityType: EntityType, parentId?: string) => {
  return `recent-${entityType}${parentId ? `-${parentId}` : ''}`
}

// Helper function to transform data to options
const transformDataToOptions = (data: any[], requestId?: number) => {
  return data.map(item => {
    // Ensure value is a string
    const value = item.id ? String(item.id) : ''
    const label = item.name ? String(item.name) : ''

    return {
      value,
      label,
      ...item // Include all original data
    }
  })
}

export function useSmartDropdown({
  entityType,
  parentId,
  initialOptions = [],
  limit = 20,
  cacheKey,
  filterField,
  filterValue,
}: UseSmartDropdownProps): UseSmartDropdownReturn {
  const [options, setOptions] = useState<SmartComboboxOption[]>(initialOptions)
  const [recentOptions, setRecentOptions] = useState<SmartComboboxOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Create a ref to track the current request ID at the component level
  const currentRequestIdRef = useRef<number>(0)

  // Create a unique instance ID for this hook instance to isolate state
  const instanceId = useMemo(() => `${entityType}-${Math.random().toString(36).substring(2, 9)}`, [entityType])

  // Create a new supabase client for each instance to prevent state sharing
  const supabase = useMemo(() => createClient(), [])

  // Load recent options from localStorage
  useEffect(() => {
    try {
      const key = getRecentOptionsKey(entityType, parentId)
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed = JSON.parse(stored)
        setRecentOptions(parsed.slice(0, 5)) // Only show top 5 recent options
      }
    } catch (error) {
      console.error('Error loading recent options:', error)
    }
  }, [entityType, parentId])

  // Add an option to recent options
  const addToRecentOptions = useCallback((option: SmartComboboxOption) => {
    try {
      const key = getRecentOptionsKey(entityType, parentId)

      // Get existing recent options
      const stored = localStorage.getItem(key)
      let recent: SmartComboboxOption[] = []

      if (stored) {
        recent = JSON.parse(stored)
      }

      // Remove if already exists
      recent = recent.filter(item => item.value !== option.value)

      // Add to beginning
      recent.unshift(option)

      // Limit to 10 items
      if (recent.length > 10) {
        recent = recent.slice(0, 10)
      }

      // Save back to localStorage
      localStorage.setItem(key, JSON.stringify(recent))

      // Update state
      setRecentOptions(recent.slice(0, 5))
    } catch (error) {
      console.error('Error saving recent options:', error)
    }
  }, [entityType, parentId])

  // Fetch options from the database
  const fetchOptions = useCallback(async (search?: string) => {
    // Each entity type is independent - no constraints between them
    
    // Use a local variable to track if this request is the most recent one
    // This helps prevent race conditions with multiple concurrent requests
    const requestId = Date.now()
    currentRequestIdRef.current = requestId

    console.log(`Fetching ${entityType}...`, { search, entityType, parentId, requestId })
    setIsLoading(true)

    // Set a timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      console.warn(`Fetch timeout for ${entityType}`, { requestId })
      setIsLoading(false)
    }, 10000) // 10 second timeout

    try {
      console.log(`Fetching ${entityType} with search: ${search || 'none'}`, { requestId });

      // Determine which table to query based on entity type
      let table = '';
      let columns = 'id, name';
      let orderBy = 'name';
      let whereClause = '';

      switch (entityType) {
        case 'clients':
          table = 'clients';
          break;
        case 'categories':
          table = 'categories';
          break;
        case 'items':
          table = 'items';
          // Only filter by category_id if a parentId is provided
          if (parentId) {
            whereClause = `category_id.eq.${parentId}`;
          }
          break;
        case 'suppliers':
          table = 'suppliers';
          break;
        case 'sizes':
          table = 'sizes';
          break;
        default:
          console.error(`Unknown entity type: ${entityType}`);
          return;
      }

      // Build the query
      let query = supabase
        .from(table)
        .select(columns)
        .order(orderBy, { ascending: true })
        .limit(limit);

      // Add search filter if provided
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      // Add where clause if provided
      if (whereClause) {
        // Use eq instead of or for proper filtering
        const [field, value] = whereClause.split('.eq.');
        query = query.eq(field, value);
      }

      // Add filter if provided
      if (filterField && filterValue) {
        query = query.eq(filterField, filterValue);
      }

      // Execute the query
      const { data, error } = await query;

      if (error) {
        console.error(`Error fetching ${entityType}:`, error, { requestId });
        throw error;
      }

      // Transform data to options format
      const newOptions = transformDataToOptions(data || [], requestId);
      console.log(`Fetched ${newOptions.length} ${entityType}`, { requestId });

      // Only update state if this is still the most recent request
      if (requestId === currentRequestIdRef.current) {
        // If we got no results and this is the initial load, use any initialOptions provided
        if (newOptions.length === 0 && !search && initialOptions.length > 0) {
          console.log(`No ${entityType} found in database, using initialOptions`, { requestId });
          setOptions(initialOptions);
        } else {
          setOptions(newOptions);
        }
        setIsLoading(false);
      } else {
        console.log(`Ignoring stale response for ${entityType}`, { requestId, currentRequestId: currentRequestIdRef.current });
      }
    } catch (error) {
      console.error(`Error fetching ${entityType}:`, error, { requestId });

      // Only update state if this is still the most recent request
      if (requestId === currentRequestIdRef.current) {
        // If there's an error and we have initialOptions, use those as a fallback
        if (initialOptions.length > 0) {
          console.log(`Error fetching ${entityType}, using initialOptions as fallback`, { requestId });
          setOptions(initialOptions);
        }
        setIsLoading(false);
      }
    } finally {
      clearTimeout(timeoutId); // Clear the timeout
    }
  }, [supabase, entityType, parentId, limit, filterField, filterValue, instanceId, initialOptions])

  // Create a new option
  const createOption = useCallback(async (label: string): Promise<SmartComboboxOption | null> => {
    if (!label || label.trim() === '') {
      console.error('Cannot create option with empty label');
      return null;
    }

    // Use a local variable to track this specific request
    const requestId = Date.now();
    console.log(`Creating new ${entityType} with label: ${label}`, { requestId });

    try {
      // Determine which table to insert into
      let table = '';
      let data: any = { name: label.trim() };

      switch (entityType) {
        case 'clients':
          table = 'clients';
          break;
        case 'categories':
          table = 'categories';
          break;
        case 'items':
          table = 'items';
          // For items, we can optionally include a category_id if provided
          if (parentId) {
            data.category_id = parentId;
          }
          break;
        case 'suppliers':
          table = 'suppliers';
          break;
        case 'sizes':
          table = 'sizes';
          break;
        default:
          throw new Error(`Unknown entity type: ${entityType}`);
      }

      // Insert the new record
      let insertResult = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      // Handle various error cases
      if (insertResult.error) {
        console.log(`Error inserting ${entityType}:`, insertResult.error, { requestId });

        // If error is due to missing status column, retry without it
        if (insertResult.error.message.includes('column "status" does not exist')) {
          console.log(`Retrying without status field for ${entityType}`, { requestId });
          delete data.status;
          insertResult = await supabase
            .from(table)
            .insert(data)
            .select()
            .single();
        }
        // If table doesn't exist, show error and return null
        else if (insertResult.error.message.includes('relation') ||
                 insertResult.error.message.includes('does not exist')) {
          toast({
            title: 'Error',
            description: `The ${entityType} table does not exist. Please run the migration script.`,
            variant: 'destructive',
          });
          return null;
        }
        // If still error, throw it
        if (insertResult.error) {
          throw insertResult.error;
        }
      }

      // Create a new option from the inserted data
      const newOption: SmartComboboxOption = {
        value: insertResult.data.id.toString(),
        label: insertResult.data.name,
      };

      console.log('Created new option:', newOption, { requestId })

      // Update options list - add to existing options, don't replace them
      setOptions(prev => {
        // Check if option already exists to avoid duplicates
        const exists = prev.some(opt => opt.value === newOption.value)
        if (exists) {
          console.log(`Option already exists in state, not adding duplicate:`, newOption, { requestId })
          return prev
        }
        console.log(`Adding new option to state:`, newOption, { requestId })
        return [newOption, ...prev]
      })

      // Add to recent options
      addToRecentOptions(newOption)

      // Refresh the options to ensure consistency
      setTimeout(() => {
        console.log(`Refreshing options after creating new ${entityType}`, { requestId })
        fetchOptions()
      }, 500)

      return newOption
    } catch (error: any) {
      console.error(`Error creating ${entityType}:`, error, { requestId })

      // Provide more specific error messages based on the error type
      let errorMessage = `Failed to create new ${entityType.slice(0, -1)}.`

      if (error?.message) {
        if (error.message.includes('duplicate key')) {
          errorMessage = `A ${entityType.slice(0, -1)} with this name already exists.`
        } else if (error.message.includes('violates foreign key constraint')) {
          errorMessage = `Invalid reference to another record. Please check your selection.`
        } else if (error.message.includes('permission denied')) {
          errorMessage = `You don't have permission to create a new ${entityType.slice(0, -1)}.`
        } else {
          errorMessage += ` ${error.message}`
        }
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })

      return null
    }
  }, [supabase, entityType, parentId, addToRecentOptions, fetchOptions])

  // Initial fetch
  useEffect(() => {
    // Always fetch options, even for items without a parent category
    // The fetchOptions function will handle the special case for items without a parent
    console.log(`Initial fetch for ${entityType}...`, { instanceId })
    fetchOptions()

    // Clear any initialOptions to ensure we're only using database values
    if (initialOptions.length > 0) {
      console.log(`Clearing initialOptions for ${entityType}...`, { instanceId })
    }
  }, [fetchOptions, entityType, instanceId, initialOptions.length])

  // We still want to re-fetch when parentId changes, but we don't need special handling
  useEffect(() => {
    if (entityType === 'items' && parentId) {
      // If parentId changes to a valid value, we might want to refresh the options
      // This is optional now, but can help show relevant items first
      fetchOptions()
    }
  }, [entityType, parentId, fetchOptions])

  // Handle search query changes
  useEffect(() => {
    if (searchQuery !== undefined) {
      console.log(`Search query changed for ${entityType}:`, searchQuery)
      fetchOptions(searchQuery)
    }
  }, [searchQuery, fetchOptions, entityType])

  // Add a cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      console.log(`Cleaning up useSmartDropdown for ${entityType}`)
    }
  }, [entityType])

  // Refresh options
  const refreshOptions = useCallback(async () => {
    await fetchOptions(searchQuery)
  }, [fetchOptions, searchQuery])

  // Handle search query with instance isolation
  const handleSearchQuery = useCallback((query: string) => {
    console.log(`Setting search query for ${entityType}:`, { query, instanceId })
    setSearchQuery(query)
  }, [entityType, instanceId])

  return {
    options,
    recentOptions,
    isLoading,
    searchQuery,
    setSearchQuery: handleSearchQuery, // Use our isolated search function
    createOption,
    refreshOptions
  }
}
