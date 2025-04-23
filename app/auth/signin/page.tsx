'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { AlertCircle, CheckCircle, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import { GoogleSignInButton } from '@/components/auth/google-button';
import './signin.css';

function SignInContent() {
  const searchParams = useSearchParams();
  const { signIn, checkSupabaseHealth, user } = useAuth();
  const router = useRouter();

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user) {
      console.log('User already authenticated, redirecting to dashboard');
      const redirectTo = searchParams?.get('redirect') || '/dashboard/orders';
      router.push(redirectTo);
    }
  }, [user, router, searchParams]);

  // Run a health check when the page loads
  useEffect(() => {
    const runHealthCheck = async () => {
      console.log('Running Supabase health check');
      const result = await checkSupabaseHealth();
      if (!result.ok) {
        console.error('Supabase health check failed:', result.error);
      } else {
        console.log('Supabase health check passed');
      }
    };

    runHealthCheck();
  }, [checkSupabaseHealth]);

  // Get parameters from URL
  const errorFromUrl = searchParams?.get('error');
  const redirectTo = searchParams?.get('redirect') || '/dashboard/orders';

  const [error, setError] = useState<string | null>(errorFromUrl || null);



  const renderContent = () => {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">Welcome Back</h3>
          <p className="mt-2 text-sm text-gray-600">
            Sign in with your Google account to continue
          </p>
        </div>

        <GoogleSignInButton />

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Only authorized Google accounts can sign in.<br />Contact your administrator for access.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="signin-container">
      {/* Background patterns */}
      <div className="grid-pattern" />
      <div className="starry-background" />

      {/* Company logo and branding */}
      <div className="logo-container">
        <div className="relative w-16 h-16">
          <Image
            src="/images/default-logo.svg"
            alt="Ivan Prints Logo"
            className="signin-logo"
            fill
            priority
          />
        </div>
        <h1 className="signin-title">Ivan Prints</h1>
        <p className="signin-subtitle">Print Management System</p>
      </div>

      <div className="signin-card">
        <div className="signin-card-header">
          <h2 className="signin-title text-center mb-1.5 text-[22px]">
            Sign In
          </h2>
          <p className="text-center text-zinc-400 text-sm">
            Continue with your Google account
          </p>
        </div>

        <div className="signin-card-content">
          {renderContent()}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200">
            {error && (
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="signin-footer">
        &copy; {new Date().getFullYear()} Ivan Prints. All rights reserved.
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="signin-container">
        <div className="grid-pattern" />
        <div className="starry-background" />
        <div className="flex items-center justify-center min-h-screen">
          <div className="signin-card">
            <div className="signin-card-content">
              <div className="flex flex-col items-center justify-center p-8">
                <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
