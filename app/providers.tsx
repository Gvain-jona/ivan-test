'use client';

import { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { initGlobalErrorHandlers } from './lib/utils/error-handler';
import { NavigationProvider } from './context/navigation-context';
import { AuthProvider } from './context/auth-context';
import { NotificationsProvider } from './context/NotificationsContext';
import { Toaster } from '@/components/ui/toaster';
import { SWRProvider } from './providers/SWRProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize global error handlers
  useEffect(() => {
    initGlobalErrorHandlers();

    // Log page navigation for debugging
    console.log('===== PAGE NAVIGATION =====');
    console.log('URL:', window.location.href);
    console.log('Pathname:', window.location.pathname);
    console.log('Search:', window.location.search);
    console.log('Timestamp:', new Date().toISOString());
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
            <NotificationsProvider>
              {children}
              <Toaster />
            </NotificationsProvider>
          </NavigationProvider>
        </AuthProvider>
      </ThemeProvider>
    </SWRProvider>
  );
}
