'use client';

import React, { createContext, useContext, useState } from 'react';
import { NotificationStatus, NotificationGroup } from '@/types/notifications';
import useRealNotifications from '@/hooks/useRealNotifications';

interface NotificationsContextType {
  notifications: ReturnType<typeof useRealNotifications>['notifications'];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  isDrawerOpen: boolean;
  activeTab: NotificationStatus;
  openDrawer: () => void;
  closeDrawer: () => void;
  setActiveTab: (tab: NotificationStatus) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  archiveNotification: (id: string) => void;
  deleteNotification: (id: string) => void;
  deleteAllArchived: () => void;
  handleNotificationAction: (id: string, action: string) => void;
  groupNotificationsByDate: ReturnType<typeof useRealNotifications>['groupNotificationsByDate'];
  fetchNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  // Use the real notifications hook instead of mock data
  const {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    deleteAllArchived,
    groupNotificationsByDate
  } = useRealNotifications();

  // Local UI state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationStatus>('unread');

  // Calculate unread count
  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  // Open the notifications drawer
  const openDrawer = () => setIsDrawerOpen(true);

  // Close the notifications drawer
  const closeDrawer = () => setIsDrawerOpen(false);

  // Handle notification actions (accept/decline invitations, etc.)
  const handleNotificationAction = async (id: string, action: string) => {
    console.log(`Handling action ${action} for notification ${id}`);

    // Mark the notification as read when an action is taken
    await markAsRead(id);

    // In a real app, you would handle different actions here
    // For now, we'll just log the action
    switch (action) {
      case 'accept_invitation':
        console.log('Accepted invitation');
        break;
      case 'decline_invitation':
        console.log('Declined invitation');
        break;
      case 'accept_task':
        console.log('Accepted task');
        break;
      case 'decline_task':
        console.log('Declined task');
        break;
      case 'read':
        // Already marked as read above
        break;
      case 'archive':
        await archiveNotification(id);
        break;
      case 'delete':
        await deleteNotification(id);
        break;
      default:
        console.log('Unknown action');
    }

    // Refresh notifications after any action
    fetchNotifications();
  };

  // Add a function to refresh notifications with a debounce
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshNotifications = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await fetchNotifications();
      console.log('Notifications refreshed manually');
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const value = {
    notifications,
    loading: loading || isRefreshing,
    error,
    unreadCount,
    isDrawerOpen,
    activeTab,
    openDrawer,
    closeDrawer,
    setActiveTab,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    deleteAllArchived,
    handleNotificationAction,
    groupNotificationsByDate,
    fetchNotifications: refreshNotifications
  };

  return (
    <NotificationsContext.Provider value={value}>
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
