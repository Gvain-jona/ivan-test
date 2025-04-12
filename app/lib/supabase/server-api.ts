import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/app/types/database.types';

/**
 * Creates a Supabase server client with admin privileges
 * IMPORTANT: This should only be used in server-side API routes
 * where admin access is required and proper authorization checks are in place
 */
export const createServerApiClient = () => {
  const cookieStore = cookies();
  
  return createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });
};

/**
 * Creates a Supabase server client
 * This is an alias for createServerApiClient for backward compatibility
 */
export const createClient = createServerApiClient;

/**
 * Verifies if a session token is valid
 * @param token The session token to verify
 * @returns Object containing validity status and user info if valid
 */
export const verifySessionToken = async (token: string) => {
  try {
    const supabase = createServerApiClient();
    
    // Verify the token by using it to get the user
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return { valid: false, user: null, error: error?.message || 'Invalid token' };
    }
    
    return { valid: true, user: data.user, error: null };
  } catch (error) {
    console.error('Error verifying session token:', error);
    return { valid: false, user: null, error: 'Server error verifying token' };
  }
};

/**
 * Checks if a user has verified their PIN
 * @param userId The user ID to check
 * @returns Whether the user has verified their PIN
 */
export const checkPinVerified = async (userId: string) => {
  try {
    const supabase = createServerApiClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('pin_verified')
      .eq('id', userId)
      .single();
    
    if (error || !data) {
      return { verified: false, error: error?.message || 'User not found' };
    }
    
    return { verified: !!data.pin_verified, error: null };
  } catch (error) {
    console.error('Error checking PIN verification:', error);
    return { verified: false, error: 'Server error checking PIN' };
  }
};

/**
 * Gets a user's profile information
 * @param userId The user ID to get profile for
 * @returns The user's profile data
 */
export const getUserProfile = async (userId: string) => {
  try {
    const supabase = createServerApiClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      return { profile: null, error: error.message };
    }
    
    return { profile: data, error: null };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { profile: null, error: 'Server error getting profile' };
  }
};
