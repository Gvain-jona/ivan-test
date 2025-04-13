import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../../../types/supabase'

/**
 * Creates a Supabase client for browser/client components
 * This client is used in client components and automatically handles cookies
 */
let supabaseClientInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (supabaseClientInstance) {
    return supabaseClientInstance
  }

  // Log the Supabase URL and key to verify they're being loaded correctly (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Loaded' : 'Not loaded')
  }

  // Create a new browser client
  supabaseClientInstance = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return supabaseClientInstance
}