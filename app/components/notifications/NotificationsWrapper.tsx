'use client';

import React from 'react';
import { NotificationsProvider } from '@/context/NotificationsContext';

interface NotificationsWrapperProps {
  children: React.ReactNode;
}

export function NotificationsWrapper({ children }: NotificationsWrapperProps) {
  return (
    <NotificationsProvider>
      {children}
    </NotificationsProvider>
  );
}
