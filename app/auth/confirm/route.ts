import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '../../../types/supabase'
import { getBaseUrl } from '@/app/lib/auth/session-utils'
import { getAllAuthCookieNames } from '@/app/lib/auth/cookie-utils'
import { createClient } from '../../../utils/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

/**
 * Auth confirmation route handler
 * Processes authentication confirmations from Supabase (email confirmations)
 * Following Supabase's recommended pattern for Next.js App Router
 * https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Log all search parameters to debug what's coming in
    console.log('Auth confirm received with params:', Object.fromEntries(searchParams.entries()))

    // Get token_hash and type from the URL (used in email confirmation)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null

    // Get the redirect path
    const next = searchParams.get('next') || '/dashboard/orders'

    // Create Supabase client
    const supabase = await createClient()

    // Validate required parameters
    if (!token_hash || !type) {
      console.error('Missing required parameters for auth confirmation')
      return NextResponse.redirect(
        `${getBaseUrl()}/auth/error?error=${encodeURIComponent('Invalid confirmation link')}`
      )
    }

    // Log all available auth cookies for debugging
    const cookieStore = await cookies()
    const allAuthCookies = getAllAuthCookieNames()
    const availableCookies = await cookieStore.getAll()
    const cookieNames = availableCookies.map((c: any) => c.name)
    console.log('All auth cookies:', allAuthCookies)
    console.log('Available cookies:', cookieNames)

    // Verify the OTP
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

    // If we get here, authentication was successful

    // Ensure the next path is properly formatted
    const formattedNext = next.startsWith('/') ? next : `/${next}`

    // Get the environment-specific base URL
    const baseUrl = getBaseUrl()

    // Construct the full redirect URL
    const redirectUrl = `${baseUrl}${formattedNext}`

    // Redirect to the requested page or default dashboard
    console.log('Auth confirmation successful, redirecting to:', redirectUrl)

    // Use Next.js redirect for server components as recommended by Supabase
    return redirect(redirectUrl)
  } catch (error) {
    console.error('Exception in auth confirmation:', error)
    return NextResponse.redirect(
      `${getBaseUrl()}/auth/error?error=${encodeURIComponent('An unexpected error occurred')}`
    )
  }
}
