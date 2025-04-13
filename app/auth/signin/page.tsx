'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { AlertCircle, CheckCircle, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
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

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(errorFromUrl || '');
  const [redirect, setRedirect] = useState(redirectTo);

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

    if (!email || !isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');
    setStep('sending');
    setProgress(10);

    try {
      // Simulate a slight delay to show the progress animation
      await new Promise(resolve => setTimeout(resolve, 1000));

      const signInResult = await signIn(email, redirect);
      const { error } = signInResult;

      if (error) {
        setError(error.message || 'Failed to send OTP. Please try again.');
        setStep('input');
      } else {
        setProgress(100);
        setStep('sent');
        // Success message is displayed in the UI directly
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
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
            <div className="form-group">
              <label htmlFor="email" className="signin-input-label">Email Address</label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <Mail size={18} color="#f97316" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={isLoading}
                  autoFocus
                  className="signin-input"
                />
              </div>
              <p className="help-text">We'll send a verification code to this email</p>
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="signin-button"
              disabled={isLoading || !email || !isValidEmail(email)}
            >
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Loader2 size={20} className="animate-spin" style={{ marginRight: '8px' }} />
                  Sending...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Continue with Email
                  <ArrowRight size={20} style={{ marginLeft: '8px' }} />
                </span>
              )}
            </button>
          </form>
        );

      case 'sending':
        return (
          <div className="loading-state">
            <div className="loading-icon-container">
              <div className="loading-icon-pulse" />
              <div className="loading-icon-wrapper">
                <Loader2 size={48} color="#f97316" className="animate-spin" />
              </div>
            </div>
            <h3 className="loading-title">Sending Verification Code</h3>
            <p className="loading-description">
              We're sending a verification code to <span className="email-highlight">{email}</span>
            </p>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        );

      case 'sent':
        return (
          <div className="success-state">
            <div className="success-icon-container">
              <div className="success-icon-pulse" />
              <div className="success-icon-wrapper">
                <CheckCircle size={48} color="#f97316" />
              </div>
            </div>
            <h3 className="success-title">Check Your Email</h3>
            <p className="success-description">
              We've sent a verification code to <span className="email-highlight">{email}</span>
            </p>
            <div className="action-buttons">
              <button
                className="primary-action-button"
                onClick={() => window.open(`mailto:${email}`, '_blank')}
              >
                <Mail size={20} style={{ marginRight: '8px' }} />
                <span>Open Email App</span>
              </button>
              <button
                className="secondary-action-button"
                onClick={() => {
                  setStep('input');
                  setProgress(0);
                }}
              >
                Use a different email
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
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
          <h2 className="signin-title" style={{ textAlign: 'center', marginBottom: '6px', fontSize: '22px' }}>
            {step === 'input' && 'Sign In'}
            {step === 'sending' && 'Verifying'}
            {step === 'sent' && 'Check Your Email'}
          </h2>
          <p style={{ textAlign: 'center', color: '#a1a1aa', fontSize: '14px' }}>
            {step === 'input' && 'Enter your email to receive a verification code'}
            {step === 'sending' && 'Sending verification code...'}
            {step === 'sent' && 'Verification code sent!'}
          </p>
        </div>

        <div className="signin-card-content">
          {renderStepContent()}
        </div>

        <div className="signin-card-footer">
          Only authorized emails can sign in.<br />
          Contact your administrator for access.
        </div>
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
