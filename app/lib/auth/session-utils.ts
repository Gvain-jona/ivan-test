/**
 * Centralized utilities for session management
 * Ensures consistent handling of auth sessions across the application
 */

import { Session, User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

// Session storage key in localStorage - matches Supabase's default
export const SESSION_STORAGE_KEY = 'sb-auth';

// Auth-related localStorage keys
export const AUTH_KEYS = [
  'auth_completed',
  'auth_timestamp',
  'auth_user_id',
  'auth_in_progress',
  'auth_email',
  'auth_email_temp',
  'cached_user_profile',  // Add profile cache
  SESSION_STORAGE_KEY
];

/**
 * Get the base URL for the current environment
 * Uses NEXT_PUBLIC_APP_URL from environment variables
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.trim();
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Server-side fallback — NEXT_PUBLIC_APP_URL must be set in production
  if (process.env.NODE_ENV === 'production') {
    console.error('getBaseUrl: NEXT_PUBLIC_APP_URL is not set in production');
  }
  return 'http://localhost:3000';
}

/**
 * Get the auth callback URL for the current environment
 */
export function getAuthCallbackUrl(customPath?: string): string {
  const baseUrl = getBaseUrl();
  const callbackPath = customPath || '/auth/callback';
  const normalizedPath = callbackPath.startsWith('/') ? callbackPath : `/${callbackPath}`;
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Get redirect path from URL search params
 */
export function getRedirectPath(searchParams: URLSearchParams | null): string {
  return searchParams?.get('redirect') || '/dashboard/orders';
}

/**
 * Retrieve current user from Supabase client
 * This is the recommended way to get the current user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Sign out the current user
 * This will clear the session from both cookies and localStorage
 */
export async function signOut(): Promise<{ success: boolean, error?: Error }> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
    
    // Clear any local storage items we might have set
    AUTH_KEYS.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // Ignore errors when clearing localStorage
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Failed to sign out')
    };
  }
}
