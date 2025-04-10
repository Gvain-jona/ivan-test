'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/context/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Lock, KeyRound } from 'lucide-react'
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
      <Card className="w-full max-w-md overflow-hidden border-border/60">
        {/* Branded header with gradient */}
        <div className="bg-gradient-to-r from-primary to-orange-600 p-6 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-4 shadow-lg">
            <div className="w-12 h-12 relative">
              <Image
                src="/images/default-logo.svg"
                alt="Ivan Prints Logo"
                fill
                className="object-contain"
              />
            </div>
          </div>
          <h1 className="text-white font-bold text-2xl">Ivan Prints</h1>
          <p className="text-white/80 text-sm">Business Management System</p>
        </div>

        <CardHeader className="space-y-1 pt-6">
          <div className="flex items-center justify-center mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Enter Your PIN</CardTitle>
          <CardDescription className="text-center">
            Please enter your PIN to continue
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleVerifyPin} className="space-y-5">
            <div className="grid gap-3">
              <Label htmlFor="pin" className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span>PIN</span>
              </Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN"
                className="w-full border-border/60 focus:border-primary/60 transition-colors"
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
              className="w-full bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify PIN'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col items-center space-y-4 pb-6">
          <div className="flex justify-between w-full px-4">
            <Link href={`/auth/forgot-pin?redirect=${encodeURIComponent(redirectTo)}`} className="text-sm text-primary hover:underline">
              Forgot PIN?
            </Link>
            <Button
              variant="ghost"
              onClick={signOut}
              className="text-sm text-muted-foreground hover:text-primary"
              size="sm"
            >
              Sign out
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/60 mt-4">
            © {new Date().getFullYear()} Ivan Prints. All rights reserved.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
