import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProvisioningPendingScreen from '../components/layout/ProvisioningPendingScreen';
import { SheetHostProvider } from '@/context/sheet-host';
import { resolveTenant } from '@/lib/auth/tenant';

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

  return (
    <SheetHostProvider>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </SheetHostProvider>
  );
}