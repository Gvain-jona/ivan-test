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
    
    console.log('Fetching profile for user ID:', userId);
    
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
      console.error('Invalid user data for profile creation:', user);
      return { profile: null, error: new Error('Invalid user data') };
    }
    
    console.log('Creating profile with user data:', {
      id: user.id,
      email: user.email,
      metadata: user.user_metadata
    });
    
    const supabase = createClient();
    
    // Default to staff role if allowed_emails check fails
    let userRole = 'staff';
    
    try {
      // Get role from allowed_emails table
      const { data: allowedEmail, error: allowedEmailError } = await supabase
        .from('allowed_emails')
        .select('role')
        .eq('email', user.email)
        .maybeSingle();
      
      if (allowedEmailError) {
        console.error('Error checking allowed emails:', allowedEmailError);
      } else {
        console.log('Allowed email check result:', allowedEmail);
        
        // Validate role is one of the allowed values
        userRole = (allowedEmail?.role === 'admin' || allowedEmail?.role === 'manager' || allowedEmail?.role === 'staff') 
          ? allowedEmail.role 
          : 'staff';
      }
    } catch (allowedEmailCheckError) {
      console.error('Exception checking allowed emails:', allowedEmailCheckError);
    }
    
    console.log(`Creating profile for ${user.email} with role: ${userRole}`);
    
    // Prepare profile data
    const profileData = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      role: userRole,
      status: 'active',
    };
    
    console.log('Profile data to insert:', profileData);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error creating profile:', error);
        
        // Check if this is an RLS error
        if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
          console.error('This appears to be a Row Level Security (RLS) error. Trying fix-profile-rls route...');
          
          // Try using the fix-profile-rls route to bypass RLS
          return await createProfileWithServiceRole(user);
        }
        
        return { profile: null, error };
      }
      
      console.log('Profile created successfully:', data);
      return { profile: data, error: null };
    } catch (insertError) {
      console.error('Exception during profile insert:', insertError);
      
      // Try the fix-profile-rls route as a fallback
      console.log('Trying fix-profile-rls route as fallback...');
      return await createProfileWithServiceRole(user);
    }
  } catch (error) {
    console.error('Exception creating profile:', error);
    return { profile: null, error };
  }
}

/**
 * Create a profile using the service role key via the fix-profile-rls route
 * This bypasses RLS policies to ensure profile creation works
 */
async function createProfileWithServiceRole(user: User): Promise<{ profile: Profile | null, error: any | null }> {
  try {
    console.log('Attempting to create profile with service role for user:', user.email);
    
    if (typeof window === 'undefined') {
      console.error('createProfileWithServiceRole called in server context');
      return { profile: null, error: new Error('Cannot call from server context') };
    }
    
    // Prepare the user data to send to the API
    const userData = {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata || {}
    };
    
    console.log('Sending data to fix-profile-rls route:', {
      id: userData.id,
      email: userData.email,
      hasMetadata: !!userData.user_metadata
    });
    
    // Call the API route with retry logic
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        const response = await fetch('/auth/fix-profile-rls', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
          console.error(`Error from fix-profile-rls route (attempt ${retries + 1}):`, responseData);
          
          if (retries === maxRetries - 1) {
            return { 
              profile: null, 
              error: new Error(responseData.error || `Failed to create profile after ${maxRetries} attempts`) 
            };
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
          retries++;
          continue;
        }
        
        if (!responseData.profile) {
          console.error('No profile returned from fix-profile-rls route:', responseData);
          return { 
            profile: null, 
            error: new Error('No profile data returned from service') 
          };
        }
        
        console.log('Profile created with service role:', responseData.profile);
        return { profile: responseData.profile, error: null };
      } catch (fetchError) {
        console.error(`Fetch error in createProfileWithServiceRole (attempt ${retries + 1}):`, fetchError);
        
        if (retries === maxRetries - 1) {
          return { 
            profile: null, 
            error: fetchError instanceof Error ? fetchError : new Error('Network error creating profile') 
          };
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
        retries++;
      }
    }
    
    // This should never be reached due to the return in the last retry attempt
    return { 
      profile: null, 
      error: new Error(`Failed to create profile after ${maxRetries} attempts`) 
    };
  } catch (error) {
    console.error('Exception in createProfileWithServiceRole:', error);
    return { profile: null, error };
  }
}

/**
 * Fetch or create a user profile
 * This is a convenience function that tries to fetch first, then creates if not found
 */
export async function getOrCreateProfile(user: User): Promise<{ profile: Profile | null, error: any | null }> {
  try {
    if (!user?.id) {
      console.error('Invalid user ID for profile fetch/create');
      return { profile: null, error: new Error('Invalid user ID') };
    }
    
    console.log('Attempting to get or create profile for user:', user.email);
    
    // Try to fetch existing profile
    const { profile, error } = await fetchUserProfile(user.id);
    
    // If profile exists, return it
    if (profile) {
      console.log('Found existing profile for user:', user.email);
      return { profile, error: null };
    }
    
    console.log('No existing profile found, creating new profile for user:', user.email);
    
    // Create a new profile
    const result = await createUserProfile(user);
    
    if (result.error) {
      console.error('Failed to create profile:', result.error);
    } else {
      console.log('Successfully created profile for user:', user.email);
    }
    
    return result;
  } catch (error) {
    console.error('Exception in getOrCreateProfile:', error);
    return { profile: null, error };
  }
}
