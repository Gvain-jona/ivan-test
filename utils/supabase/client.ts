import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../../types/supabase'

/**
 * Creates a Supabase client for use in the browser
 * This client is used for client-side components
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}