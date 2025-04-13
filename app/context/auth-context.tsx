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
import { 
  storeSessionData, 
  getStoredSessionData, 
  clearSessionData, 
  setClientSession,
  getRedirectPath
} from '@/app/lib/auth/session-utils';
import {
  type Profile,
  getOrCreateProfile
} from '@/app/lib/auth/profile-utils';

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
          // Store session data using our utility
          storeSessionData(session)

          // Get the redirect path
          const searchParams = new URLSearchParams(window.location.search)
          const redirect = getRedirectPath(searchParams)
          
          // Clear the hash to prevent token exposure
          window.history.replaceState(null, '', window.location.pathname + window.location.search)
          
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

        // Check if we're on the signin page
        const isAuthPage = window.location.pathname.startsWith('/auth')
        const isSigninPage = window.location.pathname === '/auth/signin'
        
        // If we're on the signin page, check if we have a session in localStorage
        if (isSigninPage) {
          console.log('On signin page, checking for existing session in localStorage')
          const storedSession = getStoredSessionData()
          
          if (storedSession?.access_token) {
            console.log('Found valid session in localStorage, setting session and redirecting')
            
            // Set the session in Supabase
            const { success } = await setClientSession(storedSession)
            
            if (success) {
              // Get redirect path
              const searchParams = new URLSearchParams(window.location.search)
              const redirect = getRedirectPath(searchParams)
              
              // Force redirect to dashboard
              console.log('Redirecting to:', redirect)
              router.push(redirect)
              return
            }
          }
        }

        // Check for hash fragment first (magic link flow)
        if (window.location.hash) {
          console.log('Found hash fragment, handling magic link...')
          const session = await handleHashFragment()
          if (session) {
            setUser(session.user)
            
            // Fetch or create profile
            if (session.user) {
              const { profile: userProfile } = await getOrCreateProfile(session.user)
              if (userProfile) {
                setProfile(userProfile)
              }
            }
            
            // Get redirect path and navigate
            const searchParams = new URLSearchParams(window.location.search)
            const redirect = getRedirectPath(searchParams)
            router.push(redirect)
            return
          }
        }

        // Check existing session
        console.log('Checking existing session...')
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Session error:', error)
          setIsLoading(false)
          return
        }

        if (session?.user) {
          console.log('Found existing session')
          setUser(session.user)
          
          // Store session data
          storeSessionData(session)
          
          // Fetch or create profile
          const { profile: userProfile } = await getOrCreateProfile(session.user)
          if (userProfile) {
            setProfile(userProfile)
          }
          
          // If we're on an auth page and have a session, redirect to dashboard
          if (isAuthPage && !window.location.pathname.includes('/callback')) {
            const searchParams = new URLSearchParams(window.location.search)
            const redirect = getRedirectPath(searchParams)
            console.log('Authenticated on auth page, redirecting to:', redirect)
            router.push(redirect)
          }
        } else {
          console.log('No session found')
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
          
          // Store session data
          storeSessionData(session)

          try {
            // Fetch or create profile
            const { profile: userProfile } = await getOrCreateProfile(session.user)
            if (userProfile) {
              setProfile(userProfile)
            }
          } catch (error) {
            console.error('Error handling profile:', error)
            // Continue with redirect even if profile handling fails
          }

          // Get the redirect path and navigate
          const searchParams = new URLSearchParams(window.location.search)
          const redirect = getRedirectPath(searchParams)
          router.push(redirect)
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, cleaning up...')
        setUser(null)
        setProfile(null)
        
        // Clear all auth-related data
        clearSessionData()
        
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
      
      // Clear session data
      clearSessionData()
      
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