'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/context/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function VerifyPin() {
  const [pin, setPin] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const { user, profile, verifyPin, signOut } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams?.get('redirect') || '/dashboard/orders'

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      router.push('/auth/signin')
      return
    }

    // Check if user has a PIN
    if (!profile?.pin) {
      router.push('/auth/setup-pin')
      return
    }

    setIsLoading(false)
  }, [user, profile, router])

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      setIsLoading(true)

      // Verify PIN
      const isValid = await verifyPin(pin)

      if (!isValid) {
        // Increment attempts
        const newAttempts = attempts + 1
        setAttempts(newAttempts)

        // If too many attempts, sign out
        if (newAttempts >= 3) {
          await signOut()
          router.push('/auth/signin')
          return
        }

        throw new Error(`Invalid PIN. ${3 - newAttempts} attempts remaining.`)
      }

      // Redirect to dashboard
      router.push(redirectTo)
    } catch (err: any) {
      console.error('PIN verification error:', err)
      setError(err.message || 'Failed to verify PIN. Please try again.')
      setIsLoading(false)
    }
  }

  if (isLoading && !error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Enter Your PIN</CardTitle>
          <CardDescription className="text-center">
            Please enter your PIN to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN"
                className="w-full"
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify PIN'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="flex justify-center w-full">
            <Link href={`/auth/forgot-pin?redirect=${encodeURIComponent(redirectTo)}`} className="text-sm text-primary hover:underline">
              Forgot PIN?
            </Link>
          </div>
          <div className="flex justify-center w-full">
            <Button
              variant="ghost"
              onClick={signOut}
              className="text-sm text-muted-foreground"
            >
              Sign out
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
