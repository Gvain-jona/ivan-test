import { createClient } from '@/app/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  console.log('Auth callback route triggered')
  const requestUrl = new URL(request.url)
  console.log('Request URL:', request.url)

  const code = requestUrl.searchParams.get('code')
  console.log('Code present:', !!code)

  const next = requestUrl.searchParams.get('next') || ''
  console.log('Next parameter:', next)

  // Default redirect path
  let redirectPath = '/auth/setup-pin'

  if (code) {
    const supabase = createClient()
    console.log('Exchanging code for session...')
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error)
      // If there's an error, redirect to sign-in with error message
      return NextResponse.redirect(
        new URL(`/auth/signin?error=${encodeURIComponent('Invalid or expired magic link')}`, requestUrl.origin)
      )
    } else {
      console.log('Session exchange successful, user:', data.user ? `ID: ${data.user.id}` : 'No user')
    }

    if (data.user) {
      // Check if user has a profile and PIN set up
      try {
        console.log('Checking if user has a profile...')
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('pin, is_verified')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
        } else {
          console.log('Profile found:', profile ? `PIN: ${profile.pin ? 'Set' : 'Not set'}, Verified: ${profile.is_verified}` : 'No profile')
        }

        if (profileError) {
          // If the profile doesn't exist, we need to create it
          if (profileError.code === 'PGRST116') { // No rows returned
            console.log('Profile not found in callback, creating new profile')

            try {
              // Create a new profile for the user
              console.log('Creating new profile with ID:', data.user.id)

              // First, check if the profile already exists (double-check)
              const { data: existingProfile, error: checkError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .maybeSingle()

              if (existingProfile) {
                console.log('Profile already exists in callback, using existing profile')
              } else {
                // Check if the user is in the allowed_emails table and get their role
                const { data: allowedEmail, error: allowedEmailError } = await supabase
                  .from('allowed_emails')
                  .select('role')
                  .eq('email', data.user.email)
                  .maybeSingle()

                // Use the role from allowed_emails if available, otherwise default to 'staff'
                const userRole = allowedEmail?.role || 'staff'
                console.log(`Using role from allowed_emails: ${userRole} for user ${data.user.email}`)

                // Profile doesn't exist, create it
                const { error: insertError } = await supabase
                  .from('profiles')
                  .insert({
                    id: data.user.id,
                    email: data.user.email,
                    full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
                    role: userRole, // Use role from allowed_emails
                    status: 'active',
                    is_verified: false, // They need to set up a PIN
                    failed_attempts: 0
                  })

                // We don't need to set an auth_session cookie manually anymore
                // The Supabase client will handle this for us through the exchangeCodeForSession call

                if (insertError) {
                  console.error('Error creating profile in callback:', insertError)
                } else {
                  console.log('Created new profile in callback')
                }
              }
            } catch (insertError) {
              console.error('Exception creating profile in callback:', insertError)
            }

            // Always redirect to setup-pin for new profiles
            redirectPath = '/auth/setup-pin'
          } else {
            console.error('Error checking user profile in callback:', profileError)
            // If there's an error, default to setup-pin
            redirectPath = '/auth/setup-pin'
          }
        } else {
          // If user has a PIN, redirect to verify-pin, otherwise to setup-pin
          if (profile?.pin) {
            redirectPath = '/auth/verify-pin'
          } else {
            redirectPath = '/auth/setup-pin'
          }
        }
      } catch (error) {
        console.error('Exception checking user profile in callback:', error)
        // If there's an error, default to setup-pin
        redirectPath = '/auth/setup-pin'
      }
    }
  }

  // Add the next parameter if it exists
  if (next) {
    redirectPath += `?redirect=${encodeURIComponent(next)}`
  }

  console.log('Final redirect path:', redirectPath)

  // Use a 303 redirect to ensure the browser uses GET for the redirect
  // This helps prevent the browser from resubmitting the form when using the back button
  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin), { status: 303 })
}
