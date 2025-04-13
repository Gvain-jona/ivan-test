import { createClient } from '@/app/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')
  const next = requestUrl.searchParams.get('next') || '/dashboard/orders'

  // Default redirect path
  let redirectPath = next

  // If there's an error in the URL parameters, redirect to sign-in with the error message
  if (error) {
    const errorMessage = error_description || 'Authentication error'
    return NextResponse.redirect(
      new URL(`/auth/signin?error=${encodeURIComponent(errorMessage)}&redirect=${encodeURIComponent(next)}`, requestUrl.origin),
      { status: 303 }
    )
  }

  // If we have a code, exchange it for a session
  if (code) {
    try {
      const supabase = await createClient()

      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Error exchanging code for session:', error.message)
        return NextResponse.redirect(
          new URL(`/auth/signin?error=${encodeURIComponent('Invalid or expired login link')}&redirect=${encodeURIComponent(next)}`, requestUrl.origin),
          { status: 303 }
        )
      }

      if (data?.user) {
        // Check if user has a profile
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .single()

          if (profileError && profileError.code === 'PGRST116') { // No rows returned
            // Create a new profile for the user
            try {
              // Check if the user is in the allowed_emails table and get their role
              const { data: allowedEmail, error: allowedEmailError } = await supabase
                .from('allowed_emails')
                .select('role')
                .eq('email', data.user.email)
                .maybeSingle()

              // Use the role from allowed_emails if available, otherwise default to 'staff'
              const userRole = allowedEmail?.role || 'staff'

              // Profile doesn't exist, create it
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: data.user.id,
                  email: data.user.email,
                  full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
                  role: userRole, // Use role from allowed_emails
                  status: 'active'
                })

              if (insertError) {
                console.error('Error creating profile:', insertError.message)
              }
            } catch (insertError) {
              console.error('Exception creating profile in callback:', insertError)
            }
          }
        } catch (error) {
          console.error('Exception checking user profile in callback:', error)
        }
      }
    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
      return NextResponse.redirect(
        new URL(`/auth/signin?error=${encodeURIComponent('An unexpected error occurred')}&redirect=${encodeURIComponent(next)}`, requestUrl.origin),
        { status: 303 }
      )
    }
  }

  // Use a 303 redirect to ensure the browser uses GET for the redirect
  // Use the origin from the request URL to ensure we're redirecting to the correct domain
  const origin = requestUrl.origin;
  console.log(`Redirecting to ${redirectPath} with origin ${origin}`);
  return NextResponse.redirect(new URL(redirectPath, origin), { status: 303 })
}
