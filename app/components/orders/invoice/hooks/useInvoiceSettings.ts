import { useState, useEffect, useCallback } from 'react';
import { InvoiceSettings } from '../types';
import { useToast } from '@/components/ui/use-toast';

interface InvoiceSettingRecord {
  id: string;
  name: string;
  is_default: boolean;
  settings: InvoiceSettings;
  created_at: string;
  updated_at: string;
}

interface UseInvoiceSettingsReturn {
  savedSettings: InvoiceSettingRecord[] | null;
  defaultSettings: InvoiceSettingRecord | null;
  isLoading: boolean;
  error: string | null;
  saveSettings: (settings: InvoiceSettings, name?: string, isDefault?: boolean) => Promise<InvoiceSettingRecord | null>;
  updateSettings: (id: string, settings: InvoiceSettings, name?: string, isDefault?: boolean) => Promise<InvoiceSettingRecord | null>;
  deleteSettings: (id: string) => Promise<boolean>;
  loadSettings: () => Promise<void>;
}

// Local storage keys
const SETTINGS_CACHE_KEY = 'invoice_settings_cache';
const DEFAULT_SETTINGS_CACHE_KEY = 'invoice_settings_default_cache';
const SETTINGS_CACHE_TIMESTAMP_KEY = 'invoice_settings_cache_timestamp';

// Cache expiration time (24 hours in milliseconds)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

/**
 * Custom hook for managing invoice settings with local storage caching
 */
