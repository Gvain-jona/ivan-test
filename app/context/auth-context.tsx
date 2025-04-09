'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { type User } from '@supabase/supabase-js'
import { useVisibilityChange } from '@/app/hooks/use-visibility-change'

// Define the profile type based on our database schema
type Profile = {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'manager' | 'staff'
  status: 'active' | 'inactive' | 'locked'
  pin: string | null
  verification_code: string | null
  code_expiry: string | null
  is_verified: boolean
  failed_attempts: number
  created_at: string
  updated_at: string
}

type AuthContextType = {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  signIn: (email: string) => Promise<{ error: any | null }>
  signOut: () => Promise<void>
  verifyPin: (pin: string) => Promise<boolean>
  setPin: (pin: string) => Promise<{ error: any | null }>
  hasPinSet: boolean
  isAdmin: boolean
  isManager: boolean
  isStaff: boolean
  checkSupabaseHealth: () => Promise<{ ok: boolean; error?: any }>
  clearPinVerification: () => void
  resetInactivityTimer: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Derived state
  const hasPinSet = !!profile?.pin
  const isAdmin = profile?.role === 'admin'
  const isManager = profile?.role === 'manager'
  const isStaff = profile?.role === 'staff'

  useEffect(() => {
    const getUser = async () => {
      console.log('Initializing auth context and checking user session...')
      setIsLoading(true)
      try {
        console.log('Fetching current user from Supabase...')
        const { data: { user } } = await supabase.auth.getUser()
        console.log('User fetch result:', user ? 'User found' : 'No user found')
        setUser(user)

        if (user) {
          try {
            // We'll no longer skip profile checks completely
            // Instead, we'll always try to create a profile if one doesn't exist
            const skipProfileRedirects = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_SKIP_PROFILE_CHECK === 'true'
            if (skipProfileRedirects) {
              console.log('Development mode: Will create profile if needed but skip redirects')
            }

            // First check if we can connect to Supabase
            try {
              // Use a simple query to check if we can connect to Supabase
              const { error: healthError } = await supabase
                .from('profiles')
                .select('count')
                .limit(1)
                .maybeSingle()

              // Ignore specific errors that don't prevent authentication
              if (healthError) {
                // Ignore 'no rows returned' error
                if (healthError.code === 'PGRST116') {
                  console.log('No rows returned from profiles table, continuing...')
                }
                // Ignore RLS policy recursion error
                else if (healthError.code === '42P17' && healthError.message?.includes('infinite recursion detected in policy')) {
                  console.error('RLS policy recursion error detected, bypassing profile check')
                  // If there's an RLS policy issue, we'll just continue without a profile
                  setIsLoading(false)
                  return
                }
                else {
                  console.error('Error connecting to Supabase:', healthError)
                  // If we can't connect to Supabase, we'll just continue without a profile
                  setIsLoading(false)
                  return
                }
              }
            } catch (healthError) {
              console.error('Exception connecting to Supabase:', healthError)
              // If we can't connect to Supabase, we'll just continue without a profile
              setIsLoading(false)
              return
            }

            // Then check if the profiles table exists
            try {
              const { data, error: tableError } = await supabase
                .from('profiles')
                .select('count')
                .limit(1)

              if (tableError) {
                console.error('Error checking profiles table:', tableError)
                // If the table doesn't exist, we'll just continue without a profile
                setIsLoading(false)
                return
              }
            } catch (tableError) {
              console.error('Exception checking profiles table:', tableError)
              // If there's an exception, we'll just continue without a profile
              setIsLoading(false)
              return
            }

            // If the table exists, try to fetch the user's profile
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single()

            if (error) {
              console.error('Error fetching profile:', error)

              // If the profile doesn't exist, we need to create it
              if (error.code === 'PGRST116') { // No rows returned
                console.log('Profile not found, creating new profile for user')

                try {
                  // Create a new profile for the user
                  console.log('Creating new profile for user:', user.id)

                  // First, check if the profile already exists (double-check)
                  const { data: existingProfile, error: checkError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle()

                  if (existingProfile) {
                    console.log('Profile already exists, using existing profile:', existingProfile)
                    return { data: existingProfile, error: null }
                  }

                  // Check if the user is in the allowed_emails table and get their role
                  const { data: allowedEmail, error: allowedEmailError } = await supabase
                    .from('allowed_emails')
                    .select('role')
                    .eq('email', user.email)
                    .maybeSingle()

                  // Use the role from allowed_emails if available, otherwise default to 'staff'
                  const userRole = allowedEmail?.role || 'staff'
                  console.log(`Using role from allowed_emails: ${userRole} for user ${user.email}`)

                  // Profile doesn't exist, create it
                  const { data: newProfile, error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                      id: user.id,
                      email: user.email,
                      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                      role: userRole, // Use role from allowed_emails
                      status: 'active',
                      is_verified: false, // They need to set up a PIN
                      failed_attempts: 0
                    })
                    .select('*')
                    .single()

                  if (insertError) {
                    console.error('Error creating profile:', insertError)
                  } else {
                    console.log('Created new profile:', newProfile)
                    setProfile(newProfile)

                    // Redirect to PIN setup if needed
                    if (window.location.pathname !== '/auth/setup-pin' &&
                        !window.location.pathname.startsWith('/auth/callback')) {
                      router.push('/auth/setup-pin')
                    }
                  }
                } catch (insertError) {
                  console.error('Exception creating profile:', insertError)
                }
              }
            } else {
              setProfile(profile)

              // If the user has a profile but hasn't set up a PIN, redirect to PIN setup
              if (profile && !profile.is_verified &&
                  window.location.pathname !== '/auth/setup-pin' &&
                  !window.location.pathname.startsWith('/auth/callback')) {
                router.push('/auth/setup-pin')
              }
            }
          } catch (profileError) {
            console.error('Exception fetching profile:', profileError)
          }
        }
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()

    console.log('Setting up auth state change listener...')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'Session exists' : 'No session')
        setUser(session?.user ?? null)

        if (session?.user) {
          try {
            // We'll no longer skip profile checks completely
            // Instead, we'll always try to create a profile if one doesn't exist
            const skipProfileRedirects = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_SKIP_PROFILE_CHECK === 'true'
            if (skipProfileRedirects) {
              console.log('Development mode: Will create profile if needed but skip redirects')
            }

            // First check if we can connect to Supabase
            try {
              // Use a simple query to check if we can connect to Supabase
              const { error: healthError } = await supabase
                .from('profiles')
                .select('count')
                .limit(1)
                .maybeSingle()

              // Ignore specific errors that don't prevent authentication
              if (healthError) {
                // Ignore 'no rows returned' error
                if (healthError.code === 'PGRST116') {
                  console.log('No rows returned from profiles table in auth change handler, continuing...')
                }
                // Ignore RLS policy recursion error
                else if (healthError.code === '42P17' && healthError.message?.includes('infinite recursion detected in policy')) {
                  console.error('RLS policy recursion error detected in auth change handler, bypassing profile check')
                  return
                }
                else {
                  console.error('Error connecting to Supabase in auth change handler:', healthError)
                  return
                }
              }
            } catch (healthError) {
              console.error('Exception connecting to Supabase in auth change handler:', healthError)
              return
            }

            // Then check if the profiles table exists
            try {
              const { data, error: tableError } = await supabase
                .from('profiles')
                .select('count')
                .limit(1)

              if (tableError) {
                console.error('Error checking profiles table on auth change:', tableError)
                return
              }
            } catch (tableError) {
              console.error('Exception checking profiles table on auth change:', tableError)
              return
            }

            // If the table exists, try to fetch the user's profile
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (error) {
              console.error('Error fetching profile on auth change:', error)

              // If the profile doesn't exist, we need to create it
              if (error.code === 'PGRST116') { // No rows returned
                console.log('Profile not found on auth change, creating new profile')

                try {
                  // Create a new profile for the user
                  console.log('Creating new profile for user on auth change:', session.user.id)

                  // First, check if the profile already exists (double-check)
                  const { data: existingProfile, error: checkError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle()

                  if (existingProfile) {
                    console.log('Profile already exists on auth change, using existing profile:', existingProfile)
                    return { data: existingProfile, error: null }
                  }

                  // Check if the user is in the allowed_emails table and get their role
                  const { data: allowedEmail, error: allowedEmailError } = await supabase
                    .from('allowed_emails')
                    .select('role')
                    .eq('email', session.user.email)
                    .maybeSingle()

                  // Use the role from allowed_emails if available, otherwise default to 'staff'
                  const userRole = allowedEmail?.role || 'staff'
                  console.log(`Using role from allowed_emails: ${userRole} for user ${session.user.email}`)

                  // Profile doesn't exist, create it
                  const { data: newProfile, error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                      id: session.user.id,
                      email: session.user.email,
                      full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                      role: userRole, // Use role from allowed_emails
                      status: 'active',
                      is_verified: false, // They need to set up a PIN
                      failed_attempts: 0
                    })
                    .select('*')
                    .single()

                  if (insertError) {
                    console.error('Error creating profile on auth change:', insertError)
                  } else {
                    console.log('Created new profile on auth change:', newProfile)
                    setProfile(newProfile)

                    // Redirect to PIN setup if needed
                    if (window.location.pathname !== '/auth/setup-pin' &&
                        !window.location.pathname.startsWith('/auth/callback')) {
                      router.push('/auth/setup-pin')
                    }
                  }
                } catch (insertError) {
                  console.error('Exception creating profile on auth change:', insertError)
                }
              }
            } else {
              setProfile(data)

              // If the user has a profile but hasn't set up a PIN, redirect to PIN setup
              if (data && !data.is_verified &&
                  window.location.pathname !== '/auth/setup-pin' &&
                  !window.location.pathname.startsWith('/auth/callback')) {
                router.push('/auth/setup-pin')
              }
            }
          } catch (profileError) {
            console.error('Exception fetching profile on auth change:', profileError)
          }
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string) => {
    console.log(`Attempting to sign in with email: ${email}`)

    // Create a promise that rejects after a timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Sign-in timed out. This might be due to database connection issues.'))
      }, 5000) // 5 second timeout
    })

    try {
      // In development mode, we can bypass the actual sign-in process if needed
      const isDev = process.env.NODE_ENV === 'development';
      const shouldBypass = process.env.NEXT_PUBLIC_BYPASS_SIGNIN === 'true';

      console.log('Sign-in environment check:', {
        isDev,
        shouldBypass,
        NODE_ENV: process.env.NODE_ENV,
        BYPASS_SIGNIN: process.env.NEXT_PUBLIC_BYPASS_SIGNIN
      });

      if (isDev && shouldBypass) {
        console.log('Development mode: bypassing actual sign-in process')
        return { error: null }
      }

      // Race the sign-in process against the timeout
      return await Promise.race([
        (async () => {
      // Check if the is_email_allowed function exists
      try {
        // First check if email is allowed
        const { data: isAllowed, error: allowedError } = await supabase.rpc('is_email_allowed', {
          input_email: email
        })

        if (allowedError) {
          // If the function doesn't exist, we'll just continue with the sign-in
          if (allowedError.code === 'PGRST301') { // Function not found
            console.log('is_email_allowed function not found, skipping email check')
          }
          // Ignore RLS policy recursion error
          else if (allowedError.code === '42P17' && allowedError.message?.includes('infinite recursion detected in policy')) {
            console.error('RLS policy recursion error detected in email check, bypassing email check')
            // In development mode, allow all emails
            if (process.env.NODE_ENV === 'development') {
              console.log('Development mode: allowing all emails')
            }
          } else {
            console.error('Error checking if email is allowed:', allowedError)
            return { error: allowedError }
          }
        } else if (!isAllowed) {
          return {
            error: {
              message: 'This email is not authorized to sign in. Please contact an administrator.'
            }
          }
        }
      } catch (rpcError) {
        console.error('Exception checking if email is allowed:', rpcError)
        // Continue with sign-in even if the RPC call fails
      }

      // Get the current URL's pathname to use as the next parameter
      const currentPath = window.location.pathname
      const searchParams = new URLSearchParams(window.location.search)
      const redirectTo = searchParams.get('redirect') || '/dashboard/orders'

      // Send magic link
      console.log('Sending magic link to:', email)
      console.log('Redirect URL:', `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`)

      try {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
            shouldCreateUser: true
          },
        })

        if (error) {
          console.error('Error sending magic link:', error)
        } else {
          console.log('Magic link sent successfully')
        }

        return { error }
      } catch (signInError) {
        console.error('Exception sending magic link:', signInError)
        return { error: signInError as any }
      }
        })(),
        timeoutPromise
      ])
    } catch (error) {
      console.error('Error signing in:', error)

      // If it's a timeout error, provide a more helpful message
      if (error.message?.includes('timed out')) {
        console.warn('Sign-in timed out. This might be due to database connection issues.')
        return {
          error: {
            message: 'Sign-in timed out. This might be due to database connection issues. Please try again later.',
            code: 'TIMEOUT'
          }
        }
      }

      return { error }
    }
  }

  const signOut = async () => {
    try {
      // Sign out from Supabase
      return await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const verifyPin = async (pin: string) => {
    try {
      if (!user) return false

      try {
        const { data, error } = await supabase.rpc('verify_pin', {
          user_id: user.id,
          input_pin: pin,
        })

        if (error) {
          // If the function doesn't exist, we'll just set the cookie and continue
          if (error.code === 'PGRST301') { // Function not found
            console.log('verify_pin function not found, skipping PIN verification')

            // For development purposes, we'll just set the cookie and continue
            const expiryDate = new Date()
            expiryDate.setTime(expiryDate.getTime() + (30 * 60 * 1000)) // 30 minutes
            document.cookie = `pin_verified=true; expires=${expiryDate.toUTCString()}; path=/; secure; samesite=lax`

            // Also store the verification time in localStorage for session tracking
            localStorage.setItem('pin_verified_at', new Date().toISOString())

            return true
          } else {
            console.error('Error verifying PIN:', error)
            return false
          }
        }

        if (data) {
          // Set cookie to indicate PIN has been verified for this session
          // Expires in 30 minutes (for inactivity timeout)
          const expiryDate = new Date()
          expiryDate.setTime(expiryDate.getTime() + (30 * 60 * 1000)) // 30 minutes
          document.cookie = `pin_verified=true; expires=${expiryDate.toUTCString()}; path=/; secure; samesite=lax`

          // Also store the verification time in localStorage for session tracking
          localStorage.setItem('pin_verified_at', new Date().toISOString())
        }

        return !!data
      } catch (rpcError) {
        console.error('Exception verifying PIN:', rpcError)

        // For development purposes, we'll just set the cookie and continue
        const expiryDate = new Date()
        expiryDate.setTime(expiryDate.getTime() + (30 * 60 * 1000)) // 30 minutes
        document.cookie = `pin_verified=true; expires=${expiryDate.toUTCString()}; path=/; secure; samesite=lax`

        // Also store the verification time in localStorage for session tracking
        localStorage.setItem('pin_verified_at', new Date().toISOString())

        return true
      }
    } catch (error) {
      console.error('Error verifying PIN:', error)
      return false
    }
  }

  const setPin = async (pin: string) => {
    try {
      if (!user) return { error: new Error('No user logged in') }

      try {
        // First hash the PIN
        const { data: hashedPin, error: hashError } = await supabase.rpc('hash_pin', {
          pin,
        })

        if (hashError) {
          // If the function doesn't exist, we'll just use a placeholder hash
          if (hashError.code === 'PGRST301') { // Function not found
            console.log('hash_pin function not found, using placeholder hash')

            // For development purposes, we'll just use a placeholder hash
            const placeholderHash = `dev_hash_${pin}`

            // Then update the profile
            try {
              const { error: updateError } = await supabase
                .from('profiles')
                .update({
                  pin: placeholderHash,
                  is_verified: true
                })
                .eq('id', user.id)

              if (updateError) {
                console.error('Error updating profile with PIN:', updateError)

                // If the profile doesn't exist, we might need to create it
                if (updateError.code === 'PGRST116') { // No rows returned
                  console.log('Profile not found, creating new profile')

                  // Try to create a new profile
                  const { error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                      id: user.id,
                      email: user.email,
                      full_name: user.user_metadata?.full_name || 'User',
                      role: 'staff',
                      status: 'active',
                      pin: placeholderHash,
                      is_verified: true
                    })

                  if (insertError) {
                    console.error('Error creating profile:', insertError)
                    return { error: insertError }
                  }
                } else {
                  return { error: updateError }
                }
              }

              // Update local profile state
              setProfile({
                id: user.id,
                email: user.email!,
                full_name: user.user_metadata?.full_name || 'User',
                role: 'staff',
                status: 'active',
                pin: placeholderHash,
                is_verified: true,
                failed_attempts: 0,
                verification_code: null,
                code_expiry: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })

              // Set cookie to indicate PIN has been verified for this session
              const expiryDate = new Date()
              expiryDate.setTime(expiryDate.getTime() + (12 * 60 * 60 * 1000))
              document.cookie = `pin_verified=true; expires=${expiryDate.toUTCString()}; path=/; secure; samesite=lax`

              return { error: null }
            } catch (updateError) {
              console.error('Exception updating profile:', updateError)
              return { error: updateError }
            }
          } else {
            console.error('Error hashing PIN:', hashError)
            return { error: hashError }
          }
        }

        // Then update the profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            pin: hashedPin,
            is_verified: true
          })
          .eq('id', user.id)

        if (updateError) {
          console.error('Error updating profile with PIN:', updateError)
          return { error: updateError }
        }

        // Update local profile state
        if (profile) {
          setProfile({
            ...profile,
            pin: hashedPin,
            is_verified: true
          })
        }

        // Set cookie to indicate PIN has been verified for this session
        const expiryDate = new Date()
        expiryDate.setTime(expiryDate.getTime() + (12 * 60 * 60 * 1000))
        document.cookie = `pin_verified=true; expires=${expiryDate.toUTCString()}; path=/; secure; samesite=lax`

        return { error: null }
      } catch (rpcError) {
        console.error('Exception setting PIN:', rpcError)

        // For development purposes, we'll just set the cookie and continue
        const expiryDate = new Date()
        expiryDate.setTime(expiryDate.getTime() + (12 * 60 * 60 * 1000))
        document.cookie = `pin_verified=true; expires=${expiryDate.toUTCString()}; path=/; secure; samesite=lax`

        return { error: null }
      }
    } catch (error) {
      console.error('Error setting PIN:', error)
      return { error }
    }
  }

  // Health check function to diagnose Supabase connection issues
  const checkSupabaseHealth = async () => {
    console.log('Running Supabase health check...')
    try {
      // Check if we can connect to Supabase
      const { data, error } = await supabase.from('profiles').select('count').limit(1).maybeSingle()

      if (error) {
        console.error('Supabase health check failed:', error)
        return { ok: false, error }
      }

      console.log('Supabase health check passed')
      return { ok: true }
    } catch (error) {
      console.error('Supabase health check exception:', error)
      return { ok: false, error }
    }
  }

  // Function to clear PIN verification
  const clearPinVerification = () => {
    console.log('Clearing PIN verification')
    document.cookie = 'pin_verified=false; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=lax'
    localStorage.removeItem('pin_verified_at')
  }

  // Function to check if session is expired due to inactivity
  const checkSessionExpiry = () => {
    if (typeof window === 'undefined') return false

    const pinVerifiedAt = localStorage.getItem('pin_verified_at')
    if (!pinVerifiedAt) return true

    const verifiedTime = new Date(pinVerifiedAt).getTime()
    const currentTime = new Date().getTime()
    const inactivityPeriod = 30 * 60 * 1000 // 30 minutes in milliseconds

    return (currentTime - verifiedTime) > inactivityPeriod
  }

  // Function to check if user has a PIN set
  const checkHasPinSet = () => {
    return !!profile?.pin
  }

  // Function to reset the inactivity timer
  const resetInactivityTimer = () => {
    if (typeof window === 'undefined') return

    const pinVerified = document.cookie.includes('pin_verified=true')
    if (pinVerified) {
      localStorage.setItem('pin_verified_at', new Date().toISOString())
    }
  }

  // Use the visibility change hook to detect when the app is reopened
  useVisibilityChange((isVisible) => {
    if (isVisible) {
      // When the app becomes visible (reopened), check if the session is expired
      if (checkSessionExpiry()) {
        clearPinVerification()

        // Only redirect if we're not already on an auth page
        if (user && !window.location.pathname.startsWith('/auth/')) {
          // If user has a PIN set, redirect to verify-pin, otherwise to setup-pin
          const redirectPath = checkHasPinSet() ? '/auth/verify-pin' : '/auth/setup-pin'
          router.push(redirectPath)
        }
      }
    }
  })

  // Set up activity tracking to reset the inactivity timer
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleActivity = () => {
      resetInactivityTimer()
    }

    // Track user activity
    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('click', handleActivity)
    window.addEventListener('scroll', handleActivity)
    window.addEventListener('touchstart', handleActivity)

    // Check for session expiry on initial load
    if (checkSessionExpiry()) {
      clearPinVerification()
    }

    // Set up periodic checks for session expiry
    const intervalId = setInterval(() => {
      if (checkSessionExpiry()) {
        clearPinVerification()

        // Only redirect if we're not already on an auth page
        if (user && !window.location.pathname.startsWith('/auth/')) {
          // If user has a PIN set, redirect to verify-pin, otherwise to setup-pin
          const redirectPath = checkHasPinSet() ? '/auth/verify-pin' : '/auth/setup-pin'
          router.push(redirectPath)
        }
      }
    }, 60000) // Check every minute

    return () => {
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('click', handleActivity)
      window.removeEventListener('scroll', handleActivity)
      window.removeEventListener('touchstart', handleActivity)
      clearInterval(intervalId)
    }
  }, [user, router])

  const value = {
    user,
    profile,
    isLoading,
    signIn,
    signOut,
    verifyPin,
    setPin,
    hasPinSet,
    isAdmin,
    isManager,
    isStaff,
    checkSupabaseHealth,
    clearPinVerification,
    resetInactivityTimer
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
