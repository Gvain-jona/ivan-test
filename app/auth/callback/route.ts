import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '../../../types/supabase'
import { getBaseUrl } from '@/app/lib/auth/session-utils'
import { getCodeVerifierCookieName, getAllAuthCookieNames } from '@/app/lib/auth/cookie-utils'
import { createClient } from '../../../utils/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

/**
 * Auth callback route handler
 * Processes authentication callbacks from Supabase (magic links, OAuth)
 * Following Supabase's recommended pattern for Next.js App Router
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Log all search parameters to debug what's coming in
    console.log('Auth callback received with params:', Object.fromEntries(searchParams.entries()))

    // Check for OAuth state and code
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    // Check for email confirmation
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null

    // Get the redirect path
    const next = searchParams.get('next') || '/dashboard/orders'

    // Create Supabase client
    const supabase = await createClient()

    // Handle OAuth callback (including Google)
    if (code && state) {
      console.log('Processing OAuth callback')

      try {
        // Exchange the code for a session
        const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

        if (sessionError) {
          throw sessionError
        }

        // Get the session to verify everything worked
        const { data: { session }, error: getSessionError } = await supabase.auth.getSession()

        if (getSessionError) {
          throw getSessionError
        }

        if (!session) {
          throw new Error('Failed to get session after OAuth callback')
        }

        // Log successful authentication
        console.log('OAuth authentication successful:', {
          provider: session.user?.app_metadata?.provider,
          userId: session.user?.id,
          email: session.user?.email
        })

      } catch (error) {
        console.error('Error in OAuth callback:', error)
        return NextResponse.redirect(
          `${getBaseUrl()}/auth/error?error=${encodeURIComponent(
            error instanceof Error ? error.message : 'Authentication failed'
          )}`
        )
      }
    }
    // Handle email confirmation
    else if (token_hash && type) {
      console.log('Processing token_hash flow')

      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      })

      if (error) {
        console.error('Error verifying OTP:', error)
        return NextResponse.redirect(
          `${getBaseUrl()}/auth/error?error=${encodeURIComponent(error.message)}`
        )
      }
    }
    // Handle code flow (magic link)
    else if (code) {
      console.log('Processing code flow')

      // Get the cookie name for the code verifier
      const cookieName = getCodeVerifierCookieName()
      console.log('Looking for cookie:', cookieName)

      let codeVerifier: string | undefined;

      try {
        // In Next.js 15, cookies() is asynchronous in App Router
        const cookieStore = await cookies()
        codeVerifier = cookieStore.get(cookieName)?.value

        // Log all available auth cookies for debugging
        const allAuthCookies = getAllAuthCookieNames()
        const availableCookies = await cookieStore.getAll()
        const cookieNames = availableCookies.map((c: any) => c.name)
        console.log('All auth cookies:', allAuthCookies)
        console.log('Available cookies:', cookieNames)
        console.log('Code verifier cookie present:', !!codeVerifier)
      } catch (cookieError) {
        console.error('Error accessing cookies:', cookieError)
        // Continue anyway - the Supabase client will handle missing cookies
      }

      // If code verifier is missing, redirect to sign-in with an error
      if (!codeVerifier) {
        console.error('Code verifier cookie is missing')
        return NextResponse.redirect(
          `${getBaseUrl()}/auth/error?error=${encodeURIComponent('Authentication session expired or invalid. Please try signing in again.')}`
        )
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(
          `${getBaseUrl()}/auth/error?error=${encodeURIComponent(error.message)}`
        )
      }
    }
    // No valid auth parameters
    else {
      console.error('No valid authentication parameters found')
      return NextResponse.redirect(
        `${getBaseUrl()}/auth/error?error=${encodeURIComponent('Invalid authentication link')}`
      )
    }

    // If we get here, authentication was successful

    // Ensure the next path is properly formatted
    const formattedNext = next.startsWith('/') ? next : `/${next}`

    // Get the environment-specific base URL
    const baseUrl = getBaseUrl()

    // Construct the full redirect URL
    const redirectUrl = `${baseUrl}${formattedNext}`

    // Redirect to the requested page or default dashboard
    console.log('Auth successful, redirecting to:', redirectUrl)

    // Use Next.js redirect for server components as recommended by Supabase
    return redirect(redirectUrl)
  } catch (error) {
    console.error('Exception in auth callback:', error)
    return NextResponse.redirect(
      `${getBaseUrl()}/auth/error?error=${encodeURIComponent('An unexpected error occurred')}`
    )
  }
}
