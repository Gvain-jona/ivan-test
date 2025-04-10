'use client';

/**
 * Utility functions for handling push notifications
 */

/**
 * Check if the browser supports push notifications
 */
export function isPushNotificationSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Request permission to show push notifications
 * @returns Promise that resolves to the permission status
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications are not supported in this browser');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Show a notification
 * @param title Notification title
 * @param options Notification options
 */
export function showNotification(title: string, options: NotificationOptions = {}) {
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications are not supported in this browser');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  try {
    // Set default options
    const defaultOptions: NotificationOptions = {
      icon: '/logo.png', // Path to your logo
      badge: '/logo.png',
      vibrate: [200, 100, 200],
      ...options
    };

    // Create and show the notification
    const notification = new Notification(title, defaultOptions);

    // Handle notification click
    notification.onclick = function() {
      window.focus();
      notification.close();
      
      // Navigate to the target URL if provided
      if (options.data && (options.data as any).url) {
        window.location.href = (options.data as any).url;
      }
    };

    return notification;
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

/**
 * Register the service worker for push notifications
 */
export async function registerServiceWorker() {
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications are not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('Service Worker registered with scope:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}
