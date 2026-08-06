'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function NotFound() {
  // Use state to store client-side values
  const [clientInfo, setClientInfo] = useState({
    timestamp: '',
    url: '',
    pathname: '',
    debugId: ''
  });

  console.log('===== NOT FOUND PAGE RENDERED =====');
  console.log('This should only show for genuinely missing routes');

  useEffect(() => {
    // Set client-side values after component mounts
    setClientInfo({
      timestamp: new Date().toISOString(),
      url: window.location.href,
      pathname: window.location.pathname,
      debugId: Math.random().toString(36).substring(2, 10)
    });

    // Client-side debugging
    console.log('===== NOT FOUND PAGE CLIENT-SIDE =====');
    console.log('Current timestamp:', new Date().toISOString());
    console.log('Window location:', window.location.href);
    console.log('Window pathname:', window.location.pathname);
    console.log('Window search:', window.location.search);
    console.log('Document title:', document.title);
    console.log('Document referrer:', document.referrer);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="max-w-md">
        <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
        <h2 className="mb-6 text-2xl font-semibold text-foreground">Page Not Found</h2>
        <p className="mb-8 text-muted-foreground">
          The route you requested could not be found.
        </p>
        <div className="text-sm text-muted-foreground mb-4">
          <p>===== NOT FOUND PAGE RENDERED =====</p>
          <p>This should only show for genuinely missing routes</p>
          {clientInfo.timestamp && (
            <>
              <p>Current timestamp: {clientInfo.timestamp}</p>
              <p>Debug ID: {clientInfo.debugId}</p>
              <p>Current URL: {clientInfo.url}</p>
              <p>Current pathname: {clientInfo.pathname}</p>
            </>
          )}
        </div>
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