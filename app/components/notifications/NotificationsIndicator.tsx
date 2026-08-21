'use client';

import React, { useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/context/NotificationsContext';
import { cn } from '@/lib/utils';

interface NotificationsIndicatorProps {
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function NotificationsIndicator({ onClick, className, disabled = false }: NotificationsIndicatorProps) {
  const { unreadCount, fetchNotifications } = useNotifications();

  // Refresh notifications periodically, and once on mount.
  useEffect(() => {
    fetchNotifications();

    const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
    const intervalId = setInterval(() => {
      // Only refresh while the tab is visible — a background tab shouldn't poll.
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  const badge = unreadCount > 0 && !disabled && (
    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );

  // When the bell is the interactive control (a standalone trigger), it is a
  // real button with a label so it is keyboard-operable and announced. When it
  // is only an icon inside another control — the mobile tab bar owns the click
  // and the label — it renders as a decorative span so the two don't nest and
  // the icon isn't double-announced.
  if (onClick && !disabled) {
    return (
      <button
        type="button"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        onClick={onClick}
        className={cn('relative rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {badge}
      </button>
    );
  }

  return (
    <span className={cn('relative', disabled && 'opacity-70', className)}>
      <Bell className="h-5 w-5" aria-hidden="true" />
      {badge}
    </span>
  );
}

export default NotificationsIndicator;
