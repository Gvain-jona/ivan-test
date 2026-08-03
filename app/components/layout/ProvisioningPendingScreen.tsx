'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** How often to re-check the server layout's resolveTenant(). */
const POLL_MS = 2000;
/**
 * How long to keep polling before giving up the silent spinner. The
 * webhook normally lands in <5s; past this it's more likely a real
 * failure (webhook never delivered, bad config) than in-flight
 * provisioning, so stop spinning and surface an escape hatch instead
 * of trapping the user forever.
 */
const TIMEOUT_MS = 20000;

/**
 * Shown when Clerk has authenticated the user but the v2.organizations
 * mirror row doesn't exist yet — the brief window between Clerk
 * creating an Organization and the app/api/webhooks/clerk delivery
 * landing (see resolveTenant() in app/lib/auth/tenant.ts). Polls via
 * router.refresh() so the server layout re-checks resolveTenant() and
 * swaps in the real dashboard the moment it resolves; this component
 * simply stops rendering once that happens.
 *
 * If it hasn't resolved within TIMEOUT_MS, we stop the silent spinner
 * and show a retry + sign-out affordance — provisioning can genuinely
 * fail (webhook not delivered, misconfig), and an infinite spinner
 * leaves the user with no signal and no way out.
 */
export default function ProvisioningPendingScreen() {
  const router = useRouter();
  const { signOut } = useClerk();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (timedOut) return;
    const interval = setInterval(() => router.refresh(), POLL_MS);
    const timeout = setTimeout(() => setTimedOut(true), TIMEOUT_MS);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [router, timedOut]);

  const retry = useCallback(() => {
    setTimedOut(false);
    router.refresh();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] px-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        {timedOut ? (
          <>
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-base font-medium text-foreground">
                This is taking longer than expected
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your workspace is still being set up. This usually clears on its own — try
                again in a moment, or sign out and back in.
              </p>
            </div>
            <div className="mt-1 flex gap-3">
              <Button onClick={retry}>Try again</Button>
              <Button variant="outline" onClick={() => signOut({ redirectUrl: '/auth/signin' })}>
                Sign out
              </Button>
            </div>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <div>
              <p className="text-base font-medium text-foreground">Setting up your workspace…</p>
              <p className="mt-1 text-sm text-muted-foreground">This only takes a few seconds.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
