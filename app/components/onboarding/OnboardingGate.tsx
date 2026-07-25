'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useOrganization } from '@/hooks/organization/useOrganization';

const WIZARD_PATH = '/dashboard/getting-started';

/**
 * Routes a signed-in, provisioned user who hasn't finished first-run setup
 * to the getting-started wizard. Onboarding state lives in
 * organizations.settings.onboarding.completed (set at the end of the
 * wizard). Renders children unchanged; only side-effects a redirect. The
 * no-tenant case is already handled upstream by ProvisioningPendingScreen.
 */
export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { onboardingCompleted, isLoading, error } = useOrganization();
  const onWizard = pathname === WIZARD_PATH;

  useEffect(() => {
    if (isLoading || error) return;
    if (!onboardingCompleted && !onWizard) router.replace(WIZARD_PATH);
  }, [onboardingCompleted, isLoading, error, onWizard, router]);

  return <>{children}</>;
}
