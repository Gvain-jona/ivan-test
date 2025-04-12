import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/app/types/database.types';

/**
 * Creates a unified Supabase server client
 * This is used for server components and API routes
 */
export const createServerClient = () => {
  const cookieStore = cookies();
  
  return createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });
};

/**
 * Alias for createServerClient for backward compatibility
 */
export const createClient = createServerClient;

/**
 * Gets a user's profile from the database
 * @param userId The user ID to get the profile for
 * @returns The user's profile data or null if not found
 */
export const getUserProfile = async (userId: string) => {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception fetching user profile:', error);
    return null;
  }
};

/**
 * Checks if public access is enabled in the database
 * @returns Whether public access is enabled
 */
export const isPublicAccessEnabled = async () => {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'public_access_enabled')
      .single();
    
    if (error || !data) {
      return process.env.NEXT_PUBLIC_ENABLE_PUBLIC_ACCESS === 'true';
    }
    
    return data.value === 'true';
  } catch (error) {
    console.error('Error checking public access:', error);
    return process.env.NEXT_PUBLIC_ENABLE_PUBLIC_ACCESS === 'true';
  }
};

/**
 * Enables public access in the database
 * @returns Success status and any error message
 */
export const enablePublicAccess = async () => {
  try {
    const supabase = createServerClient();
    
    // Check if the setting exists
    const { data: existingData } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', 'public_access_enabled')
      .single();
    
    if (existingData) {
      // Update existing setting
      const { error } = await supabase
        .from('system_settings')
        .update({ value: 'true' })
        .eq('key', 'public_access_enabled');
      
      if (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Insert new setting
      const { error } = await supabase
        .from('system_settings')
        .insert({ key: 'public_access_enabled', value: 'true' });
      
      if (error) {
        return { success: false, error: error.message };
      }
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error enabling public access:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};

/**
 * Disables public access in the database
 * @returns Success status and any error message
 */
export const disablePublicAccess = async () => {
  try {
    const supabase = createServerClient();
    
    const { error } = await supabase
      .from('system_settings')
      .update({ value: 'false' })
      .eq('key', 'public_access_enabled');
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error disabling public access:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};
