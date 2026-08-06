import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProvisioningPendingScreen from '../components/layout/ProvisioningPendingScreen';
import OnboardingGate from '../components/onboarding/OnboardingGate';
import { SheetHostProvider } from '@/context/sheet-host';
import { resolveTenant } from '@/lib/auth/tenant';
import BrandStyle from '../components/theme/BrandStyle';

// Removed Suspense to fix hydration issues
export default async function DashboardRouteGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware only checks for a valid Clerk session, not tenancy — a
  // just-signed-up user can land here before the Clerk org webhook has
  // mirrored their v2.organizations row (see resolveTenant()). Without
  // this gate every fetch on the page below would silently 401 with no
  // explanation; show a brief self-resolving screen instead.
  const tenant = await resolveTenant();
  if (!tenant) {
    return <ProvisioningPendingScreen />;
  }

  // The gate wraps the layout rather than sitting inside it: DashboardLayout
  // renders the setup route without chrome, so a gate nested in its main would
  // never run on the very route it has to redirect away from once onboarding
  // is complete.
  return (
    <SheetHostProvider>
      {/* Overrides the default brand tokens in globals.css with the active
          org's. Sits here rather than in the root layout because this is
          already the org-aware boundary — see BrandStyle. */}
      <BrandStyle />
      <OnboardingGate>
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </OnboardingGate>
    </SheetHostProvider>
  );
}