'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/context/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Lock, KeyRound } from 'lucide-react'

// PIN validation schema
const pinSchema = z.string().min(4, { message: 'PIN must be at least 4 digits' }).regex(/^\d+$/, { message: 'PIN must contain only numbers' })

export default function SetupPin() {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const { user, profile, setPin: savePin } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams?.get('redirect') || '/dashboard/orders'

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      router.push('/auth/signin')
      return
    }

    // Check if user already has a PIN
    if (profile?.pin) {
      router.push('/auth/verify-pin')
      return
    }

    setIsLoading(false)
  }, [user, profile, router])

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      // Validate PIN format
      try {
        pinSchema.parse(pin)
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          throw new Error(validationError.errors[0].message)
        }
        throw validationError
      }

      // Check if PINs match
      if (pin !== confirmPin) {
        setError('PINs do not match')
        return
      }

      setIsLoading(true)

      // Save PIN
      const { error } = await savePin(pin)

      if (error) throw error

      // Redirect to dashboard
      router.push(redirectTo)
    } catch (err: any) {
      console.error('PIN setup error:', err)
      setError(err.message || 'Failed to set PIN. Please try again.')
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
          <CardTitle className="text-2xl text-center">Set Your PIN</CardTitle>
          <CardDescription className="text-center">
            Create a PIN to secure your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSetPin} className="space-y-5">
            <div className="grid gap-3">
              <Label htmlFor="pin" className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span>PIN (minimum 4 digits)</span>
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

            <div className="grid gap-3">
              <Label htmlFor="confirmPin" className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span>Confirm PIN</span>
              </Label>
              <Input
                id="confirmPin"
                type="password"
                inputMode="numeric"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Confirm PIN"
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
              {isLoading ? 'Setting PIN...' : 'Set PIN'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col items-center space-y-4 pb-6">
          <p className="text-sm text-muted-foreground">
            You'll need this PIN to access the application
          </p>
          <p className="text-xs text-muted-foreground/60 mt-4">
            © {new Date().getFullYear()} Ivan Prints. All rights reserved.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
