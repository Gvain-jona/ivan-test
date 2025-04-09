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
    // Don't fetch items if no parent category is selected
    if (entityType === 'items' && !parentId) {
      setOptions([])
      return
    }

    console.log(`Fetching ${entityType}...`, { search, entityType, parentId })
    setIsLoading(true)
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

      // Add parent filter if needed
      if (parentId && entityType === 'items') {
        query = query.eq('category_id', parentId)
      }

      // Add custom filter if provided
      if (filterField && filterValue) {
        query = query.eq(filterField, filterValue)
      }

      // Add search filter if provided
      if (search && search.trim() !== '') {
        query = query.ilike('name', `%${search}%`)
      }

      console.log(`Executing query for ${entityType}...`, { search })
      const { data, error } = await query

      console.log(`Query result for ${entityType}:`, { data, error, search })

      if (error) {
        // Check if the error is due to missing status column or table doesn't exist
        if (error.message.includes('column "status" does not exist') ||
            error.message.includes('relation') ||
            error.message.includes('does not exist')) {

          // For table doesn't exist error, just set empty options
          if (error.message.includes('relation') || error.message.includes('does not exist')) {
            console.warn(`Table ${entityType} might not exist. Please run the migration script.`);
            setOptions([]);
            return;
          }

          // Retry without status filter for missing status column
          let retryQuery = supabase
            .from(entityType)
            .select('*')
            .order('name')
            .limit(limit)

          if (parentId && entityType === 'items') {
            retryQuery = retryQuery.eq('category_id', parentId)
          }

          if (filterField && filterValue) {
            retryQuery = retryQuery.eq(filterField, filterValue)
          }

          if (search && search.trim() !== '') {
            retryQuery = retryQuery.ilike('name', `%${search}%`)
          }

          const retryResult = await retryQuery

          if (retryResult.error) {
            // If retry also fails, just set empty options
            console.warn(`Retry failed for ${entityType}:`, retryResult.error);
            setOptions([]);
            return;
          }

          const transformedOptions = (retryResult.data || []).map(item => {
            // Ensure value is a string
            const value = item.id ? String(item.id) : ''
            const label = item.name ? String(item.name) : ''

            return {
              value,
              label,
              ...item // Include all original data
            }
          })

          setOptions(transformedOptions)
          return
        } else {
          throw error
        }
      }

      // Transform data to combobox options
      const transformedOptions = (data || []).map(item => {
        // Debug each item
        console.log(`Raw item from ${entityType}:`, item)

        // Ensure value is a string
        const value = item.id ? String(item.id) : ''
        const label = item.name ? String(item.name) : ''

        return {
          value,
          label,
          ...item // Include all original data
        }
      })

      console.log(`Transformed options for ${entityType}:`, transformedOptions)
      setOptions(transformedOptions)
    } catch (error: any) {
      console.error(`Error fetching ${entityType}:`, error)
      toast({
        title: 'Error',
        description: `Failed to load ${entityType}. ${error?.message || ''}`,
        variant: 'destructive',
      })
      // Set empty options to prevent infinite loading state
      setOptions([])
    } finally {
      setIsLoading(false)
    }
  }, [supabase, entityType, parentId, limit, filterField, filterValue])

  // Create a new option
  const createOption = useCallback(async (label: string): Promise<SmartComboboxOption | null> => {
    try {
      // Prepare the data to insert
      const newData: Record<string, any> = {
        name: label,
      }

      // Add parent ID if needed
      if (parentId && entityType === 'items') {
        newData.category_id = parentId
      }

      // Try to add status field, but handle if it doesn't exist
      if (['categories', 'items', 'clients'].includes(entityType)) {
        newData.status = 'active'
      }

      // Insert the new record
      let insertResult = await supabase
        .from(entityType)
        .insert(newData)
        .select()
        .single()

      // Handle various error cases
      if (insertResult.error) {
        // If error is due to missing status column, retry without it
        if (insertResult.error.message.includes('column "status" does not exist')) {
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

      // Create the option object
      // Ensure value is a string
      const value = insertResult.data.id ? String(insertResult.data.id) : ''
      const label = insertResult.data.name ? String(insertResult.data.name) : ''

      const newOption: SmartComboboxOption = {
        value,
        label,
        ...insertResult.data
      }

      console.log('Created new option:', newOption)

      // Update options list - add to existing options, don't replace them
      setOptions(prev => {
        // Check if option already exists to avoid duplicates
        const exists = prev.some(opt => opt.value === value)
        if (exists) {
          return prev
        }
        return [newOption, ...prev]
      })

      // Add to recent options
      addToRecentOptions(newOption)

      return newOption
    } catch (error: any) {
      console.error(`Error creating ${entityType}:`, error)
      toast({
        title: 'Error',
        description: `Failed to create new ${entityType.slice(0, -1)}. ${error?.message || ''}`,
        variant: 'destructive',
      })
      return null
    }
  }, [supabase, entityType, parentId, addToRecentOptions])

  // Initial fetch
  useEffect(() => {
    // For items, only fetch if a parent category is selected
    if (entityType !== 'items' || parentId) {
      fetchOptions()
    }
  }, [fetchOptions, entityType, parentId])

  // Handle search query changes
  useEffect(() => {
    if (searchQuery !== undefined) {
      console.log(`Search query changed for ${entityType}:`, searchQuery)
      fetchOptions(searchQuery)
    }
  }, [searchQuery, fetchOptions])

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

  return {
    options,
    recentOptions,
    isLoading,
    searchQuery,
    setSearchQuery,
    createOption,
    refreshOptions,
  }
}
