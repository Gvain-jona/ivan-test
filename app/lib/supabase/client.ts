import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client for database operations
 * Creates a singleton instance to prevent cross-instance contamination
 */
let supabaseClientInstance: ReturnType<typeof createSupabaseClient> | null = null

export function createClient(): SupabaseClient {
  if (supabaseClientInstance) {
    return supabaseClientInstance
  }

  // Log the Supabase URL and key to verify they're being loaded correctly (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Loaded' : 'Not loaded')
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Create a new browser client
  supabaseClientInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: 'sb-auth',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
      flowType: 'pkce',
      debug: true, // Enable debug for all environments temporarily
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web'
      }
    }
  })

  return supabaseClientInstance
}