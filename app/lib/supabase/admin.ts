/**
 * Utility for setting up admin users with service role privileges
 */

import { createClient } from '@supabase/supabase-js';

// Create a supabase client with the service role key
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Initialize default admin user
 * @param email Admin user email
 */
export async function initializeAdminUser(email: string) {
  try {
    console.log(`Initializing admin user: ${email}`);

    // Check if user already exists
    const { data: existingUser, error: checkError } = await adminClient.auth.admin.getUserByEmail(email);

    if (checkError) {
      throw checkError;
    }

    // If user exists, don't recreate
    if (existingUser) {
      console.log(`✓ Admin user already exists: ${email}`);

      // Ensure user has admin role in the profile table
      const { error: updateError } = await adminClient
        .from('profiles')
        .upsert({
          id: existingUser.id,
          email,
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (updateError) {
        console.error('Error updating user profile:', updateError);
      }

      return { success: true, userId: existingUser.id };
    }

    // Create a new admin user
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password: pin, // This will be replaced with PIN-based auth
      email_confirm: true, // Auto-confirm email for admin
      user_metadata: {
        role: 'admin'
      },
    });

    if (error) {
      throw error;
    }

    console.log(`✅ Created admin user: ${email}`);

    // Store user role in profiles table
    if (data?.user) {
      const { error: profileError } = await adminClient
        .from('profiles')
        .insert({
          id: data.user.id,
          email,
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
      }
    }

    return { success: true, userId: data?.user?.id };
  } catch (error) {
    console.error('Failed to initialize admin user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}