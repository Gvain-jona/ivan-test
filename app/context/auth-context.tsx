'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { type User, AuthError, type AuthChangeEvent, type Session } from '@supabase/supabase-js'
import type { PostgrestError } from '@supabase/supabase-js/dist/module/types'

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

  useEffect(() => {
    const handleAuth = async () => {
      try {
        console.log('Checking auth state... URL:', window.location.href)

        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href)
          const token = url.searchParams.get('token')
          const type = url.searchParams.get('type')
          const error = url.searchParams.get('error')
          const error_description = url.searchParams.get('error_description')

          console.log('URL parameters:', {
            token: token ? 'present' : 'missing',
            type: type || 'missing',
            error: error || 'none',
            error_description: error_description || 'none',
          })

          // Handle error parameters
          if (error) {
            console.error('Auth error:', error, error_description)
            router.push(`/auth/signin?error=${encodeURIComponent(error_description || error)}`)
            return
          }

          // Handle magic link token
          if (token && type === 'magiclink') {
            console.log('Processing magic link token:', token.slice(0, 10) + '...')
            setIsLoading(true)

            // Store token temporarily in localStorage to survive redirects
            localStorage.setItem('pending_auth_token', token)
            localStorage.setItem('pending_auth_type', type)

            let attempts = 0
            const maxAttempts = 3
            let sessionData = null
            let verifyError: AuthError | Error | null = null

            while (attempts < maxAttempts && !sessionData) {
              attempts++
              console.log(`Verification attempt ${attempts}/${maxAttempts}`)
              try {
                const { data, error } = await supabase.auth.verifyOtp({
                  token_hash: token,
                  type: 'magiclink',
                })

                if (error) {
                  console.error(`Attempt ${attempts} failed:`, error.message)
                  verifyError = error
                  if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 1000))
                    continue
                  }
                  throw error
                }

                sessionData = data
                break
              } catch (err) {
                console.error(`Attempt ${attempts} exception:`, err)
                verifyError = err instanceof Error ? err : new Error('Verification failed')
              }
            }

            if (sessionData?.session) {
              console.log('Session established:', sessionData.session.user.email)
              setUser(sessionData.session.user)
              localStorage.setItem('auth_completed', 'true')
              localStorage.setItem('auth_timestamp', Date.now().toString())
              localStorage.setItem('auth_user_id', sessionData.session.user.id)
              localStorage.setItem('auth_in_progress', 'false')

              if (sessionData.session.user.email) {
                localStorage.setItem('auth_email', sessionData.session.user.email)
                localStorage.setItem('auth_email_temp', sessionData.session.user.email)
              }

              // Clear pending token
              localStorage.removeItem('pending_auth_token')
              localStorage.removeItem('pending_auth_type')

              try {
                const { data: profileData, error: profileError } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', sessionData.session.user.id)
                  .single()

                if (profileError) {
                  if (profileError.code === 'PGRST116') {
                    await createUserProfile(sessionData.session.user)
                  } else {
                    throw profileError
                  }
                } else {
                  setProfile(profileData)
                }

                const { data: { session: verifiedSession } } = await supabase.auth.getSession()
                if (!verifiedSession) {
                  throw new Error('Session failed to persist')
                }

                console.log('Session verified:', verifiedSession.user.email)
                window.history.replaceState({}, '', window.location.pathname)
                router.push('/dashboard/orders')
              } catch (err) {
                console.error('Post-auth error:', err)
                router.push(`/auth/signin?error=${encodeURIComponent(err.message || 'Authentication failed')}`)
              }
            } else {
              console.error('Verification failed:', verifyError?.message || 'No session data')
              router.push(`/auth/signin?error=${encodeURIComponent(verifyError?.message || 'Invalid or expired link')}`)
            }
            return
          }

          // Fallback: Check for pending token in localStorage
          const pendingToken = localStorage.getItem('pending_auth_token')
          const pendingType = localStorage.getItem('pending_auth_type')
          if (pendingToken && pendingType === 'magiclink') {
            console.log('Found pending token, retrying verification...')
            try {
              const { data, error } = await supabase.auth.verifyOtp({
                token_hash: pendingToken,
                type: 'magiclink',
              })

              if (error) throw error
              if (data.session) {
                console.log('Session established from pending token:', data.session.user.email)
                setUser(data.session.user)
                localStorage.setItem('auth_completed', 'true')
                localStorage.setItem('auth_timestamp', Date.now().toString())
                localStorage.setItem('auth_user_id', data.session.user.id)
                localStorage.setItem('auth_in_progress', 'false')

                if (data.session.user.email) {
                  localStorage.setItem('auth_email', data.session.user.email)
                  localStorage.setItem('auth_email_temp', data.session.user.email)
                }

                localStorage.removeItem('pending_auth_token')
                localStorage.removeItem('pending_auth_type')

                const { data: profileData, error: profileError } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', data.session.user.id)
                  .single()

                if (profileError) {
                  if (profileError.code === 'PGRST116') {
                    await createUserProfile(data.session.user)
                  } else {
                    throw profileError
                  }
                } else {
                  setProfile(profileData)
                }

                window.history.replaceState({}, '', window.location.pathname)
                router.push('/dashboard/orders')
              }
            } catch (err) {
              console.error('Pending token verification failed:', err)
              router.push(`/auth/signin?error=${encodeURIComponent(err.message || 'Invalid or expired link')}`)
            }
            return
          }
        }

        // Check existing session
        console.log('Checking existing session...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          console.error('Session check error:', sessionError)
          throw sessionError
        }

        if (session) {
          console.log('Session found:', session.user.email)
          setUser(session.user)

          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (profileError) {
              if (profileError.code === 'PGRST116') {
                await createUserProfile(session.user)
              } else {
                throw profileError
              }
            } else {
              setProfile(profileData)
            }
          } catch (error) {
            console.error('Error fetching profile:', error)
          }
        } else {
          console.log('No session found')
          setUser(null)
          setProfile(null)

          const authEmail = localStorage.getItem('auth_email')
          if (authEmail) {
            console.log('Found auth email:', authEmail)
            // Don’t redirect here; let the root route handle it
          }
        }
      } catch (error) {
        console.error('Error in handleAuth:', error)
        router.push(`/auth/signin?error=${encodeURIComponent(error.message || 'Authentication error')}`)
      } finally {
        console.log('Auth check complete')
        setIsLoading(false)
      }
    }

    handleAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state changed:', event)
        if (event === 'SIGNED_IN' && session) {
          console.log('Signed in:', session.user.email)
          setUser(session.user)
          localStorage.setItem('auth_completed', 'true')
          localStorage.setItem('auth_timestamp', Date.now().toString())
          localStorage.setItem('auth_user_id', session.user.id)
          localStorage.setItem('auth_in_progress', 'false')

          if (session.user.email) {
            localStorage.setItem('auth_email', session.user.email)
            localStorage.setItem('auth_email_temp', session.user.email)
          }

          supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data: profileData, error: profileError }: { data: Profile | null; error: PostgrestError | null }) => {
              if (profileError) {
                if (profileError.code === 'PGRST116') {
                  createUserProfile(session.user)
                } else {
                  console.error('Profile fetch error:', profileError)
                }
              } else {
                setProfile(profileData)
              }
            })
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