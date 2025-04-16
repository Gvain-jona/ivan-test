'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { SmartComboboxOption } from '@/components/ui/smart-combobox'
import { toast } from '@/components/ui/use-toast'
import { fetchDropdownOptions, createDropdownOption, EntityType } from '../actions/options'

interface UseSmartDropdownProps {
  entityType: EntityType
  parentId?: string // For related entities (e.g., items need category_id)
  initialOptions?: SmartComboboxOption[]
  limit?: number
  skipLoading?: boolean // Skip initial loading - useful for components that are not visible
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

// Overload for string entityType
export function useSmartDropdown(
  entityType: EntityType,
  options?: Partial<Omit<UseSmartDropdownProps, 'entityType'>>
): UseSmartDropdownReturn;

// Overload for object props
export function useSmartDropdown(props: UseSmartDropdownProps): UseSmartDropdownReturn;

// Implementation that handles both overloads
export function useSmartDropdown(
  entityTypeOrProps: EntityType | UseSmartDropdownProps,
  optionsObj?: Partial<Omit<UseSmartDropdownProps, 'entityType'>>
): UseSmartDropdownReturn {
  // Normalize arguments to extract props
  const {
    entityType,
    parentId,
    initialOptions = [],
    limit = 20,
    skipLoading = false,
  } = typeof entityTypeOrProps === 'string'
    ? { entityType: entityTypeOrProps, ...optionsObj }
    : entityTypeOrProps;

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
    // Always fetch items regardless of parent category
    // No need to skip empty searches for items without a parent category

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
      // Call the server action to fetch options with only the necessary parameters
      const { options: newOptions, error } = await fetchDropdownOptions({
        entityType,
        search: search || '',
        parentId,
        limit
      })

      // Only update state if this is still the most recent request
      if (currentRequestIdRef.current === requestId) {
        if (error) {
          console.error(`[Client] Error fetching ${entityType}:`, error, { requestId })
          toast({
            title: 'Error',
            description: error,
            variant: 'destructive',
          })
          setOptions(initialOptions)
        } else {
          console.log(`[Client] Fetched ${newOptions.length} ${entityType}`, { requestId })

          // Convert server options to SmartComboboxOption format if needed
          const formattedOptions: SmartComboboxOption[] = newOptions.map(option => ({
            value: option.value,
            label: option.label,
          }))

          setOptions(formattedOptions)
        }
        setIsLoading(false)
      }
    } catch (error: any) {
      // Only update state if this is still the most recent request
      if (currentRequestIdRef.current === requestId) {
        console.error(`[Client] Error fetching ${entityType}:`, error, { requestId })
        toast({
          title: 'Error',
          description: `Failed to fetch ${entityType}. ${error.message}`,
          variant: 'destructive',
        })
        setOptions(initialOptions)
        setIsLoading(false)
      }
    } finally {
      clearTimeout(timeoutId) // Clear the timeout
    }
  }, [entityType, parentId, limit, initialOptions])

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

      // Convert to SmartComboboxOption format if needed
      const formattedOption: SmartComboboxOption = {
        value: newOption.value,
        label: newOption.label,
      }

      // Update options list - add to existing options, don't replace them
      setOptions(prev => {
        // Check if option already exists to avoid duplicates
        const exists = prev.some(opt => opt.value === formattedOption.value)
        if (exists) {
          console.log(`[Client] Option already exists in state, not adding duplicate:`, formattedOption, { requestId })
          return prev
        }
        console.log(`[Client] Adding new option to state:`, formattedOption, { requestId })
        return [formattedOption, ...prev]
      })

      // Add to recent options
      addToRecentOptions(formattedOption)

      // Refresh the options to ensure consistency
      setTimeout(() => {
        console.log(`[Client] Refreshing options after creating new ${entityType}`, { requestId })
        fetchOptions()
      }, 500)

      return formattedOption
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

  // Initial fetch - only if we don't have initialOptions and skipLoading is false
  useEffect(() => {
    // Skip loading if skipLoading is true
    if (skipLoading) {
      console.log(`[Client] Skipping initial fetch for ${entityType} (skipLoading=true)`, { instanceId })
      return;
    }

    // Only fetch if we don't have initialOptions or if it's a required fetch
    if (initialOptions.length === 0 || entityType === 'clients' || entityType === 'categories') {
      console.log(`[Client] Initial fetch for ${entityType}...`, { instanceId })
      fetchOptions('')
    } else {
      console.log(`[Client] Using initialOptions for ${entityType}...`, { count: initialOptions.length })
    }
  }, [fetchOptions, entityType, instanceId, initialOptions.length, skipLoading])

  // No need to re-fetch when parentId changes for items
  // All dropdowns are independent

  // Handle search query changes, but respect skipLoading
  useEffect(() => {
    if (skipLoading) {
      return; // Skip search if skipLoading is true
    }

    if (searchQuery !== undefined) {
      console.log(`[Client] Search query changed for ${entityType}:`, searchQuery)
      fetchOptions(searchQuery)
    }
  }, [searchQuery, fetchOptions, entityType, skipLoading])

  // Add a cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      console.log(`[Client] Cleaning up useSmartDropdown for ${entityType}`)
    }
  }, [entityType])

  // Refresh options, but respect skipLoading
  const refreshOptions = useCallback(async () => {
    if (skipLoading) {
      console.log(`[Client] Skipping refresh for ${entityType} (skipLoading=true)`)
      return;
    }
    await fetchOptions(searchQuery)
  }, [fetchOptions, searchQuery, skipLoading, entityType])

  // Handle search query with instance isolation, but respect skipLoading
  const handleSearchQuery = useCallback((query: string) => {
    if (skipLoading) {
      console.log(`[Client] Skipping search for ${entityType} (skipLoading=true)`)
      return;
    }
    console.log(`[Client] Setting search query for ${entityType}:`, { query, instanceId })
    setSearchQuery(query)
  }, [entityType, instanceId, skipLoading])

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
