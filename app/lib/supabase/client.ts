import { createBrowserClient } from '@supabase/ssr'
import { type SupabaseClient } from '@supabase/supabase-js'

// Singleton instance
let supabaseInstance: SupabaseClient | null = null

/**
 * Creates a Supabase client for database operations
 * Uses a singleton pattern to prevent multiple instances
 */
export function createClient() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Log the Supabase URL and key to verify they're being loaded correctly
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Loaded' : 'Not loaded')

  // Create a browser client that properly handles cookies
  // We don't need to specify cookies options as it will use document.cookie API automatically
  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    }
  )

  return supabaseInstance
}