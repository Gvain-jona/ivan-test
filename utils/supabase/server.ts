import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '../../types/supabase'

/**
 * Creates a Supabase client for server components
 * This client is used for server-side operations and handles cookies
 */
export const createClient = () => {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookies().set(name, value, options)
          } catch (error) {
            // Handle cookies.set error in server components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookies().set(name, '', { ...options, maxAge: 0 })
          } catch (error) {
            // Handle cookies.remove error in server components
          }
        },
      },
    }
  )
}