'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/context/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

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
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Set Your PIN</CardTitle>
          <CardDescription className="text-center">
            Create a PIN to secure your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetPin} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="pin">PIN (minimum 4 digits)</Label>
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

            <div className="grid gap-2">
              <Label htmlFor="confirmPin">Confirm PIN</Label>
              <Input
                id="confirmPin"
                type="password"
                inputMode="numeric"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Confirm PIN"
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
              {isLoading ? 'Setting PIN...' : 'Set PIN'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            You'll need this PIN to access the application
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
