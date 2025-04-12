import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server-api'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/app/lib/utils/cookies'

/**
 * API endpoint to check if the user is authenticated and PIN is verified
 * This is needed because we can't check httpOnly cookies on the client side
 */
export async function GET(request: NextRequest) {
  try {
    // Create a Supabase server client
    let supabase;
    try {
      // Add detailed logging
      console.log('Creating Supabase client for check-session...')
      console.log('Environment variables present:', {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      })

      supabase = await createClient()

      if (!supabase) {
        console.error('Supabase client is null or undefined')
        return NextResponse.json({
          authenticated: false,
          user: null,
          pinVerified: false,
          error: 'Supabase client creation failed',
          timestamp: new Date().toISOString()
        }, { status: 500 })
      }

      console.log('Supabase client created successfully:', !!supabase)
    } catch (clientError) {
      console.error('Error creating Supabase client:', clientError)
      return NextResponse.json({
        authenticated: false,
        user: null,
        pinVerified: false,
        error: `Failed to create Supabase client: ${clientError.message || 'Unknown error'}`,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    // Get the user session
    let session;
    try {
      console.log('Getting session from Supabase...')

      if (!supabase.auth) {
        console.error('Supabase auth is undefined')
        return NextResponse.json({
          authenticated: false,
          user: null,
          pinVerified: false,
          error: 'Supabase auth is undefined',
          timestamp: new Date().toISOString()
        }, { status: 500 })
      }

      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Error in getSession response:', error)
        return NextResponse.json({
          authenticated: false,
          user: null,
          pinVerified: false,
          error: `Session error: ${error.message}`,
          timestamp: new Date().toISOString()
        }, { status: 500 })
      }

      session = data.session
      console.log('Session retrieved successfully:', !!session)
    } catch (sessionError) {
      console.error('Exception getting session:', sessionError)
      return NextResponse.json({
        authenticated: false,
        user: null,
        pinVerified: false,
        error: `Failed to get session: ${sessionError.message || 'Unknown error'}`,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    // Get the PIN verified cookie
    let pinVerified = false;
    try {
      console.log('Checking PIN verification status...')
      const cookieStore = cookies()
      const pinVerifiedCookie = await cookieStore.get(COOKIE_NAMES.PIN_VERIFIED)
      const pinIndicatorCookie = await cookieStore.get(COOKIE_NAMES.PIN_VERIFIED + '_indicator')
      pinVerified = pinVerifiedCookie?.value === 'true' || pinIndicatorCookie?.value === 'true'
      console.log('PIN verification status:', {
        mainCookieExists: !!pinVerifiedCookie,
        mainCookieValue: pinVerifiedCookie?.value,
        indicatorCookieExists: !!pinIndicatorCookie,
        indicatorCookieValue: pinIndicatorCookie?.value,
        verified: pinVerified
      })
    } catch (cookieError) {
      console.error('Error accessing cookies:', cookieError)
      // Continue with pinVerified = false
    }

    // Check for inconsistencies
    let hasSession = false;
    let hasAuthCookie = false;
    let cookieName = '';

    try {
      hasSession = !!session?.user;

      // Safely construct the cookie name
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const urlParts = process.env.NEXT_PUBLIC_SUPABASE_URL.split('//');
        if (urlParts.length > 1) {
          const domainParts = urlParts[1].split('.');
          if (domainParts.length > 0) {
            cookieName = 'sb-' + domainParts[0] + '-auth-token';
          }
        }
      }

      if (!cookieName) {
        console.error('Could not construct auth cookie name from URL');
        cookieName = 'sb-auth-token'; // Fallback
      }

      hasAuthCookie = request.cookies.has(cookieName);

      // Log inconsistencies in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('Session check results:')
        console.log('- Cookie name:', cookieName)
        console.log('- Supabase session:', hasSession)
        console.log('- Auth cookie:', hasAuthCookie)

        if (hasSession !== hasAuthCookie) {
          console.log('⚠️ Session inconsistency detected!')
        }
      }
    } catch (error) {
      console.error('Error checking session consistency:', error);
      // Continue with default values
    }

    // Prepare the response
    const responseData = {
      authenticated: hasSession,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
      } : null,
      pinVerified,
      pinVerifiedCookie: !!request.cookies.get(COOKIE_NAMES.PIN_VERIFIED),
      pinIndicatorCookie: !!request.cookies.get(COOKIE_NAMES.PIN_VERIFIED + '_indicator'),
      sessionConsistent: hasSession === hasAuthCookie,
      timestamp: new Date().toISOString()
    };

    console.log('Returning auth status:', {
      authenticated: responseData.authenticated,
      hasUser: !!responseData.user,
      pinVerified: responseData.pinVerified,
      sessionConsistent: responseData.sessionConsistent
    });

    // Return the result with consistency information
    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error checking authentication:', error)
    return NextResponse.json({
      authenticated: false,
      user: null,
      pinVerified: false,
      error: `Failed to check authentication: ${error.message || 'Unknown error'}`,
      timestamp: new Date().toISOString(),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
