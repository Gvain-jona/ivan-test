'use client';

import { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { initGlobalErrorHandlers } from './lib/utils/error-handler';
import { NavigationProvider } from './context/navigation-context';
import { AuthProvider } from './context/auth-context';
import { SettingsProvider } from './context/settings';
import { NotificationsProvider } from './context/NotificationsContext';
import { NotificationProvider } from '@/components/ui/notification';
import { SWRProvider } from './providers/SWRProvider';
// GlobalDropdownCacheProvider removed - using SWR for data fetching
import { CacheCleanupInitializer } from '@/components/CacheCleanupInitializer';
import { LoadingProvider } from '@/components/loading/LoadingProvider';
import { DataPreloader } from '@/components/DataPreloader';
import { SonnerToastProvider } from './providers/SonnerToastProvider';
import { AnnouncementProvider } from './context/announcement-context';

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize global error handlers
  useEffect(() => {
    initGlobalErrorHandlers();
  }, []);

  // Create a combined providers component to reduce nesting depth
  // This helps React optimize re-renders by flattening the component tree
  const CombinedProviders = ({ children }: { children: React.ReactNode }) => (
    <>
      {/* Initialize cache cleanup */}
      <CacheCleanupInitializer />
      {children}
      {/* Add Sonner Toast Provider for toast notifications */}
      <SonnerToastProvider />
    </>
  );

  return (
    <SWRProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <AuthProvider>
          <SettingsProvider>
            <NavigationProvider>
              <LoadingProvider>
                <NotificationsProvider>
                  <NotificationProvider>
                    <AnnouncementProvider>
                      <CombinedProviders>
                        {children}
                      </CombinedProviders>
                    </AnnouncementProvider>
                  </NotificationProvider>
                </NotificationsProvider>
              </LoadingProvider>
            </NavigationProvider>
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </SWRProvider>
  );
}
