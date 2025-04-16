# Smart Dropdown Optimization Plan

This document outlines our plan to optimize and standardize the smart dropdown components used throughout the orders page, focusing on performance, code duplication, and user experience.

## Current Issues

### Multiple Implementations

1. **Duplicate Hook Files**:
   - `app/hooks/useSmartDropdown.ts`
   - `app/hooks/useSmartDropdown.fixed.ts`
   - `app/hooks/useSmartDropdown.updated.ts`
   - `app/hooks/useSmartDropdownCached.ts`

2. **Inconsistent Data Fetching**:
   - Direct Supabase client calls in some versions
   - Server actions in other versions
   - Different caching strategies

3. **Redundant State Management**:
   - Each hook instance maintains its own state
   - No shared cache between instances

4. **Excessive Logging**:
   - Verbose console logging throughout the code
   - Debugging code left in production

### Performance Issues

1. **Multiple Network Requests**:
   - Each dropdown makes separate requests
   - No batching of similar requests

2. **Inefficient Caching**:
   - Custom timeout-based caching
   - No proper invalidation strategy

3. **Race Conditions**:
   - Complex request ID tracking to handle race conditions
   - Timeout fallbacks for hanging requests

### UX Issues

1. **Inconsistent Loading States**:
   - Different loading indicators
   - No skeleton loaders

2. **Poor Error Handling**:
   - Generic error messages
   - No retry mechanisms

3. **Accessibility Issues**:
   - Keyboard navigation issues
   - Missing ARIA attributes

## Optimization Plan

### 1. Consolidate Hook Implementations

- [ ] **Create a single, optimized hook**:

```typescript
// app/hooks/useSmartDropdown.ts (consolidated)
'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { SmartComboboxOption } from '@/components/ui/smart-combobox'
import { useDropdownCache } from '@/context/DropdownCacheContext'
import { fetchDropdownOptions, createDropdownOption } from '@/actions/options'

export type EntityType = 'clients' | 'categories' | 'items' | 'suppliers' | 'sizes'

interface UseSmartDropdownProps {
  entityType: EntityType
  parentId?: string
  initialOptions?: SmartComboboxOption[]
  limit?: number
}

export function useSmartDropdown({
  entityType,
  parentId,
  initialOptions = [],
  limit = 20,
}: UseSmartDropdownProps) {
  // Use the global dropdown cache
  const { 
    getOptions, 
    setOptions: updateCacheOptions,
    isLoading: isCacheLoading 
  } = useDropdownCache()
  
  // Local state
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  // Get options from cache
  const options = useMemo(() => {
    return getOptions(entityType, parentId) || initialOptions
  }, [getOptions, entityType, parentId, initialOptions])
  
  // Fetch options using the server action
  const fetchOptions = useCallback(async (search?: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { options, error } = await fetchDropdownOptions({
        entityType,
        search,
        parentId,
        limit
      })
      
      if (error) {
        setError(error)
        return
      }
      
      // Update the cache
      updateCacheOptions(entityType, options, parentId)
    } catch (err) {
      setError('Failed to fetch options')
      console.error(`Error fetching ${entityType}:`, err)
    } finally {
      setIsLoading(false)
    }
  }, [entityType, parentId, limit, updateCacheOptions])
  
  // Create a new option
  const createOption = useCallback(async (label: string) => {
    if (!label || label.trim() === '') {
      return null
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const { option, error } = await createDropdownOption({
        entityType,
        label: label.trim(),
        parentId
      })
      
      if (error) {
        setError(error)
        return null
      }
      
      if (option) {
        // Update the cache with the new option
        updateCacheOptions(entityType, [...options, option], parentId)
        return option
      }
      
      return null
    } catch (err) {
      setError('Failed to create option')
      console.error(`Error creating ${entityType}:`, err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [entityType, parentId, options, updateCacheOptions])
  
  // Initial fetch
  useEffect(() => {
    // Only fetch if we don't have options in the cache
    if (options.length === 0 && !isCacheLoading) {
      fetchOptions()
    }
  }, [options.length, isCacheLoading, fetchOptions])
  
  return {
    options,
    isLoading: isLoading || isCacheLoading,
    error,
    setSearchQuery: fetchOptions,
    createOption,
    refreshOptions: fetchOptions
  }
}
```