export function useInvoiceSettings(): UseInvoiceSettingsReturn {
  const [savedSettings, setSavedSettings] = useState<InvoiceSettingRecord[] | null>(null);
  const [defaultSettings, setDefaultSettings] = useState<InvoiceSettingRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Check if the cache is valid
   */
  const isCacheValid = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;

    const timestamp = localStorage.getItem(SETTINGS_CACHE_TIMESTAMP_KEY);
    if (!timestamp) return false;

    const cachedTime = parseInt(timestamp, 10);
    const now = Date.now();

    return now - cachedTime < CACHE_EXPIRATION;
  }, []);

  /**
   * Load settings from cache
   */
  const loadFromCache = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;

    try {
      // Check if we have valid cache
      if (!isCacheValid()) return false;

      // Load all settings from cache
      const cachedSettings = localStorage.getItem(SETTINGS_CACHE_KEY);
      if (cachedSettings) {
        setSavedSettings(JSON.parse(cachedSettings));
      }

      // Load default settings from cache
      const cachedDefault = localStorage.getItem(DEFAULT_SETTINGS_CACHE_KEY);
      if (cachedDefault) {
        setDefaultSettings(JSON.parse(cachedDefault));
      }

      return true;
    } catch (err) {
      console.error('Error loading from cache:', err);
      return false;
    }
  }, [isCacheValid]);

  /**
   * Save settings to cache
   */
  const saveToCache = useCallback((allSettings: InvoiceSettingRecord[], defaultSetting: InvoiceSettingRecord | null) => {
    if (typeof window === 'undefined') return;

    try {
      // Save all settings
      localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(allSettings));

      // Save default setting
      if (defaultSetting) {
        localStorage.setItem(DEFAULT_SETTINGS_CACHE_KEY, JSON.stringify(defaultSetting));
      }

      // Update timestamp
      localStorage.setItem(SETTINGS_CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (err) {
      console.error('Error saving to cache:', err);
    }
  }, []);

  /**
   * Load all saved settings
   */
  const loadSettings = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to load from cache first if not forcing refresh
      if (!forceRefresh && loadFromCache()) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch all settings from API
        const response = await fetch('/api/invoice-settings');
        const result = await response.json();

        if (!response.ok) {
          console.warn('API returned error:', result.error);
          throw new Error(result.error || 'Failed to load settings');
        }

        const allSettings = result.data || [];
        setSavedSettings(allSettings);

        // Find default setting
        const defaultSetting = allSettings.find((s: InvoiceSettingRecord) => s.is_default) || null;
        setDefaultSettings(defaultSetting);

        // Save to cache
        saveToCache(allSettings, defaultSetting);
      } catch (apiError) {
        console.error('API error:', apiError);

        // Try to load from cache as fallback
        if (!loadFromCache()) {
          // If we can't load from cache either, create default settings
          const defaultSettings: InvoiceSettings = {
            // Display options
            includeHeader: true,
            includeFooter: true,
            includeLogo: true,
            includeSignature: false,
            format: 'a4',
            template: 'standard',

            // Item display options
            showItemCategory: true,
            showItemName: true,
            showItemSize: true,
            itemDisplayFormat: 'combined',

            // Tax and discount options
            includeTax: false,
            taxRate: 0,
            includeDiscount: false,
            discountRate: 0,

            // Content
            notes: `Thank you for your business!`,
            customHeader: '',
            customFooter: 'Making You Visible.',

            // Company information
            tinNumber: '1028570150',
            companyName: 'IVAN PRINTS',
            companyEmail: 'sherilex256@gmail.com',
            companyPhone: '0755 541 373',
            companyAddress: 'Printing, Designing, Branding.',
            companyLogo: '/images/default-logo.svg',

            // Payment details
            bankDetails: [
              {
                id: '1',
                bankName: 'ABSA BANK',
                accountName: 'IVAN PRINTS',
                accountNumber: '6008084570',
              }
            ],
            mobileMoneyDetails: [
              {
                id: '1',
                provider: 'Airtel',
                phoneNumber: '0755 541 373',
                contactName: 'Vuule Abdul',
              }
            ],
          };

          // Create a default setting record
          const defaultSettingRecord: InvoiceSettingRecord = {
            id: 'default-local',
            name: 'Default',
            is_default: true,
            settings: defaultSettings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          setSavedSettings([defaultSettingRecord]);
          setDefaultSettings(defaultSettingRecord);

          // Save to cache
          saveToCache([defaultSettingRecord], defaultSettingRecord);
        }
      }
    } catch (err) {
      console.error('Error in loadSettings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, [loadFromCache, saveToCache, toast]);

  /**
   * Save new settings
   */
  const saveSettings = useCallback(
    async (
      settings: InvoiceSettings,
      name: string = 'Default',
      isDefault: boolean = true
    ): Promise<InvoiceSettingRecord | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/invoice-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            isDefault,
            settings,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to save settings');
        }

        // Update local state and cache
        const newSetting = result.data;
        const updatedSettings = [...(savedSettings || []), newSetting];

        // If this is the new default, update the default setting
        let newDefault = defaultSettings;
        if (isDefault) {
          newDefault = newSetting;
          // Update other settings to not be default
          updatedSettings.forEach(s => {
            if (s.id !== newSetting.id) {
              s.is_default = false;
            }
          });
        }

        setSavedSettings(updatedSettings);
        if (isDefault) setDefaultSettings(newSetting);

        // Update cache
        saveToCache(updatedSettings, newDefault);

        toast({
          title: 'Success',
          description: 'Invoice settings saved successfully',
        });

        return newSetting;
      } catch (err) {
        console.error('Error saving invoice settings:', err);
        setError(err instanceof Error ? err.message : 'Failed to save settings');
        toast({
          title: 'Error',
          description: 'Failed to save invoice settings',
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [savedSettings, defaultSettings, saveToCache, toast]
  );

  /**
   * Update existing settings
   */
  const updateSettings = useCallback(
    async (
      id: string,
      settings: InvoiceSettings,
      name?: string,
      isDefault?: boolean
    ): Promise<InvoiceSettingRecord | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/invoice-settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id,
            name,
            isDefault,
            settings,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to update settings');
        }

        // Update local state and cache
        const updatedSetting = result.data;
        const updatedSettings = savedSettings?.map(s =>
          s.id === id ? updatedSetting : (isDefault ? { ...s, is_default: false } : s)
        ) || [];

        // If this is the new default, update the default setting
        let newDefault = defaultSettings;
        if (isDefault) {
          newDefault = updatedSetting;
        } else if (defaultSettings?.id === id) {
          // If this was the default but is no longer, clear default
          newDefault = null;
        }

        setSavedSettings(updatedSettings);
        setDefaultSettings(newDefault);

        // Update cache
        saveToCache(updatedSettings, newDefault);

        toast({
          title: 'Success',
          description: 'Invoice settings updated successfully',
        });

        return updatedSetting;
      } catch (err) {
        console.error('Error updating invoice settings:', err);
        setError(err instanceof Error ? err.message : 'Failed to update settings');
        toast({
          title: 'Error',
          description: 'Failed to update invoice settings',
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [savedSettings, defaultSettings, saveToCache, toast]
  );

  /**
   * Delete settings
   */
  const deleteSettings = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/invoice-settings?id=${id}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to delete settings');
        }

        // Update local state and cache
        const wasDefault = defaultSettings?.id === id;
        const updatedSettings = savedSettings?.filter(s => s.id !== id) || [];

        // If we deleted the default, find a new default
        let newDefault = defaultSettings;
        if (wasDefault) {
          newDefault = updatedSettings.find(s => s.is_default) || null;
        }

        setSavedSettings(updatedSettings);
        if (wasDefault) setDefaultSettings(newDefault);

        // Update cache
        saveToCache(updatedSettings, newDefault);

        toast({
          title: 'Success',
          description: 'Invoice settings deleted successfully',
        });

        return true;
      } catch (err) {
        console.error('Error deleting invoice settings:', err);
        setError(err instanceof Error ? err.message : 'Failed to delete settings');
        toast({
          title: 'Error',
          description: 'Failed to delete invoice settings',
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [savedSettings, defaultSettings, saveToCache, toast]
  );

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    savedSettings,
    defaultSettings,
    isLoading,
    error,
    saveSettings,
    updateSettings,
    deleteSettings,
    loadSettings,
  };
}
