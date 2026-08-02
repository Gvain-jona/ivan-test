'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useOrganization } from '@/hooks/organization/useOrganization';
import { SETUP_PATH } from '@/lib/onboarding/steps';

/**
 * Routes a signed-in, provisioned user to or away from the getting-started
 * wizard. Onboarding state lives in the organizations.onboarding_completed_at
 * column (stamped at the end of the wizard) — deliberately a column, not a
 * settings block, because settings is config that gets frozen into issued
 * document snapshots. Renders children unchanged; only side-effects a
 * redirect. The no-tenant case is already handled upstream by
 * ProvisioningPendingScreen.
 *
 * Both directions matter: the setup surface renders without app chrome, so a
 * user who has already finished would otherwise land in a page with no way
 * out.
 */
export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { onboardingCompleted, isLoading, error } = useOrganization();
  const onWizard = pathname === SETUP_PATH;

  useEffect(() => {
    if (isLoading || error) return;
    if (!onboardingCompleted && !onWizard) router.replace(SETUP_PATH);
    if (onboardingCompleted && onWizard) router.replace('/dashboard/orders');
  }, [onboardingCompleted, isLoading, error, onWizard, router]);

  return <>{children}</>;
}
