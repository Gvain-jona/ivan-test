'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function TestSupabasePage() {
  const [email, setEmail] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const supabase = createClient();
        console.log('Supabase client created');
        
        // Try a simple query to check connection
        const { error } = await supabase.from('profiles').select('count').limit(1).maybeSingle();
        
        if (error) {
          console.error('Error connecting to Supabase:', error);
          setConnectionStatus('error');
          setConnectionError(error.message);
        } else {
          console.log('Successfully connected to Supabase');
          setConnectionStatus('connected');
        }
      } catch (error) {
        console.error('Exception checking Supabase connection:', error);
        setConnectionStatus('error');
        setConnectionError(error instanceof Error ? error.message : 'Unknown error');
      }
    };
    
    checkConnection();
  }, []);

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const supabase = createClient();
      console.log('Testing magic link with email:', email);
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true
        },
      });
      
      if (error) {
        console.error('Error sending magic link:', error);
        setTestResult({ success: false, message: `Error: ${error.message}` });
      } else {
        console.log('Magic link sent successfully');
        setTestResult({ success: true, message: `Magic link sent to ${email}. Please check your email.` });
      }
    } catch (error) {
      console.error('Exception sending magic link:', error);
      setTestResult({ 
        success: false, 
        message: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Test Supabase Connection</CardTitle>
          <CardDescription className="text-center">
            Check if Supabase is configured correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connectionStatus === 'checking' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Checking connection to Supabase...</AlertDescription>
            </Alert>
          )}
          
          {connectionStatus === 'connected' && (
            <Alert className="bg-primary/10 text-primary">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Successfully connected to Supabase</AlertDescription>
            </Alert>
          )}
          
          {connectionStatus === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error connecting to Supabase: {connectionError}
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleTestEmail}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Test Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || connectionStatus !== 'connected'}
                />
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !email || connectionStatus !== 'connected'}
              >
                {isLoading ? 'Testing...' : 'Test Magic Link'}
              </Button>
            </div>
          </form>
          
          {testResult && (
            <Alert variant={testResult.success ? 'default' : 'destructive'} className={testResult.success ? 'bg-primary/10 text-primary' : ''}>
              {testResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>{testResult.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            This page tests the Supabase connection and magic link functionality
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
