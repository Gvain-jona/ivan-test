'use client';

/**
 * Utility functions for handling push notifications
 */

/**
 * Check if push notifications are supported in the current browser
 */
export function isPushNotificationSupported(): boolean {
  return (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

/**
 * Request notification permission from the user
 * @returns Promise<NotificationPermission>
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported');
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    throw error;
  }
}

/**
 * Send a push notification
 * @param title - The notification title
 * @param options - The notification options
 */
export function sendNotification(
  title: string,
  options: NotificationOptions = {}
): void {
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/icons/notification-icon.png',
        badge: '/icons/notification-badge.png',
        ...options,
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}

/**
 * Show a notification with a title and message
 * @param title - The notification title
 * @param message - The notification message
 * @param options - Additional notification options
 */
export function showNotification(
  title: string,
  message: string,
  options: Partial<NotificationOptions> = {}
): void {
  sendNotification(title, {
    body: message,
    ...options,
  });
}

/**
 * Register the service worker for push notifications
 */
export async function registerServiceWorker(): Promise<void> {
  if (!isPushNotificationSupported()) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered:', registration);
  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
}
