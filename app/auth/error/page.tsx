'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

/**
 * Authentication error page
 * Displays error messages from the authentication process
 */

// Component to handle the actual error display logic
function ErrorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string>('')
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // Get the error message from the URL
    const errorMessage = searchParams.get('error') || 'An unknown error occurred'
    setError(decodeURIComponent(errorMessage))

    // Start countdown for auto-redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Use window.location instead of router.push to avoid React state updates during render
          window.location.href = '/auth/signin'
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              {error}
            </p>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            This could be due to an expired or invalid authentication link.
          </p>
          {error.includes('code challenge') && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-700">
                <strong>Tip:</strong> This error often occurs when using the same magic link twice or after clearing browser cookies.
              </p>
            </div>
          )}
          <p className="mt-6 text-sm text-gray-600">
            Redirecting to sign-in page in {countdown} seconds...
          </p>
          <div className="mt-4">
            <Link 
              href="/auth/signin"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main component with Suspense boundary
export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
          <p className="mt-2">Please wait while we process your request.</p>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
