'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Shown when Clerk has authenticated the user but the v2.organizations
 * mirror row doesn't exist yet — the brief window between Clerk
 * creating an Organization and the app/api/webhooks/clerk delivery
 * landing (see resolveTenant() in app/lib/auth/tenant.ts). Polls via
 * router.refresh() so the server layout re-checks resolveTenant() and
 * swaps in the real dashboard the moment it resolves; this component
 * simply stops rendering once that happens.
 */
export default function ProvisioningPendingScreen() {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 2000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <div>
          <p className="text-base font-medium text-foreground">Setting up your workspace…</p>
          <p className="mt-1 text-sm text-muted-foreground">This only takes a few seconds.</p>
        </div>
      </div>
    </div>
  );
}
