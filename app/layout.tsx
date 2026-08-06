import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'YOKO Business Management System',
  description: 'Comprehensive business management system for YOKO',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {/* Clerk docs: ClerkProvider belongs inside <body>, not around <html>.
            signInUrl pins auth to our own /auth/signin page — without it,
            middleware auth.protect() redirects to Clerk's hosted Account
            Portal, whose redirect back into the app hangs.

            No `appearance` here on purpose: it used to pin `theme: dark`,
            which kept the sign-in card dark no matter the app theme. It now
            lives on <SignIn /> (app/auth/signin/ThemedSignIn.tsx) so this
            provider can stay a server component. */}
        <ClerkProvider
          signInUrl="/auth/signin"
          signInFallbackRedirectUrl="/dashboard/orders"
          signUpUrl="/auth/signin"
        >
          <Providers>
            {children}
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
