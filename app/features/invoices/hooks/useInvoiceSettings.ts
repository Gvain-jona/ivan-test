'use client';

import { useState, useEffect } from 'react';
import { InvoiceSettings } from '../types';
import { defaultInvoiceSettings } from '../context/InvoiceContext';
import { getDefaultInvoiceSettings, saveInvoiceSettings } from '../api/settings';
import useSWR from 'swr';

/**
 * Hook for managing invoice settings
 * Uses SWR for caching and revalidation
 */
export function useInvoiceSettings() {
  // Use SWR to fetch and cache settings
  const { data, error, isLoading, mutate } = useSWR(
    'invoice-settings',
    async () => {
      try {
        return await getDefaultInvoiceSettings();
      } catch (error) {
        console.error('Error fetching invoice settings:', error);
        return defaultInvoiceSettings;
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  // Save settings to the database
  const saveSettings = async (settings: InvoiceSettings, name: string = 'Default Settings', isDefault: boolean = true) => {
    try {
      const result = await saveInvoiceSettings(settings, name, isDefault);
      mutate(settings, false); // Update the cache without revalidating
      return result;
    } catch (error) {
      console.error('Error saving invoice settings:', error);
      throw error; // Re-throw to allow proper error handling
    }
  };

  return {
    settings: data || defaultInvoiceSettings,
    isLoading,
    error,
    saveSettings,
  };
}

/**
 * Hook for managing invoice settings with local state
 * This is useful for components that need to modify settings without saving immediately
 */
export function useLocalInvoiceSettings(initialSettings?: Partial<InvoiceSettings>) {
  // Fetch settings from the database
  const { settings: dbSettings, isLoading, error, saveSettings } = useInvoiceSettings();

  // Local state for settings
  const [settings, setSettings] = useState<InvoiceSettings>({
    ...defaultInvoiceSettings,
    ...initialSettings,
  });

  // Update local state when database settings change
  useEffect(() => {
    if (!isLoading && dbSettings) {
      setSettings(prev => ({
        ...prev,
        ...dbSettings,
      }));
    }
  }, [dbSettings, isLoading]);

  // Update a specific setting
  const updateSetting = (name: keyof InvoiceSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Save local settings to the database
  const saveLocalSettings = async (name: string = 'Default Settings', isDefault: boolean = true) => {
    return await saveSettings(settings, name, isDefault);
  };

  return {
    settings,
    isLoading,
    error,
    updateSetting,
    saveSettings: saveLocalSettings,
  };
}
