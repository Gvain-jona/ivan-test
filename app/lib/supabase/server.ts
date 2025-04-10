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

export async function createClient() {
  // If we already have a cached client, return it
  // This is safe because the client is stateless and only uses cookies for auth
  if (cachedClient) {
    return cachedClient;
  }

  // Log the Supabase URL and key to verify they're being loaded correctly
  // Only log this when creating a new client to reduce console noise
  console.log('Server Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('Server Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Loaded' : 'Not loaded')

  const cookieStore = cookies()

  // Create a server client that properly handles cookies
  cachedClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  return cachedClient;
}