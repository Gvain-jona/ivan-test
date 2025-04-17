'use client';

import { ThemeProvider } from '@/components/theme/theme-provider';
import { NavigationProvider } from '@/context/navigation-context';
import { SWRProvider } from './SWRProvider';
import { Toaster } from '@/components/ui/toaster';

/**
 * @deprecated Use the main Providers component from app/providers.tsx instead
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <NavigationProvider>
        <SWRProvider>
          {children}
          <Toaster />
        </SWRProvider>
      </NavigationProvider>
    </ThemeProvider>
  );
}
