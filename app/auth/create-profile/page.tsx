'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/context/auth-context'
import { createClient } from '@/app/lib/supabase/client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CreateProfilePage() {
  const { user, profile, isLoading } = useAuth()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  // If user already has a profile, redirect to dashboard
  useEffect(() => {
    if (profile) {
      router.push('/dashboard/orders')
    }
  }, [profile, router])

  const handleCreateProfile = async () => {
    if (!user) {
      setError('You must be signed in to create a profile')
      return
    }

    setCreating(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()

      // First, check if the profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (existingProfile) {
        setSuccess('Profile already exists. Redirecting to dashboard...')
        setTimeout(() => {
          router.push('/dashboard/orders')
        }, 2000)
        return
      }

      // Check if the user is in the allowed_emails table and get their role
      const { data: allowedEmail, error: allowedEmailError } = await supabase
        .from('allowed_emails')
        .select('role')
        .eq('email', user.email)
        .maybeSingle()

      // Use the role from allowed_emails if available, otherwise default to 'staff'
      const userRole = allowedEmail?.role || 'staff'
      console.log(`Using role from allowed_emails: ${userRole} for user ${user.email}`)

      // Create a new profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: userRole, // Use role from allowed_emails
          status: 'active',
          is_verified: false, // They need to set up a PIN
          failed_attempts: 0
        })

      if (insertError) {
        console.error('Error creating profile:', insertError)
        setError(`Failed to create profile: ${insertError.message}`)
      } else {
        setSuccess('Profile created successfully. Redirecting to setup PIN...')
        setTimeout(() => {
          router.push('/auth/setup-pin')
        }, 2000)
      }
    } catch (error) {
      console.error('Exception creating profile:', error)
      setError(`An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Not Signed In</CardTitle>
            <CardDescription>You must be signed in to create a profile</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/auth/signin')} className="w-full">
              Go to Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Create Profile</CardTitle>
          <CardDescription className="text-center">
            Create a profile for your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-primary/10 text-primary">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <p className="text-sm">
              User ID: <span className="font-mono">{user.id}</span>
            </p>
            <p className="text-sm">
              Email: <span className="font-mono">{user.email}</span>
            </p>
          </div>

          <Button
            onClick={handleCreateProfile}
            className="w-full"
            disabled={creating}
          >
            {creating ? 'Creating Profile...' : 'Create Profile'}
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => router.push('/auth/signin')}
            className="text-sm text-muted-foreground"
          >
            Back to Sign In
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
