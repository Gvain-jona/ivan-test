'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, Mail, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'

export default function VerifyEmailPage() {
  const { user, profile, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard/orders'
  
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
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
        setSuccess('Email verification successful. You will be redirected shortly.')
        
        // Redirect to setup PIN page after a short delay
        setTimeout(() => {
          router.push(`/auth/setup-pin?redirect=${encodeURIComponent(redirect)}`)
        }, 2000)
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

  // Get current year for copyright
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-5">
        <div className="absolute inset-0 bg-grid-foreground/[0.05] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]"></div>
      </div>
      <div className="w-full max-w-md px-4 relative z-10">
        {/* Company Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="relative h-16 w-16 mb-2 overflow-hidden">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-orange-600 flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20 animate-pulse-slow">
              <span className="text-xl">IP</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Ivan Prints</h1>
          <p className="text-sm text-muted-foreground">Business Management System</p>
        </div>
        
        <Card className="w-full border-border/60 shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Verify Your Email
            </CardTitle>
            <CardDescription className="text-center">
              Enter the verification code sent to your email
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Error message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success message */}
            {success && (
              <Alert className="bg-green-500/10 text-green-500 border-green-500/20">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleVerifySubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label htmlFor="code" className="text-sm font-medium flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Verification Code
                  </label>
                  <div className="relative">
                    <Input
                      id="code"
                      type="text"
                      placeholder="123456"
                      value={verificationCode}
                      onChange={(e) => {
                        // Only allow numbers
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setVerificationCode(value);
                      }}
                      required
                      maxLength={6}
                      disabled={isSubmitting}
                      className="bg-muted/30 border-border text-center text-lg tracking-widest"
                      autoFocus
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs text-primary">{verificationCode.length}/6</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Check your email inbox for the verification code
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || verificationCode.length !== 6}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {isSubmitting ? 'Verifying...' : 'Verify Email'}
                </Button>
              </div>
            </form>
          </CardContent>
          
          <CardFooter className="flex justify-center pt-2 pb-4">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code? <Link href="#" className="text-primary hover:underline">Resend code</Link>
            </p>
          </CardFooter>
        </Card>
        
        {/* Copyright Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>&copy; {currentYear} Ivan Prints. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
