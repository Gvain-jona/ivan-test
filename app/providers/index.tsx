'use client';

import { ThemeProvider } from '@/components/theme/theme-provider';
import { NavigationProvider } from '@/context/navigation-context';
import { SWRProvider } from './swr-provider';
import { Toaster } from '@/components/ui/toaster';

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
