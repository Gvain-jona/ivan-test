import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '../../types/supabase'

/**
 * Creates a Supabase client for server components
 * This client is used for server-side operations and handles cookies
 * Following Supabase's recommended pattern for Next.js App Router
 * https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export const createClient = () => {
  const isProduction = process.env.NODE_ENV === 'production'
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // In Next.js 14+, cookies() is synchronous
          return cookies().get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // Add secure, sameSite, and path options for better security and compatibility
            cookies().set(name, value, {
              ...options,
              secure: isProduction, // Only use secure in production
              sameSite: 'lax', // Use lax for better compatibility
              path: '/' // Ensure cookies are available across the site
            })
          } catch (error) {
            console.error('Error setting cookie in server component:', error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            // Add secure, sameSite, and path options for better security and compatibility
            cookies().set(name, '', {
              ...options,
              maxAge: 0,
              secure: isProduction, // Only use secure in production
              sameSite: 'lax', // Use lax for better compatibility
              path: '/' // Ensure cookies are available across the site
            })
          } catch (error) {
            console.error('Error removing cookie in server component:', error)
          }
        },
      },
    }
  )
}