'use client';

// Redirect from old login page to new signin page

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get any query parameters
    const redirect = searchParams.get('redirect');
    const queryString = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';

    // Redirect to the new signin page
    router.replace(`/auth/signin${queryString}`);
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <p className="text-muted-foreground">Redirecting to sign in page...</p>
    </div>
  );
}

export default function LoginRedirect() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-background">
      <p className="text-muted-foreground">Loading...</p>
    </div>}>
      <LoginRedirectContent />
    </Suspense>
  );
}