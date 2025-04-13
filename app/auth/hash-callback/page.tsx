'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

export default function HashCallbackPage() {
  const [status, setStatus] = useState('Processing authentication...')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams?.get('next') || '/dashboard/orders'

  useEffect(() => {
    const processHashFragment = async () => {
      try {
        // Check if we have a hash fragment
        if (typeof window !== 'undefined' && window.location.hash) {
          setStatus('Hash fragment detected, processing tokens...')
          console.log('Hash fragment detected in URL, attempting to process...')
          
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          
          if (accessToken && refreshToken) {
            setStatus('Found access and refresh tokens, setting up session...')
            console.log('Found access and refresh tokens in hash fragment, setting session manually')
            
            const supabase = createClient()
            
            // Set the session directly with the tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
            
            if (error) {
              console.error('Error setting session from hash tokens:', error.message)
              setError(`Authentication error: ${error.message}`)
              return
            }
            
            console.log('Successfully set session from hash tokens')
            
            // Clear the hash to prevent token exposure
            window.history.replaceState(null, '', window.location.pathname + window.location.search)
            
            // Set user state in localStorage
            if (data.user) {
              console.log('User authenticated from hash fragment:', data.user.email)
              
              // Store authentication information
              localStorage.setItem('auth_completed', 'true')
              localStorage.setItem('auth_timestamp', Date.now().toString())
              localStorage.setItem('auth_user_id', data.user.id)
              
              if (data.user.email) {
                localStorage.setItem('auth_email', data.user.email)
                localStorage.setItem('auth_email_temp', data.user.email)
              }
              
              setStatus('Authentication successful, redirecting...')
              
              // Redirect to the next page
              setTimeout(() => {
                router.push(next)
              }, 500)
            } else {
              setError('Authentication successful but no user data received')
            }
          } else {
            setError('No access or refresh tokens found in URL hash')
          }
        } else {
          setError('No hash fragment found in URL')
        }
      } catch (error) {
        console.error('Error processing hash fragment:', error)
        setError(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    processHashFragment()
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
