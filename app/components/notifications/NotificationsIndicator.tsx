'use client';

import React, { useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/context/NotificationsContext';
import { cn } from '@/lib/utils';

interface NotificationsIndicatorProps {
  onClick?: () => void;
  className?: string;
}

export function NotificationsIndicator({ onClick, className }: NotificationsIndicatorProps) {
  const { unreadCount, fetchNotifications } = useNotifications();

  // Refresh notifications periodically
  useEffect(() => {
    // Refresh notifications immediately on mount
    fetchNotifications();

    // Set up a refresh interval (every 60 seconds)
    const intervalId = setInterval(() => {
      console.log('Auto-refreshing notifications indicator');
      fetchNotifications();
    }, 60000); // 60 seconds

    return () => clearInterval(intervalId);
  }, [fetchNotifications]); // Include fetchNotifications in the dependency array

  return (
    <div
      className={cn("relative", className)}
      onClick={onClick}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
}

export default NotificationsIndicator;
