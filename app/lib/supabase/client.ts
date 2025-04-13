import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client for database operations
 * Creates a new instance each time to prevent cross-instance contamination
 */
export const createClient = (): SupabaseClient => {
  // Log the Supabase URL and key to verify they're being loaded correctly (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Loaded' : 'Not loaded')
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Create a new browser client each time
  // This prevents cross-instance contamination
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: 'auth',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
      flowType: 'pkce',
    },
  })
}