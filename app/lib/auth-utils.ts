/**
 * Authentication utilities for server-side components and API routes
 */

import { createClient } from '@/lib/supabase/server';
import { User } from '@supabase/supabase-js';

/**
 * Get the authenticated user from the current request
 * This is intended for use in API routes and server components
 * @returns The authenticated user or null if not authenticated
 */
export async function getAuthUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error getting authenticated user:', error);
      return null;
    }

    return data.user;
  } catch (error) {
    console.error('Exception getting authenticated user:', error);
    return null;
  }
}

/**
 * Check if a user has admin role
 * @param user The user to check
 * @returns True if the user is an admin, false otherwise
 */
export async function isAdmin(user: User): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error checking admin role:', error);
      return false;
    }

    return data?.role === 'admin';
  } catch (error) {
    console.error('Exception checking admin role:', error);
    return false;
  }
}

/**
 * Check if a user has manager role
 * @param user The user to check
 * @returns True if the user is a manager, false otherwise
 */
export async function isManager(user: User): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error checking manager role:', error);
      return false;
    }

    return data?.role === 'manager' || data?.role === 'admin';
  } catch (error) {
    console.error('Exception checking manager role:', error);
    return false;
  }
}

/**
 * Get the user's profile from the database
 * @param user The user to get the profile for
 * @returns The user's profile or null if not found
 */
export async function getUserProfile(user: User): Promise<any | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error getting user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception getting user profile:', error);
    return null;
  }
}
