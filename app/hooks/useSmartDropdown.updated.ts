'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { SmartComboboxOption } from '@/components/ui/smart-combobox'
import { toast } from '@/components/ui/use-toast'
import { fetchDropdownOptions, createDropdownOption, EntityType } from '@/actions/options'

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

  // Fetch options using the server action
  const fetchOptions = useCallback(async (search?: string) => {
    // Use a local variable to track if this request is the most recent one
    // This helps prevent race conditions with multiple concurrent requests
    const requestId = Date.now()
    currentRequestIdRef.current = requestId

    console.log(`[Client] Fetching ${entityType}...`, { search, entityType, parentId, requestId })
    setIsLoading(true)

    // Set a timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      console.warn(`[Client] Fetch timeout for ${entityType}`, { requestId })
      setIsLoading(false)
    }, 10000) // 10 second timeout

    try {
      // Call the server action to fetch options
      const { options: newOptions, error } = await fetchDropdownOptions({
        entityType,
        search,
        parentId,
        filterField,
        filterValue,
        limit
      })

      if (error) {
        console.error(`[Client] Error fetching ${entityType}:`, error, { requestId })
        throw new Error(error)
      }

      console.log(`[Client] Fetched ${newOptions.length} ${entityType}`, { requestId })

      // Only update state if this is still the most recent request
      if (requestId === currentRequestIdRef.current) {
        // If we got no results and this is the initial load, use any initialOptions provided
        if (newOptions.length === 0 && !search && initialOptions.length > 0) {
          console.log(`[Client] No ${entityType} found in database, using initialOptions`, { requestId })
          setOptions(initialOptions)
        } else {
          setOptions(newOptions)
        }
        setIsLoading(false)
      } else {
        console.log(`[Client] Ignoring stale response for ${entityType}`, { requestId, currentRequestId: currentRequestIdRef.current })
      }
    } catch (error: any) {
      console.error(`[Client] Error fetching ${entityType}:`, error, { requestId })

      // Only update state if this is still the most recent request
      if (requestId === currentRequestIdRef.current) {
        // If there's an error and we have initialOptions, use those as a fallback
        if (initialOptions.length > 0) {
          console.log(`[Client] Error fetching ${entityType}, using initialOptions as fallback`, { requestId })
          setOptions(initialOptions)
        }
        setIsLoading(false)
      }
    } finally {
      clearTimeout(timeoutId) // Clear the timeout
    }
  }, [entityType, parentId, limit, filterField, filterValue, initialOptions])

  // Create a new option using the server action
  const createOption = useCallback(async (label: string): Promise<SmartComboboxOption | null> => {
    if (!label || label.trim() === '') {
      console.error('Cannot create option with empty label')
      return null
    }

    // Use a local variable to track this specific request
    const requestId = Date.now()
    console.log(`[Client] Creating new ${entityType} with label: ${label}`, { requestId })

    try {
      // Call the server action to create a new option
      const { option: newOption, error } = await createDropdownOption({
        entityType,
        label: label.trim(),
        parentId
      })

      if (error) {
        console.error(`[Client] Error creating ${entityType}:`, error, { requestId })
        toast({
          title: 'Error',
          description: error,
          variant: 'destructive',
        })
        return null
      }

      if (!newOption) {
        console.error(`[Client] No option returned after creating ${entityType}`, { requestId })
        return null
      }

      console.log('[Client] Created new option:', newOption, { requestId })

      // Update options list - add to existing options, don't replace them
      setOptions(prev => {
        // Check if option already exists to avoid duplicates
        const exists = prev.some(opt => opt.value === newOption.value)
        if (exists) {
          console.log(`[Client] Option already exists in state, not adding duplicate:`, newOption, { requestId })
          return prev
        }
        console.log(`[Client] Adding new option to state:`, newOption, { requestId })
        return [newOption, ...prev]
      })

      // Add to recent options
      addToRecentOptions(newOption)

      // Refresh the options to ensure consistency
      setTimeout(() => {
        console.log(`[Client] Refreshing options after creating new ${entityType}`, { requestId })
        fetchOptions()
      }, 500)

      return newOption
    } catch (error: any) {
      console.error(`[Client] Error creating ${entityType}:`, error, { requestId })

      toast({
        title: 'Error',
        description: `Failed to create new ${entityType.slice(0, -1)}. ${error.message}`,
        variant: 'destructive',
      })

      return null
    }
  }, [entityType, parentId, addToRecentOptions, fetchOptions])

  // Initial fetch
  useEffect(() => {
    // Always fetch options, even for items without a parent category
    console.log(`[Client] Initial fetch for ${entityType}...`, { instanceId })
    fetchOptions()
  }, [fetchOptions, entityType, instanceId])

  // We still want to re-fetch when parentId changes
  useEffect(() => {
    if (entityType === 'items' && parentId) {
      // If parentId changes to a valid value, refresh the options
      fetchOptions()
    }
  }, [entityType, parentId, fetchOptions])

  // Handle search query changes
  useEffect(() => {
    if (searchQuery !== undefined) {
      console.log(`[Client] Search query changed for ${entityType}:`, searchQuery)
      fetchOptions(searchQuery)
    }
  }, [searchQuery, fetchOptions, entityType])

  // Add a cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      console.log(`[Client] Cleaning up useSmartDropdown for ${entityType}`)
    }
  }, [entityType])

  // Refresh options
  const refreshOptions = useCallback(async () => {
    await fetchOptions(searchQuery)
  }, [fetchOptions, searchQuery])

  // Handle search query with instance isolation
  const handleSearchQuery = useCallback((query: string) => {
    console.log(`[Client] Setting search query for ${entityType}:`, { query, instanceId })
    setSearchQuery(query)
  }, [entityType, instanceId])

  return {
    options,
    recentOptions,
    isLoading,
    searchQuery,
    setSearchQuery: handleSearchQuery,
    createOption,
    refreshOptions
  }
}
