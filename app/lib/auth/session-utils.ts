/**
 * Centralized utilities for session management
 * Ensures consistent handling of auth sessions across the application
 */

import { Session, User } from '@supabase/supabase-js';
import { createClient } from '../supabase/client';

// Session storage key in localStorage
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
 * Store session data in localStorage
 */
export function storeSessionData(session: Session): void {
  if (!session) return;
  
  const sessionData = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    user: session.user,
    token_type: session.token_type
  };
  
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    localStorage.setItem('auth_completed', 'true');
    localStorage.setItem('auth_timestamp', Date.now().toString());
    
    if (session.user?.id) {
      localStorage.setItem('auth_user_id', session.user.id);
    }
    
    localStorage.setItem('auth_in_progress', 'false');
    
    if (session.user?.email) {
      localStorage.setItem('auth_email', session.user.email);
      localStorage.setItem('auth_email_temp', session.user.email);
    }
  } catch (error) {
    console.error('Error storing session data:', error);
  }
}

/**
 * Retrieve session data from localStorage
 */
export function getStoredSessionData(): Session | null {
  try {
    const storedData = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!storedData) return null;
    
    return JSON.parse(storedData);
  } catch (error) {
    console.error('Error retrieving session data:', error);
    return null;
  }
}

/**
 * Clear all auth-related data from localStorage
 */
export function clearSessionData(): void {
  AUTH_KEYS.forEach(key => localStorage.removeItem(key));
}

/**
 * Set the session in Supabase client
 */
export async function setClientSession(session: Session): Promise<{ success: boolean, error?: any }> {
  try {
    if (!session?.access_token) return { success: false };
    
    const supabase = createClient();
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token || ''
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error setting client session:', error);
    return { success: false, error };
  }
}

/**
 * Get redirect path from URL search params
 */
export function getRedirectPath(searchParams: URLSearchParams | null): string {
  return searchParams?.get('redirect') || '/dashboard/orders';
}

/**
 * Format session for cookie storage
 */
export function formatSessionForCookie(session: Session): string {
  return JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    user: session.user,
    token_type: session.token_type
  });
}
