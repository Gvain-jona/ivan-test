'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format, subDays } from 'date-fns';

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationStatus>('unread');
  const supabase = createClient();

  // Open/close drawer
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  // Group notifications by date
  const groupNotificationsByDate = useCallback((notifications: Notification[]): NotificationGroup[] => {
    const groups: Record<string, Notification[]> = {};

    notifications.forEach(notification => {
      const date = new Date(notification.timestamp || notification.created_at);
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

    // Convert the groups object to an array of NotificationGroup
    return Object.entries(groups).map(([date, notifications]) => ({
      date,
      notifications: notifications.sort((a, b) =>
        new Date(b.timestamp || b.created_at).getTime() - new Date(a.timestamp || a.created_at).getTime()
      ),
    })).sort((a, b) => {
      if (a.date === 'Today') return -1;
      if (b.date === 'Today') return 1;
      if (a.date === 'Yesterday') return -1;
      if (b.date === 'Yesterday') return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
        throw error;
      }

      // Transform the data to match our expected format
      const transformedData = (data || []).map(item => ({
        ...item,
        id: item.id || `temp-${Math.random().toString(36).substring(2, 9)}`,
        type: item.type || 'comment',
        title: item.title || 'Notification',
        message: item.message || '',
        status: item.status || (item.read ? 'read' : 'unread'),
        timestamp: item.timestamp || item.created_at || new Date().toISOString(),
        sender: item.sender || {
          id: 'system',
          name: 'System',
          avatar: null
        },
        target: item.target || {
          id: 'system',
          type: 'order',
          title: 'Unknown'
        }
      }));

      setNotifications(transformedData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications. Please try again.');

      // Set empty notifications array to prevent errors
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Update local state first for immediate feedback
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id
            ? { ...notification, status: 'read' }
            : notification
        )
      );

      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('id', id);

      if (error) {
        console.error('Error marking notification as read:', error);
        // Revert the local state change if the server update failed
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === id && notification.status === 'read'
              ? { ...notification, status: 'unread' }
              : notification
          )
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }, [supabase]);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      // Update local state first for immediate feedback
      setNotifications(prev =>
        prev.map(notification =>
          notification.status === 'unread'
            ? { ...notification, status: 'read' }
            : notification
        )
      );

      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('status', 'unread');

      if (error) {
        console.error('Error marking all notifications as read:', error);
        // Revert the local state change if the server update failed
        await fetchNotifications();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }, [supabase, fetchNotifications]);

  const archiveNotification = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Update local state first for immediate feedback
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id
            ? { ...notification, status: 'archived' }
            : notification
        )
      );

      const { error } = await supabase
        .from('notifications')
        .update({ status: 'archived' })
        .eq('id', id);

      if (error) {
        console.error('Error archiving notification:', error);
        // Revert the local state change if the server update failed
        await fetchNotifications();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error archiving notification:', error);
      return false;
    }
  }, [supabase, fetchNotifications]);

  const deleteNotification = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Update local state first for immediate feedback
      setNotifications(prev => prev.filter(notification => notification.id !== id));

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting notification:', error);
        // Revert the local state change if the server update failed
        await fetchNotifications();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }, [supabase, fetchNotifications]);

  const deleteAllArchived = useCallback(async (): Promise<boolean> => {
    try {
      // Update local state first for immediate feedback
      setNotifications(prev => prev.filter(notification => notification.status !== 'archived'));

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('status', 'archived');

      if (error) {
        console.error('Error deleting all archived notifications:', error);
        // Revert the local state change if the server update failed
        await fetchNotifications();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting all archived notifications:', error);
      return false;
    }
  }, [supabase, fetchNotifications]);

  // Subscribe to new notifications
  useEffect(() => {
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications'
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    // Initial fetch
    fetchNotifications();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchNotifications]);

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  // Handle notification actions (for primary/secondary action buttons)
  const handleNotificationAction = useCallback((notificationId: string, action: string) => {
    // Mark the notification as read when an action is taken
    markAsRead(notificationId);

    // Handle different action types
    switch (action) {
      case 'view_order':
        // Navigate to order view
        window.location.href = `/dashboard/orders/view?id=${action.split(':')[1] || ''}`;
        break;
      case 'view_profile':
        // Navigate to profile view
        window.location.href = `/dashboard/profile`;
        break;
      case 'approve':
        // Handle approval action
        console.log('Approve action for notification:', notificationId);
        break;
      case 'reject':
        // Handle rejection action
        console.log('Reject action for notification:', notificationId);
        break;
      default:
        console.log('Unknown action:', action, 'for notification:', notificationId);
    }
  }, [markAsRead]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        activeTab,
        setActiveTab,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        archiveNotification,
        deleteNotification,
        deleteAllArchived,
        groupNotificationsByDate,
        handleNotificationAction,
      }}
    >
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
