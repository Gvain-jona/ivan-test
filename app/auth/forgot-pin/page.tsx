'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, ArrowLeft, Lock, KeyRound, Mail } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPinPage() {
  const { user, profile, isLoading, signIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard/orders'

  const [step, setStep] = useState<'input' | 'sent' | 'verify' | 'reset'>('input')
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progress, setProgress] = useState(0)

  // If user is already authenticated, use their email
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email)
    }
  }, [user])

  // Handle email submission
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    setProgress(25)

    try {
      // Simulate sending a verification code
      // In a real implementation, this would send an email with a verification code
      setProgress(50)
      await new Promise(resolve => setTimeout(resolve, 1000))
      setProgress(75)

      // For demo purposes, we'll use a fixed code
      // In production, generate a random code and store it in the database
      const code = '123456'

      // In production, you would update the user's profile with the verification code and expiry
      // For now, we'll just simulate success
      setProgress(100)
      setStep('sent')
      setSuccess(`Verification code sent to ${email}. Please check your email.`)

      // In production, this would be handled by your backend
      console.log(`Verification code for PIN reset: ${code}`)
    } catch (error) {
      setError('Failed to send verification code. Please try again.')
      console.error('Error sending verification code:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle verification code submission
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      // Simulate verifying the code
      await new Promise(resolve => setTimeout(resolve, 1000))

      // For demo purposes, we'll accept any 6-digit code
      // In production, verify against the stored code in the database
      if (verificationCode.length === 6) {
        setStep('reset')
        setSuccess('Verification successful. Please set a new PIN.')
      } else {
        setError('Invalid verification code. Please try again.')
      }
    } catch (error) {
      setError('Failed to verify code. Please try again.')
      console.error('Error verifying code:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle PIN reset
  const handlePinReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    // Validate PIN
    if (newPin.length < 4) {
      setError('PIN must be at least 4 digits')
      setIsSubmitting(false)
      return
    }

    if (!/^\d+$/.test(newPin)) {
      setError('PIN must contain only numbers')
      setIsSubmitting(false)
      return
    }

    if (newPin !== confirmPin) {
      setError('PINs do not match')
      setIsSubmitting(false)
      return
    }

    try {
      // In a real implementation, this would update the PIN in the database
      // For now, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000))

      setSuccess('PIN reset successful. You will be redirected to sign in.')

      // Redirect to verify PIN page after a short delay
      setTimeout(() => {
        router.push(`/auth/verify-pin?redirect=${encodeURIComponent(redirect)}`)
      }, 2000)
    } catch (error) {
      setError('Failed to reset PIN. Please try again.')
      console.error('Error resetting PIN:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render the appropriate step
  const renderStep = () => {
    switch (step) {
      case 'input':
        return (
          <form onSubmit={handleEmailSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>Email</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting || !!user?.email}
                  className="border-border/60 focus:border-primary/60 transition-colors"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !email}
                className="bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 transition-all duration-300"
              >
                {isSubmitting ? 'Sending...' : 'Send Verification Code'}
              </Button>
            </div>
          </form>
        )

      case 'sent':
        return (
          <form onSubmit={handleVerifySubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="code" className="text-sm font-medium flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  <span>Verification Code</span>
                </label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  maxLength={6}
                  disabled={isSubmitting}
                  className="border-border/60 focus:border-primary/60 transition-colors"
                />
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code sent to your email.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || verificationCode.length !== 6}
                className="bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 transition-all duration-300"
              >
                {isSubmitting ? 'Verifying...' : 'Verify Code'}
              </Button>
            </div>
          </form>
        )

      case 'reset':
        return (
          <form onSubmit={handlePinReset}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="newPin" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span>New PIN</span>
                </label>
                <Input
                  id="newPin"
                  type="password"
                  inputMode="numeric"
                  placeholder="Enter new PIN"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  required
                  minLength={4}
                  maxLength={6}
                  disabled={isSubmitting}
                  className="border-border/60 focus:border-primary/60 transition-colors"
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="confirmPin" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span>Confirm PIN</span>
                </label>
                <Input
                  id="confirmPin"
                  type="password"
                  inputMode="numeric"
                  placeholder="Confirm new PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  required
                  minLength={4}
                  maxLength={6}
                  disabled={isSubmitting}
                  className="border-border/60 focus:border-primary/60 transition-colors"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !newPin || !confirmPin}
                className="bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 transition-all duration-300"
              >
                {isSubmitting ? 'Resetting...' : 'Reset PIN'}
              </Button>
            </div>
          </form>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
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
          <div className="flex items-center">
            <Link href="/auth/verify-pin" className="mr-2">
              <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <KeyRound className="h-3 w-3 text-primary" />
                </div>
                <CardTitle className="text-xl">Forgot PIN</CardTitle>
              </div>
              <CardDescription>
                {step === 'input' && "We'll send a verification code to your email"}
                {step === 'sent' && "Enter the verification code sent to your email"}
                {step === 'reset' && "Create a new PIN"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress bar for email step */}
          {step === 'input' && progress > 0 && (
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-orange-600 h-full transition-all duration-500 ease-in-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success message */}
          {success && (
            <Alert className="bg-primary/10 text-primary">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {renderStep()}
        </CardContent>

        <CardFooter className="flex flex-col items-center space-y-4 pb-6">
          <div className="flex justify-center w-full">
            <p className="text-sm text-muted-foreground">
              Remember your PIN? <Link href="/auth/verify-pin" className="text-primary hover:underline">Sign in</Link>
            </p>
          </div>
          <p className="text-xs text-muted-foreground/60 mt-4">
            © {new Date().getFullYear()} Ivan Prints. All rights reserved.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