- [ ] **Delete duplicate files**:
  - `app/hooks/useSmartDropdown.fixed.ts`
  - `app/hooks/useSmartDropdown.updated.ts`
  - `app/hooks/useSmartDropdownCached.ts` (merge functionality into main hook)

### 2. Implement Global Cache Context

- [ ] **Create an optimized dropdown cache context**:

```typescript
// app/context/DropdownCacheContext.tsx
'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { SmartComboboxOption } from '@/components/ui/smart-combobox'
import { fetchDropdownOptions } from '@/actions/options'

type EntityType = 'clients' | 'categories' | 'items' | 'suppliers' | 'sizes'

interface DropdownCacheContextType {
  getOptions: (entityType: EntityType, parentId?: string) => SmartComboboxOption[]
  setOptions: (entityType: EntityType, options: SmartComboboxOption[], parentId?: string) => void
  isLoading: boolean
  prefetchCommonOptions: () => Promise<void>
  clearCache: () => void
}

const DropdownCacheContext = createContext<DropdownCacheContextType | undefined>(undefined)

export function DropdownCacheProvider({ children }: { children: React.ReactNode }) {
  const [cache, setCache] = useState<Record<string, SmartComboboxOption[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  
  // Generate a cache key for an entity type and optional parent ID
  const getCacheKey = useCallback((entityType: EntityType, parentId?: string) => {
    return parentId ? `${entityType}-${parentId}` : entityType
  }, [])
  
  // Get options from the cache
  const getOptions = useCallback((entityType: EntityType, parentId?: string) => {
    const key = getCacheKey(entityType, parentId)
    return cache[key] || []
  }, [cache, getCacheKey])
  
  // Set options in the cache
  const setOptions = useCallback((entityType: EntityType, options: SmartComboboxOption[], parentId?: string) => {
    const key = getCacheKey(entityType, parentId)
    setCache(prev => ({
      ...prev,
      [key]: options
    }))
  }, [getCacheKey])
  
  // Prefetch common options (clients, categories, sizes)
  const prefetchCommonOptions = useCallback(async () => {
    setIsLoading(true)
    
    try {
      // Fetch clients
      const { options: clients } = await fetchDropdownOptions({
        entityType: 'clients',
        limit: 100
      })
      
      // Fetch categories
      const { options: categories } = await fetchDropdownOptions({
        entityType: 'categories',
        limit: 100
      })
      
      // Fetch sizes
      const { options: sizes } = await fetchDropdownOptions({
        entityType: 'sizes',
        limit: 100
      })
      
      // Update the cache
      setCache(prev => ({
        ...prev,
        clients,
        categories,
        sizes
      }))
    } catch (error) {
      console.error('Error prefetching dropdown options:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  // Clear the cache
  const clearCache = useCallback(() => {
    setCache({})
  }, [])
  
  // Prefetch common options on mount
  useEffect(() => {
    prefetchCommonOptions()
  }, [prefetchCommonOptions])
  
  return (
    <DropdownCacheContext.Provider value={{
      getOptions,
      setOptions,
      isLoading,
      prefetchCommonOptions,
      clearCache
    }}>
      {children}
    </DropdownCacheContext.Provider>
  )
}

export function useDropdownCache() {
  const context = useContext(DropdownCacheContext)
  
  if (context === undefined) {
    throw new Error('useDropdownCache must be used within a DropdownCacheProvider')
  }
  
  return context
}
```

### 3. Optimize Server Actions

- [ ] **Improve the server actions for dropdown options**:

