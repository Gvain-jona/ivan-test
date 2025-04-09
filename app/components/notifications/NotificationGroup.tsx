'use client';

import React from 'react';
import { NotificationGroup as NotificationGroupType } from '@/types/notifications';
import { NotificationItem } from './NotificationItem';

interface NotificationGroupProps {
  group: NotificationGroupType;
}

export function NotificationGroup({ group }: NotificationGroupProps) {
  const { date, notifications } = group;
  
  // Count unread notifications in this group
  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center px-4 py-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">{date}</h3>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {unreadCount}
            </span>
          )}
        </div>
        <button className="text-xs text-primary hover:underline">
          View All
        </button>
      </div>
      
      <div className="divide-y divide-border/40">
        {notifications.map(notification => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </div>
    </div>
  );
}
