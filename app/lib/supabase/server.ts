import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for server-side database operations
 * Properly handles cookies for authentication
 *
 * @returns A Supabase client for server use
 */
// Cache the client to avoid creating a new one for every request
// This helps reduce the number of connections and improves performance
let cachedClient: ReturnType<typeof createServerClient> | null = null;
let lastClientCreationTime = 0;

// Refresh the client every 30 minutes to prevent stale connections
const CLIENT_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

export async function createClient() {
  const now = Date.now();

  // If we have a cached client and it's not too old, return it
  if (cachedClient && (now - lastClientCreationTime) < CLIENT_REFRESH_INTERVAL) {
    return cachedClient;
  }

  // Only log in development to reduce noise in production
  if (process.env.NODE_ENV === 'development') {
    console.log('Creating new server Supabase client')
  }

  let cookieStore;
  try {
    // Use await with cookies() as it's now async in Next.js 15
    cookieStore = await cookies();
  } catch (error) {
    console.error('Error accessing cookies:', error);
    // If we can't access cookies, create a client without cookie handling
    cachedClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: false }
    );
    lastClientCreationTime = now;
    return cachedClient;
  }

  try {
    // Create a server client that properly handles cookies
    cachedClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            // No need for async/await here since we already awaited cookies() above
            const cookie = cookieStore.get(name)
            return cookie?.value
          },
          set(name, value, options) {
            try {
              cookieStore.set(name, value, options)
            } catch (error) {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
              console.error('Error setting cookie:', error)
            }
          },
          remove(name, options) {
            try {
              cookieStore.delete(name, options)
            } catch (error) {
              // The `remove` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
              console.error('Error removing cookie:', error)
            }
          },
        },
      }
    )

    // Update the last creation time
    lastClientCreationTime = now;

    return cachedClient;
  } catch (error) {
    console.error('Error creating Supabase client:', error);

    // If we have a cached client, return it as a fallback
    if (cachedClient) {
      console.log('Using cached client as fallback');
      return cachedClient;
    }

    // Otherwise, rethrow the error
    throw error;
  }
}