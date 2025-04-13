import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/supabase'

export async function updateSession(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const isAuthPage = requestUrl.pathname.startsWith('/auth')
  const isCallback = requestUrl.pathname === '/auth/callback'

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Get auth tokens from cookies
  const accessToken = request.cookies.get('sb-auth-token')?.value
  const refreshToken = request.cookies.get('sb-refresh-token')?.value

  console.log('Middleware: Checking auth tokens:', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    path: requestUrl.pathname
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
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
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
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
    // Get user session
    const { data: { session }, error } = await supabase.auth.getSession()

    console.log('Middleware: Session check result:', {
      hasSession: !!session,
      error: error?.message || 'none',
      path: requestUrl.pathname
    })

    // Handle auth pages
    if (isAuthPage) {
      if (session && !isCallback) {
        // If user is signed in and the current path starts with /auth
        // redirect the user to /dashboard/orders
        return NextResponse.redirect(new URL('/dashboard/orders', request.url))
      }
      return response
    }

    // Check auth status for non-auth pages
    if (!session && !isAuthPage) {
      // If user is not signed in and the current path is not /auth,
      // redirect the user to /auth/signin
      const redirectUrl = `${requestUrl.origin}/auth/signin?redirect=${encodeURIComponent(requestUrl.pathname)}`
      return NextResponse.redirect(redirectUrl)
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, redirect to signin
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
}