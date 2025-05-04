'use client';
// Updated with optimized data fetching - 30 minute refresh interval to reduce API calls

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Notification as NotificationType, NotificationStatus } from '@/types/notifications';
import { format, subDays } from 'date-fns';
import { useAuth } from '@/context/auth-context';

export const useRealNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch notifications from the database
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // Fetch notifications for the current user
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        setError(error.message);
        return;
      }

      // Transform the data to match the Notification interface
      const transformedNotifications: Notification[] = data.map((notification) => {
        // Parse the data field if it exists
        const parsedData = notification.data ? notification.data : {};

        return {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          timestamp: notification.timestamp || notification.created_at,
          status: notification.status as NotificationStatus,
          sender: {
            id: 'system',
            name: 'System',
          },
          target: {
            id: parsedData.order_id || '',
            type: 'order',
            title: parsedData.client_name ? `${parsedData.client_name}'s Order` : 'Order',
          },
        };
      });

      setNotifications(transformedNotifications);
    } catch (err) {
      console.error('Unexpected error fetching notifications:', err);
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Mark a notification as read
  const markAsRead = useCallback(async (id: string) => {
    if (!user?.id) return false;

    try {
      // Update the local state first for immediate feedback
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id
            ? { ...notification, status: 'read' }
            : notification
        )
      );

      const supabase = createClient();

      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('id', id)
        .eq('user_id', user.id);

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
    } catch (err) {
      console.error('Unexpected error marking notification as read:', err);
      return false;
    }
  }, [user?.id]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return false;

    try {
      // Store unread notifications for potential rollback
      const unreadNotifications = notifications.filter(n => n.status === 'unread');
      if (unreadNotifications.length === 0) return true; // No unread notifications to mark

      // Update the local state first for immediate feedback
      setNotifications(prev =>
        prev.map(notification =>
          notification.status === 'unread'
            ? { ...notification, status: 'read' }
            : notification
        )
      );

      const supabase = createClient();

      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('user_id', user.id)
        .eq('status', 'unread');

      if (error) {
        console.error('Error marking all notifications as read:', error);
        // Revert the local state change if the server update failed
        setNotifications(prev =>
          prev.map(notification => {
            const unreadNotif = unreadNotifications.find(n => n.id === notification.id);
            return unreadNotif ? { ...notification, status: 'unread' } : notification;
          })
        );
        return false;
      }

      return true;
    } catch (err) {
      console.error('Unexpected error marking all notifications as read:', err);
      return false;
    }
  }, [user?.id, notifications]);

  // Archive a notification
  const archiveNotification = useCallback(async (id: string) => {
    if (!user?.id) return false;

    try {
      // Store the previous status for potential rollback
      const prevStatus = notifications.find(n => n.id === id)?.status || 'read';

      // Update the local state first for immediate feedback
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id
            ? { ...notification, status: 'archived' }
            : notification
        )
      );

      const supabase = createClient();

      const { error } = await supabase
        .from('notifications')
        .update({ status: 'archived' })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error archiving notification:', error);
        // Revert the local state change if the server update failed
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === id && notification.status === 'archived'
              ? { ...notification, status: prevStatus }
              : notification
          )
        );
        return false;
      }

      return true;
    } catch (err) {
      console.error('Unexpected error archiving notification:', err);
      return false;
    }
  }, [user?.id, notifications]);

  // Delete a notification
  const deleteNotification = useCallback(async (id: string) => {
    if (!user?.id) return false;

    try {
      // Store the notification for potential rollback
      const notificationToDelete = notifications.find(n => n.id === id);
      if (!notificationToDelete) return false;

      // Update the local state first for immediate feedback
      setNotifications(prev => prev.filter(notification => notification.id !== id));

      const supabase = createClient();

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting notification:', error);
        // Revert the local state change if the server update failed
        setNotifications(prev => [...prev, notificationToDelete]);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Unexpected error deleting notification:', err);
      return false;
    }
  }, [user?.id, notifications]);

  // Delete all archived notifications
  const deleteAllArchived = useCallback(async () => {
    if (!user?.id) return false;

    try {
      // Store archived notifications for potential rollback
      const archivedNotifications = notifications.filter(n => n.status === 'archived');
      if (archivedNotifications.length === 0) return true; // No archived notifications to delete

      // Update the local state first for immediate feedback
      setNotifications(prev => prev.filter(notification => notification.status !== 'archived'));

      const supabase = createClient();

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('status', 'archived');

      if (error) {
        console.error('Error deleting archived notifications:', error);
        // Revert the local state change if the server update failed
        setNotifications(prev => [...prev, ...archivedNotifications]);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Unexpected error deleting archived notifications:', err);
      return false;
    }
  }, [user?.id, notifications]);

  // Helper function to group notifications by date
  const groupNotificationsByDate = useCallback((notifications: Notification[]) => {
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

    // Convert the groups object to an array
    return Object.entries(groups).map(([date, notifications]) => ({
      date,
      notifications: notifications.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    })).sort((a, b) => {
      if (a.date === 'Today') return -1;
      if (b.date === 'Today') return 1;
      if (a.date === 'Yesterday') return -1;
      if (b.date === 'Yesterday') return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, []);

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      // Initial fetch
      fetchNotifications();

      // Set up polling for notifications every 30 minutes
      const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes - increased to reduce API calls
      const intervalId = setInterval(() => {
        console.log('Polling for notifications every 30 minutes...');
        // Only refresh if the document is visible
        if (document.visibilityState === 'visible') {
          fetchNotifications();
        } else {
          console.log('Skipping notification refresh because document is not visible');
        }
      }, REFRESH_INTERVAL);

      // Clean up interval on unmount
      return () => clearInterval(intervalId);
    }
  }, [user?.id, fetchNotifications]);

  // Set up real-time subscription for new notifications
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up real-time subscription for notifications for user:', user.id);

    const supabase = createClient();

    // Subscribe to changes in the notifications table
    const channel = supabase.channel('notifications-changes-' + Date.now());

    // Add subscription for INSERT events
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        console.log('Received new notification INSERT:', payload);
        try {
          // Add the new notification to the state
          const newNotification = payload.new as any;

          // Parse the data field if it's a string
          let parsedData: { order_id?: string; client_name?: string; [key: string]: any } = {};
          if (newNotification.data) {
            try {
              if (typeof newNotification.data === 'string') {
                parsedData = JSON.parse(newNotification.data);
              } else {
                parsedData = newNotification.data;
              }
            } catch (e) {
              console.error('Error parsing notification data:', e);
              parsedData = {};
            }
          }

          console.log('Parsed notification data:', parsedData);

          const transformedNotification: Notification = {
            id: newNotification.id,
            type: newNotification.type,
            title: newNotification.title,
            message: newNotification.message,
            timestamp: newNotification.timestamp || newNotification.created_at,
            status: newNotification.status as NotificationStatus,
            sender: {
              id: 'system',
              name: 'System',
            },
            target: {
              id: parsedData.order_id || '',
              type: 'order',
              title: parsedData.client_name ? `${parsedData.client_name}'s Order` : 'Order',
            },
          };

          // Update the notifications state
          setNotifications(prev => [transformedNotification, ...prev]);

          // Trigger a browser notification if permission is granted
          if (Notification.permission === 'granted') {
            const notification = new Notification(transformedNotification.title, {
              body: transformedNotification.message,
              icon: '/logo.png',
              badge: '/logo.png',
              data: {
                url: `/dashboard/orders?id=${parsedData.order_id || ''}`,
                ...parsedData
              }
            });

            // Handle notification click
            notification.onclick = function() {
              window.focus();
              notification.close();

              // Navigate to the target URL
              if (parsedData.order_id) {
                window.location.href = `/dashboard/orders?id=${parsedData.order_id}`;
              }
            };
          }
        } catch (error) {
          console.error('Error processing notification:', error);
        }
      })
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    deleteAllArchived,
    groupNotificationsByDate,
  };
};

export default useRealNotifications;
