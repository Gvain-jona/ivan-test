'use client';

import * as Sentry from '@sentry/nextjs';
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
    // Forward the full error to Sentry for server-side debugging
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 text-center">
      <div className="max-w-md">
        <h1 className="mb-4 text-6xl font-bold text-red-500">Error</h1>
        <h2 className="mb-6 text-2xl font-semibold text-white">Something went wrong</h2>
        <p className="mb-8 text-gray-400">
          An unexpected error occurred. Our team has been notified.
        </p>
        {error.digest && (
          <div className="text-sm text-gray-500 mb-4">
            <p>Error ID: {error.digest}</p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-md bg-orange-500 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Try Again
          </button>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-md bg-gray-800 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
