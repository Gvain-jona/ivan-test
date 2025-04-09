import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// We don't use a singleton for server-side because each request needs its own instance
// due to potential cookie handling differences between requests

/**
 * Creates a Supabase client for server-side database operations
 * Properly handles cookies for authentication
 *
 * @returns A Supabase client for server use
 */
export function createClient() {
  // Log the Supabase URL and key to verify they're being loaded correctly
  console.log('Server Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('Server Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Loaded' : 'Not loaded')

  // Get the cookies from the request
  const cookieStore = cookies()

  // Create a server client that properly handles cookies
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // This will throw in middleware, but we can safely ignore it
            console.error('Error setting cookie in middleware:', error)
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // This will throw in middleware, but we can safely ignore it
            console.error('Error removing cookie in middleware:', error)
          }
        },
        // Add the required getAll and setAll methods
        getAll() {
          return cookieStore.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }))
        },
        setAll(cookies) {
          try {
            cookies.forEach((cookie) => {
              cookieStore.set(cookie)
            })
          } catch (error) {
            console.error('Error setting multiple cookies in middleware:', error)
          }
        },
      },
    }
  )
}