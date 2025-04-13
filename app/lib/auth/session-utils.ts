/**
 * Centralized utilities for session management
 * Ensures consistent handling of auth sessions across the application
 */

import { Session, User } from '@supabase/supabase-js';
import { createClient } from '../../lib/supabase/client';

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
  SESSION_STORAGE_KEY
];

/**
 * Get the base URL for the current environment
 * Uses NEXT_PUBLIC_APP_URL from environment variables
 */
export function getBaseUrl(): string {
  // First check for explicit environment variable
  if (process.env.NEXT_PUBLIC_APP_URL) {
    const url = process.env.NEXT_PUBLIC_APP_URL.trim();
    console.log('Using NEXT_PUBLIC_APP_URL:', url);
    
    // Always ensure we return HTTP for localhost to avoid SSL errors
    if (url.includes('localhost')) {
      console.log('Detected localhost, forcing HTTP protocol');
      return url.replace('https://', 'http://');
    }
    
    // For production, ensure HTTPS is used
    if (!url.startsWith('https://') && !url.includes('localhost')) {
      console.log('Non-localhost URL without HTTPS, adding HTTPS protocol');
      return url.startsWith('http://') ? url.replace('http://', 'https://') : `https://${url}`;
    }
    
    return url;
  }
  
  // Fallback to window location in browser
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    console.log('No NEXT_PUBLIC_APP_URL, using window.location.origin:', origin);
    
    // For localhost, always use HTTP to avoid SSL errors
    if (origin.includes('localhost')) {
      console.log('Detected localhost, forcing HTTP protocol');
      return origin.replace('https://', 'http://');
    }
    return origin;
  }
  
  // Environment-specific fallback
  const fallbackUrl = process.env.NODE_ENV === 'production'
    ? 'https://ivan-test.vercel.app'  // Production URL
    : 'http://localhost:3000';        // Development URL (using HTTP, not HTTPS)
  
  console.log('Using environment-specific fallback URL:', fallbackUrl);
  return fallbackUrl;
}

/**
 * Get the auth callback URL for the current environment
 */
export function getAuthCallbackUrl(customPath?: string): string {
  const baseUrl = getBaseUrl();
  const callbackPath = customPath || '/auth/callback';
  
  // Ensure path starts with a slash
  const normalizedPath = callbackPath.startsWith('/') ? callbackPath : `/${callbackPath}`;
  
  const fullUrl = `${baseUrl}${normalizedPath}`;
  console.log('Generated auth callback URL:', fullUrl);
  return fullUrl;
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
export async function signOut(): Promise<{ success: boolean, error?: any }> {
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
    return { success: false, error };
  }
}
