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
