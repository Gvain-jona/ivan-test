/**
 * Centralized utilities for profile management
 * Ensures consistent handling of user profiles across the application
 */

import { User } from '@supabase/supabase-js';
import { createClient } from '../supabase/client';

export type Profile = {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'manager' | 'staff'
  status: 'active' | 'inactive' | 'locked'
  created_at: string
  updated_at: string
}

/**
 * Fetch a user's profile from the database
 */
export async function fetchUserProfile(userId: string): Promise<{ profile: Profile | null, error: any | null }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return { profile: null, error };
    }
    
    return { profile: data, error: null };
  } catch (error) {
    console.error('Exception fetching profile:', error);
    return { profile: null, error };
  }
}

/**
 * Create a new user profile
 */
export async function createUserProfile(user: User): Promise<{ profile: Profile | null, error: any | null }> {
  try {
    if (!user?.id || !user?.email) {
      return { profile: null, error: new Error('Invalid user data') };
    }
    
    const supabase = createClient();
    
    // Get role from allowed_emails table
    const { data: allowedEmail } = await supabase
      .from('allowed_emails')
      .select('role')
      .eq('email', user.email)
      .maybeSingle();
    
    // Validate role is one of the allowed values
    const userRole = (allowedEmail?.role === 'admin' || allowedEmail?.role === 'manager' || allowedEmail?.role === 'staff') 
      ? allowedEmail.role 
      : 'staff';
    
    console.log(`Creating profile for ${user.email} with role: ${userRole}`);
    
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role: userRole,
        status: 'active',
      })
      .select('*')
      .single();
    
    if (error) {
      console.error('Error creating profile:', error);
      return { profile: null, error };
    }
    
    console.log('Profile created successfully');
    return { profile: data, error: null };
  } catch (error) {
    console.error('Exception creating profile:', error);
    return { profile: null, error };
  }
}

/**
 * Fetch or create a user profile
 * This is a convenience function that tries to fetch first, then creates if not found
 */
export async function getOrCreateProfile(user: User): Promise<{ profile: Profile | null, error: any | null }> {
  if (!user?.id) {
    return { profile: null, error: new Error('Invalid user ID') };
  }
  
  // Try to fetch existing profile
  const { profile, error } = await fetchUserProfile(user.id);
  
  // If profile exists, return it
  if (profile) {
    return { profile, error: null };
  }
  
  // If error is not a "not found" error, return the error
  if (error && error.code !== 'PGRST116') {
    return { profile: null, error };
  }
  
  // Otherwise, create a new profile
  return createUserProfile(user);
}
