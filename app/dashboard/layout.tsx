import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';

// Removed Suspense to fix hydration issues
export default function DashboardRouteGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}