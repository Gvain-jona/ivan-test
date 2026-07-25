import GettingStartedWizard from '@/components/onboarding/GettingStartedWizard';

/**
 * First-run setup surface. Both desktop and mobile route here (via
 * OnboardingGate) until onboarding is marked complete. Sits under the
 * dashboard layout, so the sheet host is available for "create your first
 * record" actions.
 */
export default function GettingStartedPage() {
  return <GettingStartedWizard />;
}
