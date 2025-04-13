'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

function CallbackContent() {
  const [status, setStatus] = useState('Processing authentication...')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams?.get('next') || '/dashboard/orders'
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('Checking for session...')
        const supabase = createClient()
        
        // First check if Supabase has already processed the session via detectSessionInUrl
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Error checking session:', sessionError)
          setError(`Authentication error: ${sessionError.message}`)
          return
        }
        
        if (session) {
          console.log('Session established:', session.user.email)
          
          // Store authentication information in localStorage for verification and recovery
          localStorage.setItem('auth_completed', 'true')
          localStorage.setItem('auth_timestamp', Date.now().toString())
          localStorage.setItem('auth_user_id', session.user.id)
          localStorage.setItem('auth_in_progress', 'false')
          
          if (session.user.email) {
            localStorage.setItem('auth_email', session.user.email)
            localStorage.setItem('auth_email_temp', session.user.email)
          }
          
          setStatus('Authentication successful, redirecting...')
          
          // Redirect to the next page
          setTimeout(() => {
            router.push(next)
          }, 500)
          return
        }
        
        // If no session was automatically detected, try to handle the parameters manually
        const url = new URL(window.location.href)
        const token = url.searchParams.get('token')
        const type = url.searchParams.get('type')
        const code = url.searchParams.get('code')
        
        console.log('URL parameters:', { 
          token: token ? 'present' : 'missing', 
          type, 
          code: code ? 'present' : 'missing',
          next
        })
        
        if (token && type === 'magiclink') {
          setStatus('Processing magic link token...')
          
          // Handle the token using verifyOtp
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'magiclink',
          })
          
          if (error) {
            console.error('Verification error:', error)
            setError(`Verification error: ${error.message}`)
          } else if (data.session) {
            console.log('Session established via manual verification:', data.session.user.email)
            
            // Store authentication information
            localStorage.setItem('auth_completed', 'true')
            localStorage.setItem('auth_timestamp', Date.now().toString())
            localStorage.setItem('auth_user_id', data.session.user.id)
            localStorage.setItem('auth_in_progress', 'false')
            
            if (data.session.user.email) {
              localStorage.setItem('auth_email', data.session.user.email)
              localStorage.setItem('auth_email_temp', data.session.user.email)
            }
            
            setStatus('Authentication successful, redirecting...')
            
            // Redirect to the next page
            setTimeout(() => {
              router.push(next)
            }, 500)
          } else {
            setError('Authentication successful but no session data received')
          }
        } else if (code) {
          setStatus('Processing authentication code...')
          
          // The code should be automatically handled by detectSessionInUrl
          // But we can manually exchange it if needed
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error('Code exchange error:', error)
            setError(`Authentication error: ${error.message}`)
          } else if (data.session) {
            console.log('Session established via code exchange:', data.session.user.email)
            
            // Store authentication information
            localStorage.setItem('auth_completed', 'true')
            localStorage.setItem('auth_timestamp', Date.now().toString())
            localStorage.setItem('auth_user_id', data.session.user.id)
            localStorage.setItem('auth_in_progress', 'false')
            
            if (data.session.user.email) {
              localStorage.setItem('auth_email', data.session.user.email)
              localStorage.setItem('auth_email_temp', data.session.user.email)
            }
            
            setStatus('Authentication successful, redirecting...')
            
            // Redirect to the next page
            setTimeout(() => {
              router.push(next)
            }, 500)
          } else {
            setError('Authentication successful but no session data received')
          }
        } else {
          // Check for hash fragment authentication
          const hash = window.location.hash
          
          if (hash && (hash.includes('access_token=') || hash.includes('error='))) {
            setStatus('Processing hash fragment authentication...')
            
            // Parse the hash fragment
            const hashParams = new URLSearchParams(hash.substring(1))
            const accessToken = hashParams.get('access_token')
            const refreshToken = hashParams.get('refresh_token')
            const hashError = hashParams.get('error')
            const hashErrorDescription = hashParams.get('error_description')
            
            if (hashError) {
              console.error('Hash fragment error:', hashError, hashErrorDescription)
              setError(`Authentication error: ${hashErrorDescription || hashError}`)
            } else if (accessToken && refreshToken) {
              setStatus('Found access and refresh tokens, setting up session...')
              
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              })
              
              if (error) {
                console.error('Error setting session from hash tokens:', error.message)
                setError(`Authentication error: ${error.message}`)
              } else if (data.session) {
                console.log('Session established via hash fragment:', data.session.user.email)
                
                // Clear the hash to prevent token exposure
                window.history.replaceState(null, '', window.location.pathname + window.location.search)
                
                // Store authentication information
                localStorage.setItem('auth_completed', 'true')
                localStorage.setItem('auth_timestamp', Date.now().toString())
                localStorage.setItem('auth_user_id', data.session.user.id)
                localStorage.setItem('auth_in_progress', 'false')
                
                if (data.session.user.email) {
                  localStorage.setItem('auth_email', data.session.user.email)
                  localStorage.setItem('auth_email_temp', data.session.user.email)
                }
                
                setStatus('Authentication successful, redirecting...')
                
                // Redirect to the next page
                setTimeout(() => {
                  router.push(next)
                }, 500)
              } else {
                setError('Authentication successful but no session data received')
              }
            } else {
              setError('No access or refresh tokens found in URL hash')
            }
          } else {
            setError('No valid authentication parameters found')
          }
        }
      } catch (error) {
        console.error('Error processing authentication:', error)
        setError(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    handleCallback()
  }, [router, next])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-md">
        <h1 className="mb-4 text-xl font-semibold text-gray-800">Authentication</h1>
        
        {error ? (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
            <p>{error}</p>
            <button 
              onClick={() => router.push('/auth/signin')}
              className="mt-4 rounded-md bg-red-100 px-4 py-2 text-red-800 hover:bg-red-200"
            >
              Return to Sign In
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <p className="text-center text-gray-600">{status}</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="animate-pulse h-full w-full bg-blue-500"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-md">
          <h1 className="mb-4 text-xl font-semibold text-gray-800">Authentication</h1>
          <div className="flex flex-col items-center space-y-4">
            <p className="text-center text-gray-600">Loading authentication...</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="animate-pulse h-full w-full bg-blue-500"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}
