import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '../../../types/supabase'
import { getBaseUrl } from '@/app/lib/auth/session-utils'
import { createClient } from '../../../utils/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'

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
    
    // Check for token_hash (used in email confirmation)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    
    // Check for code (used in magic link/OTP)
    const code = searchParams.get('code')
    
    // Get the redirect path
    const next = searchParams.get('next') || '/dashboard/orders'
    
    // Create Supabase client
    const supabase = createClient()
    
    // Handle token_hash flow (email confirmation)
    if (token_hash && type) {
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
      
      // Check if we have the code verifier cookie
      const cookieStore = cookies()
      const codeVerifier = cookieStore.get('sb-giwurfpxxktfsdyitgvr-auth-token-code-verifier')
      
      console.log('Code verifier cookie present:', !!codeVerifier)
      
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
    // Force HTTP for local development to avoid SSL errors
    const baseUrl = getBaseUrl().replace('https://', 'http://')
    
    // Construct the full redirect URL
    const redirectUrl = `${baseUrl}${formattedNext}`
    
    // Redirect to the requested page or default dashboard
    console.log('Auth successful, redirecting to:', redirectUrl)
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Exception in auth callback:', error)
    return NextResponse.redirect(
      `${getBaseUrl()}/auth/error?error=${encodeURIComponent('An unexpected error occurred')}`
    )
  }
}
