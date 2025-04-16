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
  filterField?: string
  filterValue?: string
}

interface UseSmartDropdownReturn {
  options: SmartComboboxOption[]
  recentOptions: SmartComboboxOption[]
  isLoading: boolean
  error: string | null
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
    filterField,
    filterValue,
  } = typeof entityTypeOrProps === 'string'
    ? { entityType: entityTypeOrProps, ...optionsObj }
    : entityTypeOrProps;

  const [options, setOptions] = useState<SmartComboboxOption[]>(initialOptions)
  const [recentOptions, setRecentOptions] = useState<SmartComboboxOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

    setIsLoading(true)
    setError(null)

    // Set a timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      if (currentRequestIdRef.current === requestId) {
        setIsLoading(false)
        setError('Request timed out. Please try again.')
      }
    }, 10000) // 10 second timeout

    try {
      // Call the server action to fetch options
      const { options: newOptions, error: fetchError } = await fetchDropdownOptions({
        entityType,
        search,
        parentId,
        filterField,
        filterValue,
        limit
      })

      // Only update state if this is still the most recent request
      if (currentRequestIdRef.current === requestId) {
        if (fetchError) {
          setError(fetchError)
          // If there's an error and we have initialOptions, use those as a fallback
          if (initialOptions.length > 0) {
            setOptions(initialOptions)
          }
        } else {
          // If we got no results and this is the initial load, use any initialOptions provided
          if (newOptions.length === 0 && !search && initialOptions.length > 0) {
            setOptions(initialOptions)
          } else {
            setOptions(newOptions)
          }
        }
        setIsLoading(false)
      }
    } catch (error: any) {
      // Only update state if this is still the most recent request
      if (currentRequestIdRef.current === requestId) {
        setError(`Unexpected error: ${error.message}`)
        // If there's an error and we have initialOptions, use those as a fallback
        if (initialOptions.length > 0) {
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
      setError('Cannot create option with empty label')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      // Call the server action to create a new option
      const { option: newOption, error: createError } = await createDropdownOption({
        entityType,
        label: label.trim(),
        parentId
      })

      if (createError) {
        setError(createError)
        toast({
          title: 'Error',
          description: createError,
          variant: 'destructive',
        })
        return null
      }

      if (!newOption) {
        setError('No option returned after creation')
        return null
      }

      // Update options list - add to existing options, don't replace them
      setOptions(prev => {
        // Check if option already exists to avoid duplicates
        const exists = prev.some(opt => opt.value === newOption.value)
        if (exists) {
          return prev
        }
        return [newOption, ...prev]
      })

      // Add to recent options
      addToRecentOptions(newOption)

      // Refresh the options to ensure consistency
      setTimeout(() => {
        fetchOptions()
      }, 500)

      return newOption
    } catch (error: any) {
      setError(`Error creating option: ${error.message}`)
      toast({
        title: 'Error',
        description: `Failed to create new ${entityType.slice(0, -1)}. ${error.message}`,
        variant: 'destructive',
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [entityType, parentId, addToRecentOptions, fetchOptions])

  // Initial fetch
  useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  // Re-fetch when parentId changes for items
  useEffect(() => {
    if (entityType === 'items' && parentId) {
      fetchOptions()
    }
  }, [entityType, parentId, fetchOptions])

  // Handle search query changes
  useEffect(() => {
    if (searchQuery) {
      fetchOptions(searchQuery)
    }
  }, [searchQuery, fetchOptions])

  // Refresh options
  const refreshOptions = useCallback(async () => {
    await fetchOptions(searchQuery)
  }, [fetchOptions, searchQuery])

  return {
    options,
    recentOptions,
    isLoading,
    error,
    setSearchQuery,
    createOption,
    refreshOptions
  }
}
