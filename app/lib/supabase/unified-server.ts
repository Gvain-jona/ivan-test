'use server';

/**
 * Unified Supabase Client for Server Usage
 *
 * This file provides a standardized way to create Supabase clients
 * for server-side usage throughout the application.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/app/types/database';

// Cache the client to avoid creating a new one for every request
// This helps reduce the number of connections and improves performance
let cachedClient: ReturnType<typeof createServerClient> | null = null;

// Custom cookie names for our authentication
const CUSTOM_AUTH_COOKIE = 'ivan-auth-token';
const SUPABASE_AUTH_COOKIE_PREFIX = 'sb-';

/**
 * Creates a Supabase client for server-side database operations
 * Properly handles cookies for authentication
 *
 * @returns A Supabase client for server use
 */
export async function createClient() {
  try {
    // If we already have a cached client, return it
    // This is safe because the client is stateless and only uses cookies for auth
    if (cachedClient) {
      return cachedClient;
    }

    // Verify environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase URL or Key is missing in environment variables');
      throw new Error('Supabase configuration is missing');
    }

    // Get the cookies store - use await with cookies() as it's now async in Next.js 15
    const cookieStore = await cookies();

    // Create a server client that properly handles cookies
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Extract the project name from the URL for the cookie name
    const projectName = supabaseUrl.split('//')[1].split('.')[0];

    // Check if public access is enabled
    const isPublicAccessEnabled = process.env.NEXT_PUBLIC_ENABLE_PUBLIC_ACCESS === 'true';

    // Create the Supabase client
    cachedClient = createServerClient<Database>(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          get(name) {
            // First try to get the standard Supabase cookie
            const cookieValue = cookieStore.get(name)?.value;

            // If we're looking for an auth cookie and it's not found, check our custom cookie
            if (!cookieValue && name.startsWith(SUPABASE_AUTH_COOKIE_PREFIX) && name.includes('access-token')) {
              const customToken = cookieStore.get(CUSTOM_AUTH_COOKIE)?.value;
              if (customToken) {
                return customToken;
              }
            }

            // If public access is enabled and no auth cookie is found, we might want to
            // handle this differently (e.g., return a default token or null)
            if (!cookieValue && isPublicAccessEnabled && name.includes('access-token')) {
              console.log('Public access mode: No auth token found, proceeding with anonymous access');
              return null;
            }

            return cookieValue;
          },
          set(name, value, options) {
            try {
              cookieStore.set({ name, value, ...options });

              // If we're setting an auth token, also set our custom cookie
              if (name.startsWith(SUPABASE_AUTH_COOKIE_PREFIX) && name.includes('access-token')) {
                cookieStore.set({
                  name: CUSTOM_AUTH_COOKIE,
                  value,
                  path: '/',
                  maxAge: options?.maxAge || 3600,
                  sameSite: 'lax'
                });
              }
            } catch (error) {
              // This will throw in middleware, but we can safely ignore it
              console.error(`Error setting cookie ${name}:`, error);
            }
          },
          remove(name, options) {
            try {
              cookieStore.set({ name, value: '', ...options, maxAge: 0 });

              // If we're removing an auth token, also remove our custom cookie
              if (name.startsWith(SUPABASE_AUTH_COOKIE_PREFIX) && name.includes('access-token')) {
                cookieStore.set({
                  name: CUSTOM_AUTH_COOKIE,
                  value: '',
                  path: '/',
                  maxAge: 0,
                  sameSite: 'lax'
                });
              }
            } catch (error) {
              // This will throw in middleware, but we can safely ignore it
              console.error(`Error removing cookie ${name}:`, error);
            }
          }
        }
      }
    );

    return cachedClient;
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw error;
  }
}

/**
 * Create a Supabase client for server-side use with the provided cookie store
 * This is useful when you already have a cookie store from a previous cookies() call
 *
 * @param cookieStore - The cookie store to use
 * @returns A Supabase client for server use
 */
export async function createServerClientWithCookies(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  try {
    // Verify environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase URL or Key is missing in environment variables');
      throw new Error('Supabase configuration is missing');
    }

    // Get the environment variables directly
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Check if public access is enabled
    const isPublicAccessEnabled = process.env.NEXT_PUBLIC_ENABLE_PUBLIC_ACCESS === 'true';

    // Create the Supabase client
    return createServerClient<Database>(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          get(name) {
            // First try to get the standard Supabase cookie
            const cookieValue = cookieStore.get(name)?.value;

            // If we're looking for an auth cookie and it's not found, check our custom cookie
            if (!cookieValue && name.startsWith(SUPABASE_AUTH_COOKIE_PREFIX) && name.includes('access-token')) {
              const customToken = cookieStore.get(CUSTOM_AUTH_COOKIE)?.value;
              if (customToken) {
                return customToken;
              }
            }

            // If public access is enabled and no auth cookie is found, we might want to
            // handle this differently (e.g., return a default token or null)
            if (!cookieValue && isPublicAccessEnabled && name.includes('access-token')) {
              console.log('Public access mode: No auth token found, proceeding with anonymous access');
              return null;
            }

            return cookieValue;
          },
          set(name, value, options) {
            try {
              cookieStore.set({ name, value, ...options });

              // If we're setting an auth token, also set our custom cookie
              if (name.startsWith(SUPABASE_AUTH_COOKIE_PREFIX) && name.includes('access-token')) {
                cookieStore.set({
                  name: CUSTOM_AUTH_COOKIE,
                  value,
                  path: '/',
                  maxAge: options?.maxAge || 3600,
                  sameSite: 'lax'
                });
              }
            } catch (error) {
              // This can happen in middleware when the cookies are readonly
              console.error(`Error setting cookie ${name}:`, error);
            }
          },
          remove(name, options) {
            try {
              cookieStore.set({ name, value: '', ...options, maxAge: 0 });

              // If we're removing an auth token, also remove our custom cookie
              if (name.startsWith(SUPABASE_AUTH_COOKIE_PREFIX) && name.includes('access-token')) {
                cookieStore.set({
                  name: CUSTOM_AUTH_COOKIE,
                  value: '',
                  path: '/',
                  maxAge: 0,
                  sameSite: 'lax'
                });
              }
            } catch (error) {
              // This can happen in middleware when the cookies are readonly
              console.error(`Error removing cookie ${name}:`, error);
            }
          }
        }
      }
    );
  } catch (error) {
    console.error('Error creating Supabase server client:', error);
    throw error;
  }
}
