import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/supabase'

export async function updateSession(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const isAuthPage = requestUrl.pathname.startsWith('/auth')
  const isCallback = requestUrl.pathname === '/auth/callback'

  console.log('Middleware: Processing request:', {
    url: requestUrl.pathname,
    isAuthPage,
    isCallback
  })

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Get auth data from cookies
  const authCookie = request.cookies.get('sb-auth')?.value
  let session = null

  try {
    if (authCookie) {
      console.log('Middleware: Found sb-auth cookie')
      const parsedAuth = JSON.parse(authCookie)
      if (parsedAuth?.access_token) {
        session = parsedAuth
        console.log('Middleware: Parsed valid session from cookie')
      }
    }
  } catch (error) {
    console.error('Middleware: Error parsing auth cookie:', error)
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = request.cookies.get(name)
          console.log('Middleware: Cookie get:', { name, value: cookie?.value ? 'present' : 'none' })
          return cookie?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          console.log('Middleware: Cookie set:', { name, options })
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
          console.log('Middleware: Cookie remove:', { name, options })
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
    // If we have a session from the cookie, set it in Supabase
    if (session?.access_token) {
      console.log('Middleware: Setting session from cookie')
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token || ''
      })
    }

    // Verify the session with Supabase
    const { data: { session: supabaseSession }, error } = await supabase.auth.getSession()

    console.log('Middleware: Session verification result:', {
      hasSession: !!supabaseSession,
      error: error?.message || 'none',
      path: requestUrl.pathname
    })

    // Handle auth pages (signin, signup, etc.)
    if (isAuthPage) {
      if (supabaseSession && !isCallback) {
        console.log('Middleware: Redirecting authenticated user from auth page to dashboard')
        return NextResponse.redirect(new URL('/dashboard/orders', request.url))
      }
      console.log('Middleware: Allowing access to auth page')
      return response
    }

    // Handle protected pages
    if (!supabaseSession) {
      console.log('Middleware: No valid session, redirecting to signin')
      const redirectUrl = new URL('/auth/signin', request.url)
      redirectUrl.searchParams.set('redirect', requestUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Update cookies with the verified session
    console.log('Middleware: Updating cookies with verified session')
    response.cookies.set('sb-auth', JSON.stringify({
      access_token: supabaseSession.access_token,
      refresh_token: supabaseSession.refresh_token,
      expires_at: supabaseSession.expires_at,
      user: supabaseSession.user,
      token_type: supabaseSession.token_type
    }), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    })

    console.log('Middleware: Request processing complete')
    return response
  } catch (error) {
    console.error('Middleware: Error processing request:', error)
    const redirectUrl = new URL('/auth/signin', request.url)
    redirectUrl.searchParams.set('error', 'Session verification failed')
    return NextResponse.redirect(redirectUrl)
  }
}