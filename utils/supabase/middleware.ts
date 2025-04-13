import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Clone the request headers
  const requestHeaders = new Headers(request.headers)
  
  // Create a new response
  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

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
          
          // Also set it in the request so server components can access it
          requestHeaders.set('cookie', `${name}=${value}; ${request.headers.get('cookie') || ''}`)
        },
        remove(name: string, options: CookieOptions) {
          // Remove cookie from the browser
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
          
          // Also update the request headers
          requestHeaders.set('cookie', request.headers.get('cookie')?.replace(
            new RegExp(`${name}=([^;]+);? ?`), ''
          ) || '')
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
  const { data: { user } } = await supabase.auth.getUser()
  
  // If user is not found but we have auth cookies, clear them to prevent loops
  if (!user) {
    const authCookie = request.cookies.get('sb-giwurfpxxktfsdyitgvr-auth-token')
    if (authCookie) {
      response.cookies.set({
        name: 'sb-giwurfpxxktfsdyitgvr-auth-token',
        value: '',
        maxAge: 0,
        path: '/',
      })
    }
  }

  return response
}