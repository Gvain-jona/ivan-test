'use client';

import { useState, memo, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '../../lib/utils';
import TopHeader from '../navigation/TopHeader';
import FooterNav from '../navigation/FooterNav';
import { NavigationIndicator } from '../ui/navigation-indicator';
import { NavigationProgress } from '../ui/navigation-progress';
import ErrorBoundary from '../error/ErrorBoundary';
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

  // Routes that own the whole viewport and render their own shell.
  //
  // First-run setup, because until onboarding completes OnboardingGate sends
  // every other route back here — app chrome would only offer dead ends. And
  // the order screens (B2 new, B4 hub), because each carries its own header and
  // sticky footer: the tab bar would sit on top of that footer, and the
  // layout's own padding would land inside a surface that already has its own.
  //
  // The parent layout still provides SheetHostProvider, which they all need. A
  // route group can't express this — App Router layouts always nest.
  const chromeless =
    pathname === SETUP_PATH || /^\/dashboard\/orders\/[^/]+$/.test(pathname ?? '');
  if (chromeless) {
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

        {/* Page content. Tenancy is already resolved server-side in the route
            layout (resolveTenant → ProvisioningPendingScreen), and each screen
            renders its own static chrome instantly and skeletons only its data
            region — so there is no global loading coordinator here. Its
            auth-gated, timer-driven full-page skeleton only ever painted a
            second, differently-shaped placeholder on top of the route's own
            loading.tsx, which is exactly the flicker this layer used to cause.

            The Suspense boundary stays for lazy/dynamic children, but with a
            null fallback: the route-level loading.tsx (a FeedSkeleton, cut to
            the screen's real geometry) is what shows during navigation, and the
            pages that use useSearchParams already carry their own
            fallback={null} boundary. A shaped fallback here would just be
            another mismatched shape. */}
        <main className={cn(
          "flex-1 overflow-y-auto bg-[hsl(var(--background))] p-4 lg:p-6",
          className
        )}>
          <ErrorBoundary>
            <Suspense fallback={null}>
              {/* Bottom padding clears the nav: taller on mobile for the
                  full-width tab bar + safe area, tighter on desktop for
                  the floating pill. */}
              <div className="pb-24 lg:pb-16">
                {children}
              </div>
            </Suspense>
          </ErrorBoundary>
        </main>

        {/* Footer Navigation. The NotificationsProvider is mounted once,
            globally, in app/providers.tsx — the nav's Alerts tab and badge
            consume that single instance. The full inbox is now the
            /dashboard/notifications screen, not an overlay. */}
        <FooterNav />
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(DashboardLayout);