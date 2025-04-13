import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '../../types/supabase'

/**
 * Middleware to handle authentication and session management
 * Runs on every request to check auth status and redirect as needed
 * 
 * This follows Supabase's recommended pattern for Next.js App Router
 * https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function updateSession(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const isAuthPage = requestUrl.pathname.startsWith('/auth')
  const isCallback = requestUrl.pathname === '/auth/callback'
  const isSigninPage = requestUrl.pathname === '/auth/signin'

  // Create a response with the original request headers
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create a Supabase client using the request cookies
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // This is called when Supabase needs to set a cookie
          // We need to set the cookie in both the request and response
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // This is called when Supabase needs to remove a cookie
          // We need to remove the cookie from both the request and response
          request.cookies.delete(name)
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  try {
    // This will refresh the session if needed and set the auth cookies
    // This is the key part of the middleware that keeps the session alive
    const { data } = await supabase.auth.getUser()
    const isAuthenticated = !!data.user

    // Handle auth pages (signin, signup, etc.)
    if (isAuthPage) {
      if (isAuthenticated && !isCallback) {
        // If user is authenticated and trying to access auth pages, redirect to dashboard
        console.log('Middleware: Redirecting authenticated user from auth page to dashboard')
        
        // For signin page, use a more aggressive redirect approach
        if (isSigninPage) {
          return NextResponse.redirect(new URL('/dashboard/orders', request.url), {
            status: 302, // Use 302 for temporary redirect
            headers: {
              'Cache-Control': 'no-store, must-revalidate, max-age=0',
              'Pragma': 'no-cache'
            }
          })
        }
        
        // For other auth pages, use standard redirect
        return NextResponse.redirect(new URL('/dashboard/orders', request.url))
      }
      
      console.log('Middleware: Allowing access to auth page')
      return response
    }

    // Handle protected pages
    if (!isAuthenticated) {
      console.log('Middleware: No valid session, redirecting to signin')
      const redirectUrl = new URL('/auth/signin', request.url)
      redirectUrl.searchParams.set('redirect', requestUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return response
  } catch (error) {
    console.error('Middleware: Error processing request:', error)
    const redirectUrl = new URL('/auth/signin', request.url)
    redirectUrl.searchParams.set('error', 'Session verification failed')
    return NextResponse.redirect(redirectUrl)
  }
}