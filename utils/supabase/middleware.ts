import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Create a response object that we'll modify and return
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create a Supabase client for server-side operations
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Set cookie for the browser
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // Remove cookie from the browser
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Check if we're on an auth callback URL
  const url = new URL(request.url)
  const isAuthCallback = url.pathname.includes('/auth/callback') || 
                         url.searchParams.has('token_hash') || 
                         url.searchParams.has('access_token') ||
                         url.searchParams.has('refresh_token')

  if (isAuthCallback) {
    // Don't refresh session on auth callback routes to avoid infinite loops
    return response
  }

  // Refresh session if expired - required for Server Components
  // This sends a request to Supabase to validate the token
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    // If we have a session but it's expired, try to refresh it
    if (session) {
      await supabase.auth.getUser()
    }
  } catch (error) {
    console.error('Error refreshing auth session:', error)
  }

  return response
}