```typescript
// app/actions/options.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type DropdownOption = {
  value: string
  label: string
  [key: string]: any
}

export type EntityType = 'clients' | 'categories' | 'items' | 'suppliers' | 'sizes'

interface FetchOptionsParams {
  entityType: EntityType
  search?: string
  parentId?: string
  limit?: number
}

/**
 * Server action to fetch dropdown options from Supabase
 */
export async function fetchDropdownOptions({
  entityType,
  search,
  parentId,
  limit = 50
}: FetchOptionsParams): Promise<{ options: DropdownOption[], error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Determine which table to query based on entity type
    let table = ''
    let columns = 'id, name'
    let orderBy = 'name'
    
    switch (entityType) {
      case 'clients':
        table = 'clients'
        break
      case 'categories':
        table = 'categories'
        break
      case 'items':
        table = 'items'
        break
      case 'suppliers':
        table = 'suppliers'
        break
      case 'sizes':
        table = 'sizes'
        break
      default:
        return { 
          options: [], 
          error: `Unknown entity type: ${entityType}` 
        }
    }
    
    // Build the query
    let query = supabase
      .from(table)
      .select(columns)
      .order(orderBy, { ascending: true })
      .limit(limit)
    
    // Add search filter if provided
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }
    
    // Add parent filter for items
    if (entityType === 'items' && parentId) {
      query = query.eq('category_id', parentId)
    }
    
    // Execute the query
    const { data, error } = await query
    
    if (error) {
      return { 
        options: [], 
        error: `Error fetching ${entityType}: ${error.message}` 
      }
    }
    
    // Transform data to options format
    const options = data?.map(item => ({
      value: item.id.toString(),
      label: item.name,
      ...item
    })) || []
    
    return { options, error: null }
  } catch (error: any) {
    return { 
      options: [], 
      error: `Unexpected error fetching ${entityType}: ${error.message}` 
    }
  }
}

/**
 * Server action to create a new dropdown option
 */
export async function createDropdownOption({
  entityType,
  label,
  parentId
}: {
  entityType: EntityType
  label: string
  parentId?: string
}): Promise<{ option: DropdownOption | null, error: string | null }> {
  if (!label || label.trim() === '') {
    return { option: null, error: 'Cannot create option with empty label' }
  }
  
  try {
    const supabase = await createClient()
    
    // Determine which table to insert into
    let table = ''
    let additionalData = {}
    
    switch (entityType) {
      case 'clients':
        table = 'clients'
        break
      case 'categories':
        table = 'categories'
        break
      case 'items':
        table = 'items'
        // Add parent category ID if provided
        if (parentId) {
          additionalData = { category_id: parentId }
        }
        break
      case 'suppliers':
        table = 'suppliers'
        break
      case 'sizes':
        table = 'sizes'
        break
      default:
        return { 
          option: null, 
          error: `Unknown entity type: ${entityType}` 
        }
    }
    
    // Insert the new record
    const { data, error } = await supabase
      .from(table)
      .insert({
        name: label.trim(),
        ...additionalData
      })
      .select()
      .single()
    
    if (error) {
      return { 
        option: null, 
        error: `Error creating ${entityType}: ${error.message}` 
      }
    }
    
    // Transform to option format
    const option = {
      value: data.id.toString(),
      label: data.name,
      ...data
    }
    
    // Revalidate related paths
    revalidatePath('/dashboard/orders')
    
    return { option, error: null }
  } catch (error: any) {
    return { 
      option: null, 
      error: `Unexpected error creating ${entityType}: ${error.message}` 
    }
  }
}
```

### 4. Improve the SmartCombobox Component

- [ ] **Enhance the SmartCombobox component**:

