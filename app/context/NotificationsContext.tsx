'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { format, subDays } from 'date-fns';
import type { Notification, NotificationStatus, NotificationGroup } from '@/types/notifications';
import {
  useNotificationInbox,
  useNotificationMutations,
} from '@/hooks/notifications/useNotifications';
import { presentNotification } from '@/lib/notifications/present';

/**
 * Notifications — the bell's read/mutate layer.
 *
 * Backs the drawer/menu/indicator with the live v2 activity stream via
 * useNotificationInbox (SWR pull, §4) and its per-user state mutations. The
 * structured rows are rendered to display copy by presentNotification (§12.3);
 * this context keeps only the drawer's UI state plus thin action wrappers.
 *
 * Interface-preserving: the shape below is what the existing components already
 * consume, so wiring real data in was a swap, not a rewrite. Design record:
 * docs/v2-migration/NOTIFICATIONS_REBUILD.md.
 */

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

  const inbox = useNotificationInbox();
  const { setState } = useNotificationMutations();

  const notifications = useMemo(
    () => inbox.notifications.map(presentNotification),
    [inbox.notifications],
  );

  const unreadCount = useMemo(
    () => inbox.notifications.filter(n => n.state === 'unread').length,
    [inbox.notifications],
  );

  const fetchNotifications = useCallback(async () => {
    await inbox.mutate();
  }, [inbox]);

  const safeSet = useCallback(
    async (id: string, state: 'read' | 'unread' | 'archived' | 'active') => {
      try {
        await setState(id, state);
        return true;
      } catch {
        return false;
      }
    },
    [setState],
  );

  const markAsRead = useCallback((id: string) => safeSet(id, 'read'), [safeSet]);
  const archiveNotification = useCallback((id: string) => safeSet(id, 'archived'), [safeSet]);
  // No hard delete exists (archive-not-delete, §6): "delete" archives.
  const deleteNotification = useCallback((id: string) => safeSet(id, 'archived'), [safeSet]);

  const markAllAsRead = useCallback(async () => {
    try {
      const unread = inbox.notifications.filter(n => n.state === 'unread');
      await Promise.all(unread.map(n => setState(n.id, 'read')));
      return true;
    } catch {
      return false;
    }
  }, [inbox.notifications, setState]);

  // Clearing archived would need a delete endpoint we don't expose (§13
  // deferrals); archived rows simply stay archived. Kept for interface parity.
  const deleteAllArchived = useCallback(async () => true, []);

  // Pure date bucketing for the drawer's grouped rendering.
  const groupNotificationsByDate = useCallback(
    (items: Notification[]): NotificationGroup[] => {
      const groups: Record<string, Notification[]> = {};

      items.forEach(notification => {
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

        (groups[groupKey] ??= []).push(notification);
      });

      return Object.entries(groups)
        .map(([date, group]) => ({
          date,
          notifications: group.sort(
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
    // Deep-link routing from a notification is a later floor (§13); for now the
    // action is logged rather than guessed at.
    console.warn('Notification action not yet wired:', action, 'on', notificationId);
  }, []);

  const contextValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      activeTab,
      setActiveTab,
      loading: inbox.isLoading,
      error: inbox.error ? (inbox.error as { message?: string }).message ?? 'Failed to load notifications' : null,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      archiveNotification,
      deleteNotification,
      deleteAllArchived,
      groupNotificationsByDate,
      handleNotificationAction,
    }),
    [
      notifications,
      unreadCount,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      activeTab,
      inbox.isLoading,
      inbox.error,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      archiveNotification,
      deleteNotification,
      deleteAllArchived,
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
