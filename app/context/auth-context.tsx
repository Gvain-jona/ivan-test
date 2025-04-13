'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { type User } from '@supabase/supabase-js'

// Define the profile type based on our database schema
type Profile = {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'manager' | 'staff'
  status: 'active' | 'inactive' | 'locked'
  created_at: string
  updated_at: string
}

type AuthContextType = {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  signIn: (email: string, redirectTo?: string) => Promise<{ error: any | null }>
  signOut: () => Promise<void>
  isAdmin: boolean
  isManager: boolean
  isStaff: boolean
  checkSupabaseHealth: () => Promise<{ ok: boolean; error?: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Derived state
  const isAdmin = profile?.role === 'admin'
  const isManager = profile?.role === 'manager'
  const isStaff = profile?.role === 'staff'

  useEffect(() => {
    const handleAuth = async () => {
      setIsLoading(true)
      try {
        console.log('Checking auth state...')

        // CRITICAL: Check for magic link token parameters
        // This handles the case where Supabase redirects to the root URL with token and type=magiclink
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href)
          const token = url.searchParams.get('token')
          const type = url.searchParams.get('type')

          if (token && type === 'magiclink') {
            console.log('Magic link detected with token, processing...')
            
            // Handle the token using verifyOtp
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'magiclink',
            })
            
            if (error) {
              console.error('Error verifying magic link:', error.message)
              router.push(`/auth/signin?error=${encodeURIComponent(error.message)}`)
              setIsLoading(false)
              return
            } 
            
            if (data.session) {
              console.log('Session established via magic link:', data.session.user.email)
              setUser(data.session.user)
              
              // Store authentication information
              localStorage.setItem('auth_completed', 'true')
              localStorage.setItem('auth_timestamp', Date.now().toString())
              localStorage.setItem('auth_user_id', data.session.user.id)
              localStorage.setItem('auth_in_progress', 'false')
              
              if (data.session.user.email) {
                localStorage.setItem('auth_email', data.session.user.email)
                localStorage.setItem('auth_email_temp', data.session.user.email)
              }
              
              // Fetch profile
              try {
                const { data: profileData, error: profileError } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', data.session.user.id)
                  .single()

                if (profileError) {
                  if (profileError.code === 'PGRST116') { // No rows returned
                    // Create profile for new user
                    await createUserProfile(data.session.user)
                  } else {
                    throw profileError
                  }
                } else {
                  setProfile(profileData)
                }
              } catch (profileError) {
                console.error('Error fetching profile after magic link auth:', profileError)
              }
              
              // Clear the token from the URL to prevent token exposure
              window.history.replaceState(null, '', window.location.pathname)
              
              // Redirect to dashboard
              router.push('/dashboard/orders')
              setIsLoading(false)
              return
            }
          }
        }

        // Check for existing session if no magic link token
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          console.log('Session found:', session.user.email)
          setUser(session.user)

          // Get the user's profile
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (error) {
              console.error('Error fetching profile:', error)
              if (error.code === 'PGRST116') { // No rows returned
                // Create profile for new user
                await createUserProfile(session.user)
              }
            } else if (data) {
              setProfile(data)
            }
          } catch (error) {
            console.error('Exception fetching profile:', error)
          }
        } else {
          console.log('No session found')
          setUser(null)
          setProfile(null)

          // Try to recover from localStorage if we have auth info but no session
          const authEmail = localStorage.getItem('auth_email')
          if (authEmail) {
            console.log('Found auth email in localStorage, but no session. User may need to re-authenticate.')
            // Don't auto-redirect to sign-in, let the app handle it
          }
        }
      } catch (error) {
        console.error('Error in handleAuth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Helper function to create a user profile
    const createUserProfile = async (user: User) => {
      try {
        // Check if the user is in the allowed_emails table and get their role
        const { data: allowedEmail, error: allowedEmailError } = await supabase
          .from('allowed_emails')
          .select('role')
          .eq('email', user.email)
          .maybeSingle()

        // Use the role from allowed_emails if available, otherwise default to 'staff'
        const userRole = allowedEmail?.role || 'staff'
        console.log(`Using role from allowed_emails: ${userRole} for user ${user.email}`)

        // Create the profile
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role: userRole,
            status: 'active'
          })
          .select('*')
          .single()

        if (insertError) {
          console.error('Error creating profile:', insertError)
        } else {
          console.log('Created new profile:', newProfile)
          setProfile(newProfile)
        }
      } catch (error) {
        console.error('Exception creating profile:', error)
      }
    }

    handleAuth()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'Session exists' : 'No session')

        if (event === 'SIGNED_IN' && session) {
          console.log('User signed in:', session.user.email)
          setUser(session.user)
          localStorage.setItem('auth_completed', 'true')
          localStorage.setItem('auth_in_progress', 'false')
          localStorage.setItem('auth_user_id', session.user.id)
          
          if (session.user.email) {
            localStorage.setItem('auth_email', session.user.email)
            localStorage.setItem('auth_email_temp', session.user.email)
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out')
          setUser(null)
          setProfile(null)
          localStorage.removeItem('auth_completed')
          localStorage.removeItem('auth_user_id')
          // Don't remove auth_email or auth_email_temp to allow for re-authentication
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed')
        } else if (event === 'USER_UPDATED') {
          console.log('User updated')
          if (session) {
            setUser(session.user)
          }
        }

        if (session?.user) {
          try {
            // Get the user's profile
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (error) {
              console.error('Error fetching profile on auth change:', error)

              // If the profile doesn't exist, we need to create it
              if (error.code === 'PGRST116') { // No rows returned
                await createUserProfile(session.user)
              }
            } else {
              setProfile(data)
              // User profile loaded successfully
            }
          } catch (profileError) {
            console.error('Exception fetching profile on auth change:', profileError)
          }
        }
      }
    )

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const signIn = async (email: string, customRedirect?: string) => {
    try {
      // Use the provided redirect or get it from URL parameters or use default
      const currentPath = window.location.pathname
      const searchParams = new URLSearchParams(window.location.search)
      const redirectTo = customRedirect || searchParams.get('redirect') || '/dashboard/orders'

      // Check if email is allowed (if the function exists)
      try {
        const { data: isAllowed, error: allowedError } = await supabase.rpc('is_email_allowed', {
          input_email: email
        })

        if (!allowedError && !isAllowed) {
          return {
            error: {
              message: 'This email is not authorized to sign in. Please contact an administrator.'
            }
          }
        }
      } catch (rpcError) {
        // Continue with sign-in even if the RPC call fails
        console.log('RPC check skipped:', rpcError)
      }

      console.log(`Signing in with email: ${email}, redirect to: ${redirectTo}`)

      // Always use window.location.origin for client-side redirects
      // This ensures we're using the actual URL the user is accessing
      const appUrl = window.location.origin;
      console.log(`Using app URL for redirect: ${appUrl}`);

      // Store authentication information in localStorage for verification and recovery
      localStorage.setItem('auth_redirect_origin', appUrl);
      localStorage.setItem('auth_timestamp', Date.now().toString());
      localStorage.setItem('auth_email', email);
      localStorage.setItem('auth_email_temp', email);
      localStorage.setItem('auth_in_progress', 'true');

      // CRITICAL: The redirect URL must point to our auth callback route
      // This is where the PKCE flow will be completed after the user clicks the magic link
      const redirectUrl = `${appUrl}/auth/callback?next=${encodeURIComponent(redirectTo)}`;
      console.log('Using redirect URL:', redirectUrl);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: true // Allow creating new users
        },
      })

      // Log the stored values for debugging
      console.log('Stored auth email in localStorage:', email);

      if (error) {
        console.error('Error in signInWithOtp:', error.message)
      }

      return { error }
    } catch (error) {
      console.error('Error signing in:', error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  // Health check function to diagnose Supabase connection issues
  const checkSupabaseHealth = async () => {
    // Run Supabase health check
    try {
      // Check if we can connect to Supabase
      const { data, error } = await supabase.from('profiles').select('count').limit(1).maybeSingle()

      if (error) {
        console.error('Supabase health check failed:', error)
        return { ok: false, error }
      }

      // Supabase health check passed
      return { ok: true }
    } catch (error) {
      console.error('Supabase health check exception:', error)
      return { ok: false, error }
    }
  }

  const value = {
    user,
    profile,
    isLoading,
    signIn,
    signOut,
    isAdmin,
    isManager,
    isStaff,
    checkSupabaseHealth
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
