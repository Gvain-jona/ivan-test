'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SmartComboboxOption } from '@/components/ui/smart-combobox'
import { toast } from '@/components/ui/use-toast'
import { useSmartDropdown } from './useSmartDropdown'

// Key for storing recent sizes in localStorage
const RECENT_SIZES_KEY = 'recent-sizes'

interface UseSmartSizesReturn {
  sizes: SmartComboboxOption[]
  recentSizes: SmartComboboxOption[]
  isLoading: boolean
  createSize: (label: string) => Promise<SmartComboboxOption | null>
  refreshSizes: () => Promise<void>
}

export function useSmartSizes(): UseSmartSizesReturn {
  // Use the generic smart dropdown hook for sizes
  const {
    options: sizes,
    recentOptions: recentSizes,
    isLoading,
    createOption: createSizeOption,
    refreshOptions: refreshSizes
  } = useSmartDropdown({
    entityType: 'sizes',
    cacheKey: 'sizes',
    initialOptions: [], // Explicitly set initialOptions to empty array to prevent hardcoded values
  })

  // Create a new size
  const createSize = useCallback(async (label: string): Promise<SmartComboboxOption | null> => {
    try {
      // Use the createOption function from useSmartDropdown
      const newSize = await createSizeOption(label)
      return newSize
    } catch (error) {
      console.error('Error creating size:', error)
      toast({
        title: 'Error',
        description: 'Failed to create size. Please try again.',
        variant: 'destructive',
      })
      return null
    }
  }, [createSizeOption])

  return {
    sizes,
    recentSizes,
    isLoading,
    createSize,
    refreshSizes
  }
}
