'use client';

import { useState } from 'react';
import { InvoiceSettings } from '../types';
import { emptyInvoiceSettings } from '../context/InvoiceContext';
import useSWR from 'swr';
import { useToast } from '@/components/ui/use-toast';

/**
 * Hook for managing invoice settings with better error handling
 * Uses SWR for caching and revalidation
 */
export function useInvoiceSettings() {
  const { toast } = useToast();
  
  // Use SWR to fetch and cache settings - no fallbacks
  const { data, error, isLoading, mutate } = useSWR(
    'invoice-settings-v2',
    async () => {
      const response = await fetch('/api/invoice-settings/v2?default=true');
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoice settings');
      }
      
      const result = await response.json();
      
      // Only return actual data from database
      if (result.data && !result.fallback) {
        // If result.data has a settings property, it's a full record
        if ('settings' in result.data && result.data.settings) {
          return result.data.settings;
        }
        // Otherwise, it might be the settings directly
        return result.data;
      }
      
      // Return null if no settings found - no fallbacks
      return null;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
      onError: (error) => {
        console.error('Invoice settings fetch error:', error);
        toast({
          title: 'Settings Unavailable',
          description: 'Unable to load saved settings. Please check your connection or create new settings.',
          variant: 'destructive',
        });
      }
    }
  );
  
  // Save settings to the database
  const saveSettings = async (settings: InvoiceSettings, name: string = 'Default Settings', isDefault: boolean = true, id?: string) => {
    try {
      const response = await fetch('/api/invoice-settings/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings,
          name,
          isDefault,
          id,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save invoice settings');
      }
      
      const result = await response.json();
      
      // If using fallback settings, throw an error to trigger the catch block
      if (result.fallback) {
        throw new Error(result.message || 'Database not available - settings not saved');
      }
      
      toast({
        title: 'Settings Saved',
        description: 'Your invoice settings have been saved successfully.',
      });
      
      // Update the cache with the new settings
      mutate(settings, false);
      
      return result.data;
    } catch (error: any) {
      console.error('Error saving invoice settings:', error);
      
      const errorMessage = error.message || 'There was an error saving your invoice settings.';
      
      toast({
        title: 'Error Saving Settings',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw error;
    }
  };
  
  // Get all saved settings
  const getAllSettings = async () => {
    try {
      const response = await fetch('/api/invoice-settings/v2');
      
      if (!response.ok) {
        throw new Error('Failed to fetch all invoice settings');
      }
      
      const result = await response.json();
      
      // Ensure we always return an array
      if (Array.isArray(result.data)) {
        return result.data;
      } else if (result.data && typeof result.data === 'object') {
        // If it's a single object (shouldn't happen with our fixes), wrap it in an array
        return [result.data];
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error fetching all invoice settings:', error);
      return [];
    }
  };
  
  // Delete settings
  const deleteSettings = async (id: string) => {
    try {
      const response = await fetch(`/api/invoice-settings/v2?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete invoice settings');
      }
      
      const result = await response.json();
      
      // If using fallback, throw an error
      if (result.fallback) {
        throw new Error('Database not available - settings not deleted');
      }
      
      toast({
        title: 'Settings Deleted',
        description: 'Invoice settings have been deleted successfully.',
      });
      
      return true;
    } catch (error: any) {
      console.error('Error deleting invoice settings:', error);
      
      toast({
        title: 'Error Deleting Settings',
        description: error.message || 'There was an error deleting your invoice settings.',
        variant: 'destructive',
      });
      
      return false;
    }
  };
  
  // Toggle default status for settings
  const setDefaultSettings = async (id: string) => {
    try {
      // First get the current setting to know its default status
      const currentSettings = await getAllSettings();
      const currentSetting = currentSettings.find((s: any) => s.id === id);
      
      if (!currentSetting) {
        throw new Error('Setting not found');
      }
      
      const newDefaultValue = !currentSetting.is_default;
      
      const response = await fetch('/api/invoice-settings/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          isDefault: newDefaultValue,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update default status');
      }
      
      const result = await response.json();
      
      if (result.fallback) {
        throw new Error('Database not available');
      }
      
      return true;
    } catch (error: any) {
      console.error('Error updating default status:', error);
      
      toast({
        title: 'Error Updating Default Status',
        description: error.message || 'There was an error updating the default status.',
        variant: 'destructive',
      });
      
      return false;
    }
  };
  
  return {
    settings: data || null,
    isLoading,
    error,
    mutate,
    saveSettings,
    getAllSettings,
    deleteSettings,
    setDefaultSettings,
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
  const [settings, setSettings] = useState<InvoiceSettings>(
    initialSettings as InvoiceSettings || dbSettings || emptyInvoiceSettings
  );
  
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
