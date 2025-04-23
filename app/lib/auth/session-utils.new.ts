/**
 * Centralized utilities for session management
 * Following Supabase's recommended patterns for Next.js App Router
 */

import { User } from '@supabase/supabase-js';
import { createClient } from '../supabase/client';

/**
 * Get the base URL for the current environment
 */
export function getBaseUrl(): string {
  // First check for explicit environment variable
  if (process.env.NEXT_PUBLIC_APP_URL) {
    const url = process.env.NEXT_PUBLIC_APP_URL.trim();
    
    // Always ensure we return HTTP for localhost to avoid SSL errors
    if (url.includes('localhost')) {
      return url.replace('https://', 'http://');
    }
    
    // For production, ensure HTTPS is used
    if (!url.startsWith('https://') && !url.includes('localhost')) {
      return url.startsWith('http://') ? url.replace('http://', 'https://') : `https://${url}`;
    }
    
    return url;
  }
  
  // Environment-specific fallback
  return process.env.NODE_ENV === 'production'
    ? 'https://ivan-test.vercel.app'
    : 'http://localhost:3000';
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
 */
export async function signOut(): Promise<{ success: boolean, error?: any }> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    return { success: false, error };
  }
}
