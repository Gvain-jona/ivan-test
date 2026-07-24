'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { format, subDays } from 'date-fns';

/**
 * Notifications — interface-preserving stub until the module's v2
 * cutover (tracked in docs/v2-migration/STATE.md).
 *
 * The previous implementation ran on the legacy Supabase session
 * (dead since the Clerk cutover): it fetched the whole public
 * `notifications` table with no user filter, opened an unfiltered
 * realtime channel per session, and its `if (loading)` guard
 * deadlocked the initial fetch so nothing ever rendered anyway.
 * Consumers (FooterNav badge, NotificationsMenu/Drawer/Indicator)
 * keep working against this empty state; the drawer UI stays as the
 * scaffold for the real v2 read layer.
 */

interface Notification {
  id: string;
  title: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  timestamp: string;
}

interface NotificationGroup {
  date: string;
  notifications: Notification[];
}

type NotificationStatus = 'unread' | 'read' | 'archived';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  activeTab: NotificationStatus;
  setActiveTab: (tab: NotificationStatus) => void;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  archiveNotification: (id: string) => Promise<boolean>;
  deleteNotification: (id: string) => Promise<boolean>;
  deleteAllArchived: () => Promise<boolean>;
  groupNotificationsByDate: (notifications: Notification[]) => NotificationGroup[];
  handleNotificationAction: (notificationId: string, action: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationStatus>('unread');

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  // TODO(v2 notifications module): real data layer. Everything below
  // is inert until then — empty list, no-op mutations.
  const fetchNotifications = useCallback(async () => {}, []);
  const noopMutation = useCallback(async () => true, []);

  // Kept for the drawer's grouped rendering; pure date bucketing.
  const groupNotificationsByDate = useCallback(
    (notifications: Notification[]): NotificationGroup[] => {
      const groups: Record<string, Notification[]> = {};

      notifications.forEach(notification => {
        const date = new Date(notification.timestamp);
        const today = new Date();
        const yesterday = subDays(today, 1);

        let groupKey: string;
        if (date.toDateString() === today.toDateString()) {
          groupKey = 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
          groupKey = 'Yesterday';
        } else {
          groupKey = format(date, 'MMMM d, yyyy');
        }

        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(notification);
      });

      return Object.entries(groups)
        .map(([date, notifications]) => ({
          date,
          notifications: notifications.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          ),
        }))
        .sort((a, b) => {
          if (a.date === 'Today') return -1;
          if (b.date === 'Today') return 1;
          if (a.date === 'Yesterday') return -1;
          if (b.date === 'Yesterday') return 1;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
    },
    [],
  );

  const handleNotificationAction = useCallback((notificationId: string, action: string) => {
    switch (action) {
      case 'view_order':
        window.location.href = `/dashboard/orders/view?id=${action.split(':')[1] || ''}`;
        break;
      case 'view_profile':
        window.location.href = `/dashboard/profile`;
        break;
      default:
        console.warn('Unknown action:', action, 'for notification:', notificationId);
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      notifications: [] as Notification[],
      unreadCount: 0,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      activeTab,
      setActiveTab,
      loading: false,
      error: null,
      fetchNotifications,
      markAsRead: noopMutation,
      markAllAsRead: noopMutation,
      archiveNotification: noopMutation,
      deleteNotification: noopMutation,
      deleteAllArchived: noopMutation,
      groupNotificationsByDate,
      handleNotificationAction,
    }),
    [
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      activeTab,
      fetchNotifications,
      noopMutation,
      groupNotificationsByDate,
      handleNotificationAction,
    ],
  );

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
