import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import dynamic from 'next/dynamic';

// Import AuthHandler dynamically to ensure it only runs on the client
const AuthHandler = dynamic(
  () => import('./components/auth/AuthHandler'),
  { ssr: false }
);

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ivan Prints Business Management System',
  description: 'Comprehensive business management system for Ivan Prints',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {/* Add AuthHandler to handle authentication */}
          <AuthHandler />
          {children}
        </Providers>
      </body>
    </html>
  );
}