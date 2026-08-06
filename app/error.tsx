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
    // The Error object already carries message, stack and digest.
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="max-w-md">
        <h1 className="mb-4 text-6xl font-bold text-destructive">Error</h1>
        <h2 className="mb-6 text-2xl font-semibold text-foreground">Something went wrong</h2>
        <p className="mb-8 text-muted-foreground">
          An unexpected error occurred. Our team has been notified.
        </p>
        {/* The digest is worth showing — it's what support can correlate to a
            server log. The raw message, path and timestamp are not. */}
        {error.digest && (
          <p className="mb-8 text-sm text-muted-foreground">
            Reference ID: <span className="font-mono">{error.digest}</span>
            <br />
            Quote this if you contact support.
          </p>
        )}
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