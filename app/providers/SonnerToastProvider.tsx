'use client';

import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from 'next-themes';

/**
 * Sonner Toast Provider Component
 * This component provides the Sonner toast container
 * and ensures it respects the current theme
 */
export function SonnerToastProvider() {
  const { theme, resolvedTheme } = useTheme();

  // Determine the theme to use for the toaster
  // Use the explicitly set theme, fall back to the resolved theme, or default to system
  const toasterTheme = (theme === 'dark' || theme === 'light')
    ? theme
    : (resolvedTheme === 'dark' || resolvedTheme === 'light')
      ? resolvedTheme
      : 'system';

  return (
    <SonnerToaster
      position="top-center"
      theme={toasterTheme as 'dark' | 'light' | 'system'}
      richColors
      toastOptions={{
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
          // Add box shadow for better visibility
          boxShadow: 'var(--shadow-md)',
        },
        className: 'sonner-toast',
        // Ensure success and error toasts have proper styling
        classNames: {
          success: 'sonner-toast-success',
          error: 'sonner-toast-error',
          warning: 'sonner-toast-warning',
          info: 'sonner-toast-info',
        },
      }}
    />
  );
}
