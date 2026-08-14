'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useOrganization } from '@/hooks/organization/useOrganization';
import { firstRunRedirect } from '@/lib/onboarding/first-run';

/**
 * Routes a signed-in, provisioned user to or away from the A1 setup screen.
 *
 * The gate is A1 alone: currency present (settings.locale.currency) means the
 * one required first-run screen is done, and the user belongs in the app. It is
 * deliberately NOT keyed on onboarding_completed_at — that column now only
 * governs the in-app "Continue setup" badge, not entry, so the rest of setup is
 * an invitation the user takes when they wish rather than a wall. The baseline
 * the app needs is seeded at provisioning (see seedOrgDefaults), so there is
 * nothing to configure before entering. Renders children unchanged; only
 * side-effects a redirect. The no-tenant case is handled upstream by
 * ProvisioningPendingScreen.
 *
 * Both directions matter: the setup surface renders without app chrome, so a
 * user who has already done A1 would otherwise land on a form with no way out.
 */
export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currency, isLoading, error } = useOrganization();

  useEffect(() => {
    if (isLoading || error) return;
    const target = firstRunRedirect({ currency, pathname });
    if (target) router.replace(target);
  }, [currency, isLoading, error, pathname, router]);

  return <>{children}</>;
}