```typescript
// app/components/ui/smart-combobox.tsx
'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Loader2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useToast } from '@/components/ui/use-toast'

export interface SmartComboboxOption {
  value: string
  label: string
  [key: string]: any
}

export interface SmartComboboxProps {
  options: SmartComboboxOption[]
  value?: string
  onChange: (value: string) => void
  onCreateOption?: (value: string) => Promise<SmartComboboxOption | null>
  placeholder?: string
  emptyMessage?: string
  createMessage?: string
  className?: string
  disabled?: boolean
  allowCreate?: boolean
  isLoading?: boolean
  searchDebounce?: number
  onSearch?: (value: string) => void
  recentOptions?: SmartComboboxOption[]
  entityName?: string
  error?: string
}

export function SmartCombobox({
  options,
  value = '',
  onChange,
  onCreateOption,
  placeholder = "Select an option",
  emptyMessage = "No options found. Create one?",
  createMessage = "Create",
  className,
  disabled = false,
  allowCreate = false,
  isLoading = false,
  searchDebounce = 300,
  onSearch,
  recentOptions = [],
  entityName = "option",
  error,
}: SmartComboboxProps) {
  // Ensure value is a string
  const safeValue = value || ''
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()
  
  // Get the selected option
  const selectedOption = React.useMemo(() => {
    return options.find(option => option.value === safeValue)
  }, [options, safeValue])
  
  // Filter options based on search value
  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options
    
    const lowerSearch = searchValue.toLowerCase()
    return options.filter(option => 
      option.label.toLowerCase().includes(lowerSearch)
    )
  }, [options, searchValue])
  
  // Handle search input change with debounce
  const handleSearch = React.useCallback((value: string) => {
    setSearchValue(value)
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Set a new timeout for the search
    if (onSearch) {
      searchTimeoutRef.current = setTimeout(() => {
        onSearch(value)
      }, searchDebounce)
    }
  }, [onSearch, searchDebounce])
  
  // Handle creating a new option
  const handleCreateOption = React.useCallback(async () => {
    if (!allowCreate || !onCreateOption || !searchValue.trim()) return
    
    try {
      setIsCreating(true)
      
      const newOption = await onCreateOption(searchValue)
      
      if (newOption) {
        onChange(newOption.value)
        setSearchValue('')
        setOpen(false)
        
        toast({
          title: `${entityName} created`,
          description: `${newOption.label} has been created successfully.`,
        })
      }
    } catch (error) {
      toast({
        title: `Failed to create ${entityName}`,
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }, [allowCreate, onCreateOption, searchValue, onChange, entityName, toast])
  
  // Handle opening and closing the dropdown
  const handleOpenChange = React.useCallback((isOpen: boolean) => {
    if (!disabled) {
      setOpen(isOpen)
      
      // When closing the dropdown, clear the search value
      if (!isOpen) {
        setSearchValue('')
      }
    }
  }, [disabled])
  
  return (
    <div className="relative">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between bg-background",
              error ? "border-red-500" : "border-input",
              disabled ? "opacity-70 cursor-not-allowed" : "",
              className
            )}
            onClick={(e) => {
              // Prevent opening the dropdown if disabled
              if (disabled) {
                e.preventDefault()
                e.stopPropagation()
              }
            }}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-muted-foreground">Loading...</span>
              </div>
            ) : selectedOption ? (
              selectedOption.label
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput 
              placeholder="Search..." 
              value={searchValue}
              onValueChange={handleSearch}
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>
                {emptyMessage}
                {allowCreate && searchValue && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 w-full"
                    onClick={handleCreateOption}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        {createMessage} "{searchValue}"
                      </>
                    )}
                  </Button>
                )}
              </CommandEmpty>
              
              {/* Recent options section */}
              {recentOptions.length > 0 && (
                <CommandGroup heading="Recently Used">
                  {recentOptions.map((option) => (
                    <CommandItem
                      key={`recent-${option.value}`}
                      value={option.value}
                      onSelect={() => {
                        onChange(option.value)
                        setOpen(false)
                      }}
                    >
                      {option.label}
                      {option.value === safeValue && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {/* All options section */}
              <CommandGroup heading={recentOptions.length > 0 ? "All Options" : undefined}>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      onChange(option.value)
                      setOpen(false)
                    }}
                  >
                    {option.label}
                    {option.value === safeValue && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
}
```

