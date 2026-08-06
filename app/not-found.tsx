import Link from 'next/link';

/**
 * 404. A server component — the debug block it used to render (timestamps, a
 * random debug id, the current URL) was the only reason it needed 'use client'
 * and browser APIs at all.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="max-w-md">
        <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
        <h2 className="mb-6 text-2xl font-semibold text-foreground">Page Not Found</h2>
        <p className="mb-8 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
        >
          Go to Orders
        </Link>
      </div>
    </div>
  );
}
