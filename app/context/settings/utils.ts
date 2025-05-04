/**
 * Utility functions for settings management
 */

import { UserSettings, defaultSettings } from './types';

/**
 * Merges user settings with default settings
 * @param userSettings Partial user settings from database
 * @returns Complete settings object with defaults for missing values
 */
export function mergeWithDefaultSettings(userSettings?: Partial<UserSettings>): UserSettings {
  if (!userSettings) {
    return defaultSettings;
  }

  return {
    appearance: {
      ...defaultSettings.appearance,
      ...userSettings.appearance,
    },
    layout: {
      ...defaultSettings.layout,
      ...userSettings.layout,
    },
    notifications: {
      ...defaultSettings.notifications,
      ...userSettings.notifications,
      notificationTypes: {
        ...defaultSettings.notifications.notificationTypes,
        ...userSettings.notifications?.notificationTypes,
      },
    },
    language: {
      ...defaultSettings.language,
      ...userSettings.language,
    },
    dataPrivacy: {
      ...defaultSettings.dataPrivacy,
      ...userSettings.dataPrivacy,
    },
    profit: {
      ...defaultSettings.profit,
      ...userSettings.profit,
      overrides: userSettings.profit?.overrides || defaultSettings.profit?.overrides || [],
    },
    accounts: {
      ...defaultSettings.accounts,
      ...userSettings.accounts,
    },
  };
}

/**
 * Saves settings to localStorage for faster access
 * @param settings Settings to save
 */
export function saveSettingsToLocalStorage(settings: UserSettings): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('user_settings', JSON.stringify(settings));
    console.log('Settings saved to localStorage');
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
    // Try to clear localStorage if it might be full
    try {
      // Remove only our settings item to avoid affecting other parts of the app
      localStorage.removeItem('user_settings');
      console.log('Cleared user_settings from localStorage');
    } catch (clearError) {
      console.error('Failed to clear localStorage:', clearError);
    }
  }
}

/**
 * Loads settings from localStorage
 * @returns Settings from localStorage or null if not found
 */
export function loadSettingsFromLocalStorage(): UserSettings | null {
  if (typeof window === 'undefined') return null;

  try {
    const settingsJson = localStorage.getItem('user_settings');

    if (!settingsJson) {
      console.log('No settings found in localStorage');
      return null;
    }

    const parsedSettings = JSON.parse(settingsJson);

    // Validate that the parsed settings have the expected structure
    if (!parsedSettings || typeof parsedSettings !== 'object') {
      console.warn('Invalid settings format in localStorage');
      return null;
    }

    console.log('Settings loaded from localStorage');
    return parsedSettings;
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error);

    // Try to remove corrupted settings
    try {
      localStorage.removeItem('user_settings');
      console.log('Removed potentially corrupted settings from localStorage');
    } catch (removeError) {
      console.error('Failed to remove corrupted settings:', removeError);
    }

    return null;
  }
}
