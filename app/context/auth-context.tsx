'use client'

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  type User, 
  type AuthError, 
  type AuthChangeEvent, 
  type Session,
  type PostgrestError 
} from '@supabase/supabase-js';

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
  signIn: (email: string, redirectTo?: string) => Promise<{ error: Error | AuthError | null }>
  signOut: () => Promise<void>
  isAdmin: boolean
  isManager: boolean
  isStaff: boolean
  checkSupabaseHealth: () => Promise<{ ok: boolean; error?: Error | AuthError }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const isAdmin = profile?.role === 'admin'
  const isManager = profile?.role === 'manager'
  const isStaff = profile?.role === 'staff'

  const createUserProfile = async (user: User) => {
    try {
      console.log('Creating profile for:', user.email)
      const { data: allowedEmail } = await supabase
        .from('allowed_emails')
        .select('role')
        .eq('email', user.email)
        .maybeSingle()

      const userRole = allowedEmail?.role || 'staff'
      console.log(`Assigning role: ${userRole}`)

      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: userRole,
          status: 'active',
        })
        .select('*')
        .single()

      if (error) throw error
      console.log('Profile created')
      setProfile(newProfile)
      return newProfile
    } catch (error) {
      console.error('Error creating profile:', error)
      throw error
    }
  }

  const handleHashFragment = async () => {
    try {
      if (typeof window === 'undefined') return null

      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const expiresIn = hashParams.get('expires_in')

      if (accessToken) {
        console.log('Found access token in hash')
        const { data: { session }, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        })

        if (error) throw error
        if (session) {
          // Set custom auth cookie for middleware
          document.cookie = `auth-token=${accessToken};path=/;max-age=${expiresIn || 3600};SameSite=Lax`
          return session
        }
      }
      return null
    } catch (error) {
      console.error('Error handling hash fragment:', error)
      return null
    }
  }

  useEffect(() => {
    const handleAuth = async () => {
      try {
        console.log('Checking auth state... URL:', window.location.href)

        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href)
          const hashParams = new URLSearchParams(url.hash.substring(1))
          const error = hashParams.get('error') || url.searchParams.get('error')
          const error_code = hashParams.get('error_code') || url.searchParams.get('error_code')
          const error_description = hashParams.get('error_description') || url.searchParams.get('error_description')

          console.log('URL parameters:', {
            error: error || 'none',
            error_code: error_code || 'none',
            error_description: error_description || 'none',
          })

          // Handle error parameters
          if (error) {
            console.error('Auth error:', error, error_description)
            const isExpiredLink = error_code === 'otp_expired' || error_description?.toLowerCase().includes('expired')
            const errorMessage = isExpiredLink 
              ? 'The magic link has expired. Please request a new one.'
              : error_description || error
            router.push(`/auth/signin?error=${encodeURIComponent(errorMessage)}`)
            return
          }

          // Try to handle hash fragment first
          const hashSession = await handleHashFragment()
          if (hashSession) {
            console.log('Session established from hash')
            setUser(hashSession.user)
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', hashSession.user.id)
              .single()

            if (profileError) {
              if (profileError.code === 'PGRST116') {
                await createUserProfile(hashSession.user)
              } else {
                console.error('Profile fetch error:', profileError)
              }
            } else {
              setProfile(profileData)
            }
            router.push('/dashboard/orders')
            return
          }

          // Check for existing session
          console.log('Checking existing session...')
          const { data: { session } } = await supabase.auth.getSession()

          if (session?.user) {
            console.log('Found existing session')
            setUser(session.user)
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (profileError) {
              if (profileError.code === 'PGRST116') {
                await createUserProfile(session.user)
              } else {
                console.error('Profile fetch error:', profileError)
              }
            } else {
              setProfile(profileData)
            }
          } else {
            console.log('No session found')
          }
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    handleAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state changed:', event)
        if (session?.user) {
          setUser(session.user)
          localStorage.setItem('auth_completed', 'true')
          localStorage.setItem('auth_timestamp', Date.now().toString())
          localStorage.setItem('auth_user_id', session.user.id)
          localStorage.setItem('auth_in_progress', 'false')

          // Set custom auth cookie for middleware
          document.cookie = `auth-token=${session.access_token};path=/;max-age=3600;SameSite=Lax`

          if (session.user.email) {
            localStorage.setItem('auth_email', session.user.email)
            localStorage.setItem('auth_email_temp', session.user.email)
          }

          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profileError) {
            if (profileError.code === 'PGRST116') {
              await createUserProfile(session.user)
            } else {
              console.error('Profile fetch error:', profileError)
            }
          } else {
            setProfile(profileData)
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('Signed out')
          setUser(null)
          setProfile(null)
          localStorage.removeItem('auth_completed')
          localStorage.removeItem('auth_timestamp')
          localStorage.removeItem('auth_user_id')
          localStorage.removeItem('auth_in_progress')
          localStorage.removeItem('auth_email')
          localStorage.removeItem('auth_email_temp')
          // Remove custom auth cookie
          document.cookie = 'auth-token=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT'
        }
      }
    )

    return () => {
      console.log('Cleaning up subscription')
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const signIn = async (email: string, customRedirect?: string) => {
    try {
      console.log('Sign in:', email)
      const redirectTo = customRedirect || new URLSearchParams(window.location.search).get('redirect') || '/dashboard/orders'
      const appUrl = window.location.origin
      const redirectUrl = `${appUrl}/auth/callback?next=${encodeURIComponent(redirectTo)}`

      console.log('Sign in config:', { email, redirectUrl })

      localStorage.setItem('auth_redirect_origin', appUrl)
      localStorage.setItem('auth_timestamp', Date.now().toString())
      localStorage.setItem('auth_email', email)
      localStorage.setItem('auth_email_temp', email)
      localStorage.setItem('auth_in_progress', 'true')

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: true,
          data: {
            redirect_url: redirectUrl
          }
        },
      })

      if (error) {
        console.error('Sign in error:', error.message)
        return { error }
      }

      console.log('Sign in email sent')
      return { error: null }
    } catch (error) {
      console.error('Sign in exception:', error)
      return { error: error instanceof Error ? error : new Error('Failed to sign in') }
    }
  }

  const signOut = async () => {
    try {
      console.log('Signing out')
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      console.log('Signed out')
    } catch (error) {
      console.error('Sign out error:', error)
      throw error instanceof Error ? error : new Error('Failed to sign out')
    }
  }

  const checkSupabaseHealth = async () => {
    try {
      console.log('Checking Supabase health')
      const { data, error } = await supabase.from('profiles').select('count').limit(1).maybeSingle()
      if (error) {
        console.error('Health check failed:', error)
        return { ok: false, error }
      }
      return { ok: true }
    } catch (error) {
      console.error('Health check exception:', error)
      return { ok: false, error: error instanceof Error ? error : new Error('Health check failed') }
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
    checkSupabaseHealth,
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