'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to the console for debugging
    console.error('===== APP ERROR BOUNDARY TRIGGERED =====');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Timestamp:', new Date().toISOString());
    console.error('Error digest:', error.digest);
    console.error('Current URL:', typeof window !== 'undefined' ? window.location.href : 'Server-side rendering');
    console.error('Current pathname:', typeof window !== 'undefined' ? window.location.pathname : 'Server-side rendering');
    console.error('Window history length:', typeof window !== 'undefined' ? window.history.length : 'Server-side rendering');
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="max-w-md">
        <h1 className="mb-4 text-6xl font-bold text-destructive">Error</h1>
        <h2 className="mb-6 text-2xl font-semibold text-foreground">Something went wrong</h2>
        <p className="mb-8 text-muted-foreground">
          An unexpected error occurred. Our team has been notified.
        </p>
        <div className="text-sm text-muted-foreground mb-4">
          <p>Error ID: {error.digest || 'unknown'}</p>
          <p>Error Message: {error.message || 'No message'}</p>
          <p>Timestamp: {new Date().toISOString()}</p>
          <p>Path: {typeof window !== 'undefined' ? window.location.pathname : 'Unknown'}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            Try Again
          </button>
          <Link
            href="/auth/signin"
            className="inline-flex items-center justify-center rounded-md bg-secondary px-6 py-3 text-sm font-medium text-secondary-foreground shadow-sm hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}