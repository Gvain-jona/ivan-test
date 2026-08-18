'use client';

import React from 'react';
import type { NotificationGroup as NotificationGroupType } from '@/types/notifications';
import { NotificationItem } from './NotificationItem';

interface NotificationGroupProps {
  group: NotificationGroupType;
}

export function NotificationGroup({ group }: NotificationGroupProps) {
  const { date, notifications } = group;

  return (
    <div>
      <div className="px-4 pb-2 pt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {date}
        </h3>
      </div>

      <div className="divide-y divide-border">
        {notifications.map(notification => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </div>
    </div>
  );
}
