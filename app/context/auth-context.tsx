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
      const tokenType = hashParams.get('token_type')
      const type = hashParams.get('type')

      if (accessToken && type === 'magiclink') {
        console.log('Found magic link access token in hash')
        const { data: { session }, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        })

        if (error) throw error
        if (session) {
          // Store session data in localStorage via the sb-auth key
          const sessionData = {
            access_token: accessToken,
            refresh_token: refreshToken || '',
            expires_at: Math.floor(Date.now() / 1000) + (parseInt(expiresIn || '3600')),
            user: session.user,
            token_type: tokenType || 'bearer'
          }
          localStorage.setItem('sb-auth', JSON.stringify(sessionData))
          localStorage.setItem('auth_completed', 'true')
          localStorage.setItem('auth_timestamp', Date.now().toString())

          // Get the redirect path
          const searchParams = new URLSearchParams(window.location.search)
          const redirect = searchParams.get('redirect') || '/dashboard/orders'
          
          // Clean up URL
          window.history.replaceState({}, '', redirect)
          
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
        console.log('Checking auth state...')
        console.log('URL:', window.location.href)
        console.log('URL parameters:', new URLSearchParams(window.location.search))

        // Check for hash fragment first (magic link flow)
        if (window.location.hash) {
          console.log('Found hash fragment, handling magic link...')
          await handleHashFragment()
        }

        // Check existing session
        console.log('Checking existing session...')
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Session error:', error)
          throw error
        }

        setUser(session?.user || null)

        if (session?.user) {
          console.log('Found existing session, fetching profile...')
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()

          if (profileError) {
            console.error('Profile fetch error:', profileError)
            throw profileError
          }

          if (!profileData) {
            console.log('No profile found, creating one...')
            await createUserProfile(session.user)
          } else {
            console.log('Profile found:', profileData)
            setProfile(profileData)
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    handleAuth()
  }, [])

  // Listen for auth changes
  useEffect(() => {
    console.log('Setting up auth state change listener...')
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event)
      console.log('Session present:', !!session)

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser(session.user)
          
          // Store session data in localStorage
          const sessionData = {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
            user: session.user,
            token_type: session.token_type
          }
          localStorage.setItem('sb-auth', JSON.stringify(sessionData))
          localStorage.setItem('auth_completed', 'true')
          localStorage.setItem('auth_timestamp', Date.now().toString())
          localStorage.setItem('auth_user_id', session.user.id)
          localStorage.setItem('auth_in_progress', 'false')

          // Fetch or create profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()

          if (profileError) {
            console.error('Profile fetch error:', profileError)
          } else if (!profileData) {
            console.log('Creating new profile...')
            await createUserProfile(session.user)
          } else {
            console.log('Setting existing profile...')
            setProfile(profileData)
          }

          // Get the redirect path and navigate
          const searchParams = new URLSearchParams(window.location.search)
          const redirect = searchParams.get('redirect') || '/dashboard/orders'
          router.push(redirect)
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, cleaning up...')
        setUser(null)
        setProfile(null)
        
        // Clear all auth-related data
        const authKeys = [
          'auth_completed',
          'auth_timestamp',
          'auth_user_id',
          'auth_in_progress',
          'auth_email',
          'auth_email_temp',
          'sb-auth'
        ]
        
        authKeys.forEach(key => localStorage.removeItem(key))
        
        // Redirect to signin
        router.push('/auth/signin')
      }
    })

    return () => {
      console.log('Cleaning up auth subscription')
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