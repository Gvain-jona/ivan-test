'use client';

import { useState, memo, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '../../lib/utils';
import TopHeader from '../navigation/TopHeader';
import FooterNav from '../navigation/FooterNav';
import { NavigationIndicator } from '../ui/navigation-indicator';
import { NavigationProgress } from '../ui/navigation-progress';
import ErrorBoundary from '../error/ErrorBoundary';
import { NotificationsDrawer } from '../notifications/NotificationsDrawer';
import { NotificationsWrapper } from '../notifications/NotificationsWrapper';
import NotificationPermissionRequest from '../ui/NotificationPermissionRequest';
import { SimpleLoadingCoordinator } from '../loading';
import { SETUP_PATH } from '@/lib/onboarding/steps';

type DashboardLayoutProps = {
  children: React.ReactNode;
  className?: string;
};

function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // First-run setup owns the whole viewport: it renders its own shell and,
  // until onboarding completes, OnboardingGate sends every other route back
  // here — so app chrome would only offer dead ends. The parent layout still
  // provides SheetHostProvider, which the "create your first record" actions
  // need. A route group can't express this: App Router layouts always nest.
  if (pathname === SETUP_PATH) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Navigation progress and indicators */}
      <NavigationProgress />
      <NavigationIndicator />
      {/* Performance monitor disabled */}
      {/* h-dvh (dynamic viewport height), not h-screen/100vh: on mobile
          browsers 100vh counts the area behind the collapsing toolbar, which
          pushed the fixed bottom tab bar and last content rows out of view.
          dvh tracks the actually-visible height so the shell ends where the
          screen does. */}
      <div className="flex flex-col h-dvh overflow-hidden">
        {/* Header */}
        <TopHeader />

        {/* Page Content with Error Boundary, LoadingStateCoordinator, and Suspense */}
        <main className={cn(
          "flex-1 overflow-y-auto bg-[hsl(var(--background))] p-4 lg:p-6",
          className
        )}>
          <ErrorBoundary>
            <SimpleLoadingCoordinator>
              <Suspense fallback={
                <div className="flex items-center justify-center h-[50vh]">
                  <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-48 bg-muted/20 border border-border/10 rounded-md"></div>
                    <div className="h-64 w-full max-w-3xl bg-muted/20 border border-border/10 rounded-lg"></div>
                    <div className="h-32 w-full max-w-2xl bg-muted/20 border border-border/10 rounded-lg"></div>
                  </div>
                </div>
              }>
                {/* Bottom padding clears the nav: taller on mobile for the
                    full-width tab bar + safe area, tighter on desktop for
                    the floating pill. */}
                <div className="pb-24 lg:pb-16">
                  {children}
                </div>
              </Suspense>
            </SimpleLoadingCoordinator>
          </ErrorBoundary>
        </main>

        {/* Footer Navigation and Notifications */}
        <NotificationsWrapper>
          <FooterNav />
          <NotificationsDrawer />
        </NotificationsWrapper>

        {/* Notification Permission Request */}
        <NotificationPermissionRequest />
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(DashboardLayout);