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

  // Refresh notifications periodically
  useEffect(() => {
    // Refresh notifications immediately on mount
    fetchNotifications();

    // Set up a refresh interval (every 30 minutes)
    const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes - increased to reduce API calls
    const intervalId = setInterval(() => {
      console.log('Auto-refreshing notifications indicator');
      // Only refresh if the document is visible
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      } else {
        console.log('Skipping notification refresh because document is not visible');
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fetchNotifications]); // Include fetchNotifications in the dependency array

  return (
    <div
      className={cn(
        "relative",
        disabled && "opacity-70 cursor-not-allowed",
        className
      )}
      onClick={disabled ? undefined : onClick}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && !disabled && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
}

export default NotificationsIndicator;
