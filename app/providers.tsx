'use client';

import { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { initGlobalErrorHandlers } from './lib/utils/error-handler';
import { NavigationProvider } from './context/navigation-context';
import { AuthProvider } from './context/auth-context';
import { NotificationsProvider } from './context/NotificationsContext';
import { Toaster } from '@/components/ui/toaster';
import { SWRProvider } from './providers/SWRProvider';
// GlobalDropdownCacheProvider removed - using SWR for data fetching
import { CacheCleanupInitializer } from '@/components/CacheCleanupInitializer';
import { LoadingProvider } from '@/components/loading/LoadingProvider';
import { DataPreloader } from '@/components/DataPreloader';

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize global error handlers
  useEffect(() => {
    initGlobalErrorHandlers();

    // Initialize application
  }, []);

  return (
    <SWRProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <AuthProvider>
          <NavigationProvider>
            <LoadingProvider>
              <NotificationsProvider>
                {/* Initialize cache cleanup */}
                <CacheCleanupInitializer />
                {/* Temporarily disable data preloading until API endpoints are fixed */}
                {/* <DataPreloader /> */}
                {children}
                <Toaster />
              </NotificationsProvider>
            </LoadingProvider>
          </NavigationProvider>
        </AuthProvider>
      </ThemeProvider>
    </SWRProvider>
  );
}