### 5. Create Specialized Hooks for Common Entity Types

- [ ] **Create specialized hooks for common entity types**:

```typescript
// app/hooks/useClients.ts
'use client'

import { useSmartDropdown } from './useSmartDropdown'
import { SmartComboboxOption } from '@/components/ui/smart-combobox'
import { useCallback } from 'react'

export function useClients() {
  const {
    options: clients,
    isLoading,
    error,
    setSearchQuery: searchClients,
    createOption: createClient,
    refreshOptions: refreshClients
  } = useSmartDropdown({
    entityType: 'clients',
    limit: 50
  })
  
  return {
    clients,
    isLoading,
    error,
    searchClients,
    createClient,
    refreshClients
  }
}

// app/hooks/useCategories.ts
'use client'

import { useSmartDropdown } from './useSmartDropdown'
import { SmartComboboxOption } from '@/components/ui/smart-combobox'
import { useCallback } from 'react'

export function useCategories() {
  const {
    options: categories,
    isLoading,
    error,
    setSearchQuery: searchCategories,
    createOption: createCategory,
    refreshOptions: refreshCategories
  } = useSmartDropdown({
    entityType: 'categories',
    limit: 50
  })
  
  return {
    categories,
    isLoading,
    error,
    searchCategories,
    createCategory,
    refreshCategories
  }
}

// app/hooks/useItems.ts
'use client'

import { useSmartDropdown } from './useSmartDropdown'
import { SmartComboboxOption } from '@/components/ui/smart-combobox'
import { useCallback } from 'react'

export function useItems(categoryId?: string) {
  const {
    options: items,
    isLoading,
    error,
    setSearchQuery: searchItems,
    createOption: createItem,
    refreshOptions: refreshItems
  } = useSmartDropdown({
    entityType: 'items',
    parentId: categoryId,
    limit: 50
  })
  
  return {
    items,
    isLoading,
    error,
    searchItems,
    createItem,
    refreshItems
  }
}
```

### 6. Create a Dropdown Loader Component

- [ ] **Create a component to handle loading states**:

```typescript
// app/components/ui/dropdown-loader.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useDropdownCache } from '@/context/DropdownCacheContext'

interface DropdownLoaderProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

function DefaultLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">
          Loading dropdown data...
        </p>
      </div>
    </div>
  )
}

export function DropdownLoader({
  children,
  fallback = <DefaultLoadingFallback />
}: DropdownLoaderProps) {
  const { isLoading } = useDropdownCache()
  const [isReady, setIsReady] = useState(false)
  
  // Wait for the dropdown cache to be ready
  useEffect(() => {
    if (!isLoading) {
      // Add a small delay to ensure the cache is fully populated
      const timer = setTimeout(() => {
        setIsReady(true)
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [isLoading])
  
  if (!isReady) {
    return fallback
  }
  
  return children
}
```

## Implementation Timeline

### Phase 1: Consolidation (Day 1-2)

- Create the DropdownCacheContext
- Consolidate the useSmartDropdown hook
- Delete duplicate files

### Phase 2: Component Improvements (Day 3-4)

- Enhance the SmartCombobox component
- Create specialized hooks for common entity types
- Create the DropdownLoader component

### Phase 3: Server Action Optimization (Day 5)

- Optimize the server actions for dropdown options
- Implement proper error handling
- Add revalidation

### Phase 4: Testing and Refinement (Day 6-7)

- Test all dropdown scenarios
- Fix any issues
- Optimize performance

## Expected Outcomes

1. **Reduced Code Duplication**: Single source of truth for dropdown functionality
2. **Improved Performance**: Shared cache and optimized data fetching
3. **Better UX**: Consistent loading states and error handling
4. **Maintainability**: Clear separation of concerns and proper documentation
