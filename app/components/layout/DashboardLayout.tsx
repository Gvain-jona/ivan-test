'use client';

import { useState, memo, Suspense } from 'react';
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

type DashboardLayoutProps = {
  children: React.ReactNode;
  className?: string;
};

function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Navigation progress and indicators */}
      <NavigationProgress />
      <NavigationIndicator />
      {/* Performance monitor disabled */}
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <TopHeader
          onMenuClick={toggleMobileMenu}
          isMobileMenuVisible={isMobileMenuOpen}
        />

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
                <div className="pb-16"> {/* Reduced padding to minimize wasted space */}
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