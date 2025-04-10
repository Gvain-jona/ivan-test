'use client';

import { useCallback, useRef } from 'react';
import { SmartComboboxOption } from '@/components/ui/smart-combobox';
import { useSmartDropdownCached } from './useSmartDropdownCached';

interface UseSmartSizesCachedReturn {
  sizes: SmartComboboxOption[];
  recentSizes: SmartComboboxOption[];
  isLoading: boolean;
  createSize: (label: string) => Promise<SmartComboboxOption | null>;
  refreshSizes: () => Promise<void>;
}

/**
 * A hook that provides cached size options for smart comboboxes
 */
export function useSmartSizesCached(): UseSmartSizesCachedReturn {
  // Use the cached smart dropdown hook for sizes
  const {
    options: sizes,
    recentOptions: recentSizes,
    isLoading,
    createOption: createSizeOption,
    refreshOptions: refreshSizes
  } = useSmartDropdownCached({
    entityType: 'sizes',
    cacheKey: 'sizes',
  });

  // Create a size
  const createSize = useCallback(async (label: string): Promise<SmartComboboxOption | null> => {
    return createSizeOption(label);
  }, [createSizeOption]);

  return {
    sizes,
    recentSizes,
    isLoading,
    createSize,
    refreshSizes
  };
}
