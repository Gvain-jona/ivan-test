'use client';

import { useState } from 'react';
import { InvoiceSettings } from '../types';
import { defaultInvoiceSettings } from '../context/InvoiceContext';
import useSWR from 'swr';
import { useToast } from '@/components/ui/use-toast';

/**
 * Hook for managing invoice settings with better error handling
 * Uses SWR for caching and revalidation
 */
export function useInvoiceSettings() {
  const { toast } = useToast();
  
  // Use SWR to fetch and cache settings
  const { data, error, isLoading, mutate } = useSWR(
    'invoice-settings-v2',
    async () => {
      try {
        const response = await fetch('/api/invoice-settings/v2?default=true');
        
        if (!response.ok) {
          throw new Error('Failed to fetch invoice settings');
        }
        
        const result = await response.json();
        
        // If using fallback settings, show a toast
        if (result.fallback) {
          console.warn('Using fallback invoice settings:', result.message);
        }
        
        return result.data?.settings || defaultInvoiceSettings;
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
      const response = await fetch('/api/invoice-settings/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings,
          name,
          isDefault,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save invoice settings');
      }
      
      const result = await response.json();
      
      // If using fallback settings, show a toast
      if (result.fallback) {
        console.warn('Using fallback for saving invoice settings:', result.message);
        toast({
          title: 'Settings Saved Locally',
          description: 'Your settings have been saved locally but not to the database.',
        });
      } else {
        toast({
          title: 'Settings Saved',
          description: 'Your invoice settings have been saved successfully.',
        });
      }
      
      // Update the cache with the new settings
      mutate(settings, false);
      
      return result.data;
    } catch (error) {
      console.error('Error saving invoice settings:', error);
      
      toast({
        title: 'Error Saving Settings',
        description: 'There was an error saving your invoice settings. Your changes will be applied temporarily.',
        variant: 'destructive',
      });
      
      // Update the cache anyway to provide a better user experience
      mutate(settings, false);
      
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
      
      return result.data || [];
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
      
      // If using fallback, show a toast
      if (result.fallback) {
        console.warn('Using fallback for deleting invoice settings');
        toast({
          title: 'Settings Deleted Locally',
          description: 'Your settings have been deleted locally but not from the database.',
        });
      } else {
        toast({
          title: 'Settings Deleted',
          description: 'Your invoice settings have been deleted successfully.',
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting invoice settings:', error);
      
      toast({
        title: 'Error Deleting Settings',
        description: 'There was an error deleting your invoice settings.',
        variant: 'destructive',
      });
      
      return false;
    }
  };
  
  // Set default settings
  const setDefaultSettings = async (id: string) => {
    try {
      const response = await fetch('/api/invoice-settings/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          isDefault: true,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to set default invoice settings');
      }
      
      const result = await response.json();
      
      // If using fallback, show a toast
      if (result.fallback) {
        console.warn('Using fallback for setting default invoice settings');
        toast({
          title: 'Default Settings Set Locally',
          description: 'Your default settings have been set locally but not in the database.',
        });
      } else {
        toast({
          title: 'Default Settings Set',
          description: 'Your default invoice settings have been set successfully.',
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error setting default invoice settings:', error);
      
      toast({
        title: 'Error Setting Default Settings',
        description: 'There was an error setting your default invoice settings.',
        variant: 'destructive',
      });
      
      return false;
    }
  };
  
  return {
    settings: data || defaultInvoiceSettings,
    isLoading,
    error,
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
  const [settings, setSettings] = useState<InvoiceSettings>({
    ...defaultInvoiceSettings,
    ...initialSettings,
  });
  
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
