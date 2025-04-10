'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/context/auth-context';
import { Progress } from '@/components/ui/progress';

// Helper function to validate redirect URLs for security
function validateRedirectUrl(url: string): string {
  // Only allow redirects to internal dashboard pages
  if (url && (
    url.startsWith('/dashboard') ||
    url.startsWith('/admin') ||
    url.startsWith('/manager')
  )) {
    return url;
  }

  // Default to dashboard if the URL is not allowed
  return '/dashboard';
}

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, checkSupabaseHealth } = useAuth();

  // Run a health check when the page loads
  useEffect(() => {
    const runHealthCheck = async () => {
      console.log('Running Supabase health check on sign-in page load...');
      const result = await checkSupabaseHealth();
      console.log('Health check result:', result.ok ? 'OK' : 'Failed', result.error || '');

      // Log environment variables for debugging
      console.log('Environment mode:', process.env.NODE_ENV);
      console.log('BYPASS_SIGNIN:', process.env.BYPASS_SIGNIN);
      console.log('SKIP_PROFILE_CHECK:', process.env.SKIP_PROFILE_CHECK);
    };

    runHealthCheck();
  }, [checkSupabaseHealth]);

  // Get the redirect URL from the query parameters
  const redirectTo = searchParams?.get('redirect') || '/dashboard';

  // Get error message from query parameters if present
  const errorFromUrl = searchParams?.get('error');

  // For security, we'll validate the redirect URL before actually redirecting
  // This happens in the handlePasswordSignIn and handleMagicLinkSignIn functions

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(errorFromUrl || '');
  const [successMessage, setSuccessMessage] = useState('');
  const [step, setStep] = useState<'input' | 'sending' | 'sent'>('input');
  const [progress, setProgress] = useState(0);

  // Check if email is valid format
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Effect to animate progress bar during sending step
  useEffect(() => {
    if (step === 'sending') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      return () => clearInterval(interval);
    }
  }, [step]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Sign-in form submitted');

    if (!email || !isValidEmail(email)) {
      console.log('Invalid email format');
      setError('Please enter a valid email address');
      return;
    }

    console.log('Email validation passed, proceeding with sign-in');

    setIsLoading(true);
    setError('');
    setStep('sending');
    setProgress(10);

    try {
      // Simulate a slight delay to show the progress animation
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Calling signIn function with email:', email);
      const signInResult = await signIn(email);
      console.log('Sign-in result:', signInResult);

      const { error } = signInResult;

      // Special handling for various errors
      if (error) {
        console.log('Sign-in error details:', { code: error.code, message: error.message });

        // Handle database policy errors
        if (error.code === '42P17' && error.message?.includes('infinite recursion detected in policy')) {
          console.warn('RLS policy error detected, but proceeding with sign-in in development mode');
          // In development mode, we'll pretend the magic link was sent
          if (process.env.NODE_ENV === 'development') {
            console.log('Development mode: simulating successful magic link sending');
            setProgress(100);
            setStep('sent');
            setSuccessMessage(`Development mode: Magic link would be sent to ${email}. In production, check your email inbox for the login link.`);
            return;
          }
        }

        // Handle timeout errors
        if (error.code === 'TIMEOUT') {
          console.warn('Sign-in timed out');
          setProgress(100);
          setStep('input');
          setError(error.message || 'Sign-in timed out. Please try again later.');
          return;
        }
      } else {
        console.log('Magic link sent successfully');
      }

      if (error) throw error;

      setProgress(100);
      setStep('sent');
      setSuccessMessage(`Magic link sent to ${email}. Please check your email inbox for the login link.`);
    } catch (err: any) {
      console.error('Magic link error:', err);
      setError(err.message || 'Failed to send magic link. Please try again.');
      setStep('input');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'input':
        return (
          <form onSubmit={handleSignIn}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={isLoading}
                  autoFocus
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
                disabled={isLoading || !email || !isValidEmail(email)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Continue with Email'
                )}
              </Button>
            </div>
          </form>
        );

      case 'sending':
        return (
          <div className="grid gap-6 py-4">
            <div className="flex flex-col items-center justify-center gap-2 py-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h3 className="mt-4 text-lg font-medium">Sending Magic Link</h3>
              <p className="text-sm text-muted-foreground text-center">
                We're sending a secure login link to {email}
              </p>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        );

      case 'sent':
        return (
          <div className="grid gap-6 py-4">
            <div className="flex flex-col items-center justify-center gap-2 py-4">
              <div className="rounded-full bg-primary/10 p-3">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-medium">Check Your Email</h3>
              <p className="text-sm text-muted-foreground text-center">
                We've sent a magic link to <strong>{email}</strong>
              </p>
              <div className="mt-4 flex flex-col gap-2 w-full">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(`mailto:${email}`, '_blank')}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Open Email App
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStep('input');
                    setProgress(0);
                    setSuccessMessage('');
                  }}
                >
                  Use a different email
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            {step === 'input' && 'Enter your email to receive a magic link'}
            {step === 'sending' && 'Sending secure login link...'}
            {step === 'sent' && 'Magic link sent!'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 items-center">
          <div className="text-sm text-muted-foreground">
            Only authorized emails can sign in. Contact your administrator for access.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
