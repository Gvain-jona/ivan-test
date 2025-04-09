'use client'

import { useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function FixProfileRLSPage() {
  const [isFixing, setIsFixing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [sqlResult, setSqlResult] = useState<string | null>(null)
  const router = useRouter()
  
  const handleFixRLS = async () => {
    setIsFixing(true)
    setError(null)
    setSuccess(null)
    setSqlResult(null)
    
    try {
      const supabase = createClient()
      
      // First, check if we can connect to Supabase
      const { data: versionData, error: versionError } = await supabase.rpc('verify_pin', { pin_to_verify: '0000' })
      
      if (versionError) {
        console.error('Error connecting to Supabase:', versionError)
        setError(`Failed to connect to Supabase: ${versionError.message}`)
        setIsFixing(false)
        return
      }
      
      // Execute SQL to fix the RLS policy
      // Note: This requires admin privileges, so it will only work if the user has admin access
      const { data, error: sqlError } = await supabase.rpc('admin_fix_profiles_rls')
      
      if (sqlError) {
        console.error('Error fixing RLS policy:', sqlError)
        setError(`Failed to fix RLS policy: ${sqlError.message}. Please run the SQL manually in the Supabase SQL editor.`)
        setSqlResult(`
-- Run this SQL in the Supabase SQL editor:

-- Drop the existing policy
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."profiles";

-- Create a new policy that allows authenticated users to insert their own profile
CREATE POLICY "Enable insert for authenticated users only" 
ON "public"."profiles" 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Enable update for users based on id" ON "public"."profiles";
CREATE POLICY "Enable update for users based on id" 
ON "public"."profiles" 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Allow users to select their own profile
DROP POLICY IF EXISTS "Enable select for users based on id" ON "public"."profiles";
CREATE POLICY "Enable select for users based on id" 
ON "public"."profiles" 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);
`)
      } else {
        setSuccess('Successfully fixed RLS policy. You should now be able to create profiles.')
        setSqlResult(JSON.stringify(data, null, 2))
      }
    } catch (error) {
      console.error('Exception fixing RLS policy:', error)
      setError(`An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsFixing(false)
    }
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Fix Profile RLS Policy</CardTitle>
          <CardDescription className="text-center">
            Fix the Row Level Security policy for the profiles table
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
              This tool will fix the Row Level Security (RLS) policy for the profiles table, 
              allowing authenticated users to create their own profile.
            </p>
            
            {sqlResult && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">SQL Result:</p>
                <pre className="bg-muted p-2 rounded-md text-xs overflow-auto max-h-40">
                  {sqlResult}
                </pre>
              </div>
            )}
          </div>
          
          <Button
            onClick={handleFixRLS}
            className="w-full"
            disabled={isFixing}
          >
            {isFixing ? 'Fixing RLS Policy...' : 'Fix RLS Policy'}
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => router.push('/auth/create-profile')}
            className="text-sm text-muted-foreground"
          >
            Go to Create Profile
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
