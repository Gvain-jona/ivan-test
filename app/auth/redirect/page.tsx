'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getBaseUrl } from '@/app/lib/auth/session-utils'

/**
 * Client-side redirect page
 * Handles retrieving the redirect path from localStorage and redirecting the user
 */
export default function RedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Get the redirect path from localStorage or use a default
    let redirectPath = '/dashboard/orders'
    
    try {
      const storedPath = localStorage.getItem('auth_redirect_path')
      if (storedPath) {
        redirectPath = storedPath
        // Clear the stored path after using it
        localStorage.removeItem('auth_redirect_path')
      }
    } catch (e) {
      console.error('Error accessing localStorage:', e)
    }
    
    // Ensure the path starts with a slash
    if (!redirectPath.startsWith('/')) {
      redirectPath = `/${redirectPath}`
    }
    
    console.log('Redirecting to:', redirectPath)
    
    // Use router.push for client-side navigation
    router.push(redirectPath)
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Redirecting...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You are being redirected to your destination.
          </p>
        </div>
      </div>
    </div>
  )
}
