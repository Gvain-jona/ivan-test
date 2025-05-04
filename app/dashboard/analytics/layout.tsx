'use client';

import React from 'react';
import { AnalyticsProvider } from './_context/AnalyticsContext';

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AnalyticsProvider>
      {children}
    </AnalyticsProvider>
  );
}
