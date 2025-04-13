'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
    // Always fetch items, even without a parent category
    // This removes the constraint between categories and items

    // Use a local variable to track if this request is the most recent one
    // This helps prevent race conditions with multiple concurrent requests
    const requestId = Date.now()
    const currentRequestId = requestId

    console.log(`Fetching ${entityType}...`, { search, entityType, parentId, requestId })
    setIsLoading(true)

    // Set a timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      console.log(`Request timeout for ${entityType} (${requestId})...`)
      setIsLoading(false)
    }, 10000) // 10 second timeout

    try {
      let query = supabase
        .from(entityType)
        .select('*')
        .order('name')
        .limit(limit)

      // Add status filter if the table has a status column
      if (['clients', 'categories', 'items', 'sizes'].includes(entityType)) {
        query = query.eq('status', 'active')
      }

      // We're no longer filtering items by category_id
      // This allows users to select any item regardless of category

      // Add custom filter if provided
      if (filterField && filterValue) {
        query = query.eq(filterField, filterValue)
      }

      // Add search filter if provided
      if (search && search.trim() !== '') {
        const trimmedSearch = search.trim()

        // Always use contains for more comprehensive results
        query = query.ilike('name', `%${trimmedSearch}%`)
      }

      console.log(`Executing query for ${entityType}...`, { search, requestId })
      const { data, error } = await query

      // Clear the timeout since we got a response
      clearTimeout(timeoutId)

      // Check if this request is still relevant (not superseded by a newer request)
      if (requestId !== currentRequestId) {
        console.log(`Ignoring stale response for ${entityType} (${requestId})...`)
        return
      }

      console.log(`Query result for ${entityType}:`, { data, error, search, requestId })

      if (error) {
        // Check if the error is due to missing status column or table doesn't exist
        if (error.message.includes('column "status" does not exist') ||
            error.message.includes('relation') ||
            error.message.includes('does not exist')) {

          // For table doesn't exist error, just set empty options
          if (error.message.includes('relation') || error.message.includes('does not exist')) {
            console.warn(`Table ${entityType} might not exist. Please run the migration script.`);
            setOptions([]);
            setIsLoading(false); // Ensure loading state is reset
            clearTimeout(timeoutId); // Clear the timeout
            return;
          }

          // Retry without status filter for missing status column
          let retryQuery = supabase
            .from(entityType)
            .select('*')
            .order('name')
            .limit(limit)

          // We're no longer filtering items by category_id in the retry query either

          if (filterField && filterValue) {
            retryQuery = retryQuery.eq(filterField, filterValue)
          }

          if (search && search.trim() !== '') {
            const trimmedSearch = search.trim()

            // Always use contains for more comprehensive results
            retryQuery = retryQuery.ilike('name', `%${trimmedSearch}%`)
          }

          console.log(`Retrying query for ${entityType} without status filter...`, { requestId })
          const retryResult = await retryQuery

          if (retryResult.error) {
            // If retry also fails, just set empty options
            console.warn(`Retry failed for ${entityType}:`, retryResult.error);
            setOptions([]);
            setIsLoading(false); // Ensure loading state is reset
            clearTimeout(timeoutId); // Clear the timeout
            return;
          }

          // Check if this request is still relevant (not superseded by a newer request)
          if (requestId !== currentRequestId) {
            console.log(`Ignoring stale retry response for ${entityType} (${requestId})...`)
            clearTimeout(timeoutId); // Clear the timeout
            return;
          }

          const transformedOptions = transformDataToOptions(retryResult.data || [], requestId);

          // Always use the database results, even if empty
          console.log(`Setting options for ${entityType} (retry):`, { count: transformedOptions.length, requestId, instanceId })
          setOptions(transformedOptions);

          setIsLoading(false); // Ensure loading state is reset
          clearTimeout(timeoutId); // Clear the timeout
          return;
        } else {
          throw error
        }
      }

      // Transform data to combobox options using the helper function
      const transformedOptions = transformDataToOptions(data || [], requestId);
      console.log(`Transformed options for ${entityType}:`, { count: transformedOptions.length, requestId, instanceId })

      // Always use the database results, even if empty
      console.log(`Setting options for ${entityType}:`, { count: transformedOptions.length, requestId, instanceId })
      setOptions(transformedOptions);

      setIsLoading(false); // Ensure loading state is reset
    } catch (error: any) {
      console.error(`Error fetching ${entityType}:`, error)
      toast({
        title: 'Error',
        description: `Failed to load ${entityType}. ${error?.message || ''}`,
        variant: 'destructive',
      })
      // Set empty options to prevent infinite loading state
      console.log(`Error fetching ${entityType}, setting empty options`, { instanceId })
      setOptions([])
      // Ensure loading state is reset
      setIsLoading(false)
      // Clear the timeout
      clearTimeout(timeoutId)
    }
  }, [supabase, entityType, parentId, limit, filterField, filterValue, instanceId])

  // Create a new option
  const createOption = useCallback(async (label: string): Promise<SmartComboboxOption | null> => {
    // Generate a unique request ID for this creation operation
    const requestId = Date.now()
    console.log(`Creating new ${entityType} with label: ${label}`, { requestId })

    // We're no longer requiring a parent category for items
    // Users can create items without selecting a category first

    try {
      // Trim the label to remove any leading/trailing whitespace
      const trimmedLabel = label.trim()

      // Validate the label
      if (!trimmedLabel) {
        toast({
          title: 'Error',
          description: `${entityType.slice(0, -1)} name cannot be empty.`,
          variant: 'destructive',
        })
        return null
      }

      // Check if an option with this label already exists
      const existingOption = options.find(opt =>
        opt.label.toLowerCase() === trimmedLabel.toLowerCase()
      )

      if (existingOption) {
        console.log(`Option with label "${trimmedLabel}" already exists:`, existingOption)
        // Add to recent options
        addToRecentOptions(existingOption)
        return existingOption
      }

      // Prepare the data to insert
      const newData: Record<string, any> = {
        name: trimmedLabel,
      }

      // We still add the parent ID if it's provided, but it's now optional
      if (parentId && entityType === 'items') {
        newData.category_id = parentId
      }

      // Try to add status field, but handle if it doesn't exist
      if (['categories', 'items', 'clients', 'sizes'].includes(entityType)) {
        newData.status = 'active'
      }

      console.log(`Inserting new ${entityType}:`, newData, { requestId })

      // Insert the new record
      let insertResult = await supabase
        .from(entityType)
        .insert(newData)
        .select()
        .single()

      // Handle various error cases
      if (insertResult.error) {
        console.log(`Error inserting ${entityType}:`, insertResult.error, { requestId })

        // If error is due to missing status column, retry without it
        if (insertResult.error.message.includes('column "status" does not exist')) {
          console.log(`Retrying without status field for ${entityType}`, { requestId })
          delete newData.status
          insertResult = await supabase
            .from(entityType)
            .insert(newData)
            .select()
            .single()
        }
        // If table doesn't exist, show error and return null
        else if (insertResult.error.message.includes('relation') ||
                 insertResult.error.message.includes('does not exist')) {
          toast({
            title: 'Error',
            description: `Table ${entityType} does not exist. Please run the migration script.`,
            variant: 'destructive',
          })
          return null
        }
      }

      if (insertResult.error) {
        throw insertResult.error
      }

      console.log(`Successfully created new ${entityType}:`, insertResult.data, { requestId })

      // Create the option object using our helper function
      const newOption = transformDataToOptions([insertResult.data], requestId)[0]

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
  }, [supabase, entityType, parentId, addToRecentOptions, options, fetchOptions])

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
    refreshOptions,
    instanceId, // Expose the instance ID for debugging
  }
}
