'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/app/context/auth-context';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  UserSettings,
  SettingsContextType,
  defaultSettings
} from './types';
import {
  mergeWithDefaultSettings,
  saveSettingsToLocalStorage,
  loadSettingsFromLocalStorage
} from './utils';

// Create the context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * Provider component for settings context
 */
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();
  const supabase = createClientComponentClient();

  // Load settings on mount or when user profile changes
  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      setError(null);

      try {
        // First try to load from localStorage for faster initial load
        const cachedSettings = loadSettingsFromLocalStorage();
        if (cachedSettings) {
          setSettings(cachedSettings);
          setIsLoading(false);
        }

        // Check if we're in development mode with a mock user
        const isDevelopment = process.env.NODE_ENV === 'development';
        const isMockUser = profile?.id === '00000000-0000-0000-0000-000000000000';

        // For development mock user, just use default settings
        if (isDevelopment && isMockUser) {
          console.log('Using default settings for development mock user');
          const devSettings = mergeWithDefaultSettings({});
          setSettings(devSettings);
          saveSettingsToLocalStorage(devSettings);
          setIsLoading(false);
          return;
        }

        // Only fetch from database if user is authenticated with a real ID
        if (profile?.id && !isMockUser) {
          try {
            const { data, error } = await supabase
              .from('user_settings')
              .select('settings')
              .eq('user_id', profile.id)
              .single();

            if (error) {
              // PGRST116 is "no rows returned" error - this is expected for new users
              if (error.code === 'PGRST116') {
                console.log('No settings found for user, using defaults');
              } else {
                console.error('Error fetching settings:', error);
                throw error;
              }
            }

            // Merge with default settings to ensure all properties exist
            const mergedSettings = mergeWithDefaultSettings(data?.settings as Partial<UserSettings>);
            setSettings(mergedSettings);

            // Cache in localStorage for faster access next time
            saveSettingsToLocalStorage(mergedSettings);
          } catch (fetchError) {
            console.error('Error fetching settings from database:', fetchError);
            // Fall back to defaults if database fetch fails
            const fallbackSettings = mergeWithDefaultSettings({});
            setSettings(fallbackSettings);
            saveSettingsToLocalStorage(fallbackSettings);
          }
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        setError('Failed to load settings');

        // Ensure we have usable settings even if there's an error
        const fallbackSettings = mergeWithDefaultSettings({});
        setSettings(fallbackSettings);
        saveSettingsToLocalStorage(fallbackSettings);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [profile?.id, supabase]);

  /**
   * Updates settings in both state and database
   */
  const updateSettings = async <K extends keyof UserSettings>(
    category: K,
    values: Partial<UserSettings[K]>
  ): Promise<void> => {
    if (!profile?.id) {
      console.warn('Cannot update settings: User not authenticated');
      setError('User not authenticated');
      return;
    }

    try {
      // Clear any previous errors
      setError(null);

      // Update local state immediately for responsive UI
      const updatedSettings = {
        ...settings,
        [category]: {
          ...settings[category],
          ...values,
        },
      };

      setSettings(updatedSettings);

      // Cache in localStorage for faster access
      saveSettingsToLocalStorage(updatedSettings);

      // Check if we're in development mode with a mock user
      const isDevelopment = process.env.NODE_ENV === 'development';
      const isMockUser = profile.id === '00000000-0000-0000-0000-000000000000';

      // For development mock user, just update localStorage and skip database
      if (isDevelopment && isMockUser) {
        console.log(`Settings updated in localStorage for development user: ${String(category)}`);
        return;
      }

      // Then update in database for real users
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: profile.id,
          settings: updatedSettings,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Database error updating settings:', error);
        throw error;
      }

      console.log(`Settings updated successfully for category: ${String(category)}`);
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('Failed to update settings');

      // Don't revert the UI state as it would cause a jarring experience
      // Instead, we'll rely on the next load to correct any inconsistencies
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoading, error }}>
      {children}
    </SettingsContext.Provider>
  );
}

/**
 * Hook for accessing settings context
 */
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
