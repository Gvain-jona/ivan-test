import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '../../../types/supabase'

/**
 * Special route to fix profile RLS issues
 * This route uses the service role key to bypass RLS policies and create a profile
 */
export async function POST(request: NextRequest) {
  try {
    // Get the user data from the request
    const userData = await request.json()

    console.log('fix-profile-rls route called with data:', {
      id: userData?.id,
      email: userData?.email,
      hasMetadata: !!userData?.user_metadata
    })

    if (!userData?.id || !userData?.email) {
      console.error('Invalid user data for profile creation:', userData)
      return NextResponse.json(
        { error: 'Invalid user data' },
        { status: 400 }
      )
    }

    console.log('Attempting to create profile with service role for user:', userData.email)

    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables')
      return NextResponse.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      )
    }

    // Create a direct Supabase client with the service role key to bypass RLS
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get role from allowed_emails table
    let userRole = 'staff' // Default role

    try {
      const { data: allowedEmail, error: allowedEmailError } = await supabase
        .from('allowed_emails')
        .select('role')
        .eq('email', userData.email)
        .maybeSingle()

      if (allowedEmailError) {
        console.error('Error checking allowed emails:', allowedEmailError)
      } else {
        console.log('Allowed email check result:', allowedEmail)

        // Validate role is one of the allowed values
        if (allowedEmail && typeof allowedEmail === 'object' && 'role' in allowedEmail) {
          const role = allowedEmail.role
          if (role === 'admin' || role === 'manager' || role === 'staff') {
            userRole = role
          }
        }
      }
    } catch (allowedEmailCheckError) {
      console.error('Exception checking allowed emails:', allowedEmailCheckError)
    }

    // Check if profile already exists
    const { data: existingProfile, error: existingProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.id)
      .maybeSingle()

    if (existingProfileError) {
      console.error('Error checking for existing profile:', existingProfileError)
    }

    if (existingProfile) {
      console.log('Profile already exists for user:', userData.email)
      return NextResponse.json({ profile: existingProfile })
    }

    // Prepare profile data
    const profileData = {
      id: userData.id,
      email: userData.email,
      full_name: userData.user_metadata?.full_name || userData.email?.split('@')[0] || 'User',
      role: userRole,
      status: 'active',
    }

    console.log('Profile data to insert:', profileData)

    // Insert profile with service role client (bypassing RLS)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData]) // Pass as array to fix TypeScript error
        .select('*')
        .single()

      if (error) {
        console.error('Error creating profile with service role:', error)

        // Check if this is a conflict error (409/23505)
        if (error.code === '23505' || error.message?.includes('duplicate key value')) {
          console.log('Profile already exists (conflict error). Fetching existing profile...')

          // Fetch the existing profile
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userData.id)
            .maybeSingle()

          if (fetchError) {
            console.error('Error fetching existing profile after conflict:', fetchError)
          }

          if (existingProfile) {
            console.log('Found existing profile after conflict:', existingProfile)
            return NextResponse.json({ profile: existingProfile })
          }
        }

        return NextResponse.json(
          { error: error.message || 'Failed to create profile' },
          { status: 500 }
        )
      }

      console.log('Profile created successfully with service role:', data)
      return NextResponse.json({ profile: data })
    } catch (insertError) {
      console.error('Exception during profile insert:', insertError)
      return NextResponse.json(
        { error: insertError instanceof Error ? insertError.message : 'Failed to insert profile' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Exception in fix-profile-rls route:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
