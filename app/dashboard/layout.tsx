import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { SheetHostProvider } from '@/context/sheet-host';

// Removed Suspense to fix hydration issues
export default function DashboardRouteGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SheetHostProvider>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </SheetHostProvider>
  );
}