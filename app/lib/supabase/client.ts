import { createBrowserClient } from '@supabase/ssr'
import { type SupabaseClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client for database operations
 * Creates a new instance each time to prevent cross-instance contamination
 */
export function createClient() {
  // Log the Supabase URL and key to verify they're being loaded correctly (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Loaded' : 'Not loaded')
  }

  // Create a new browser client each time
  // This prevents cross-instance contamination
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: {
          getItem: (key) => {
            if (typeof window === 'undefined') return null
            return window.localStorage.getItem(key)
          },
          setItem: (key, value) => {
            if (typeof window === 'undefined') return
            window.localStorage.setItem(key, value)
            // Also set a fallback cookie for middleware
            document.cookie = `sb-${key}=${value}; path=/; max-age=604800; secure; samesite=lax`
          },
          removeItem: (key) => {
            if (typeof window === 'undefined') return
            window.localStorage.removeItem(key)
            // Remove fallback cookie as well
            document.cookie = `sb-${key}=; path=/; max-age=0; secure; samesite=lax`
          }
        }
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      global: {
        headers: {
          'X-Client-Info': 'ivan-prints-web'
        }
      }
    }
  )
}