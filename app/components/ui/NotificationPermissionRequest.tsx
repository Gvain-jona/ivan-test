'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { isPushNotificationSupported, requestNotificationPermission } from '@/utils/push-notifications';
import { useToast } from '@/components/ui/use-toast';

/**
 * Component to request notification permission from the user
 * Shows only if notifications are supported and permission is not granted or denied
 */
export function NotificationPermissionRequest() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [supported, setSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if push notifications are supported
    const supported = isPushNotificationSupported();
    setSupported(supported);

    if (supported) {
      // Get current permission status
      setPermission(Notification.permission);
    }
  }, []);

  // If notifications are not supported or permission is already granted or denied, don't show anything
  if (!supported || permission === 'granted' || permission === 'denied') {
    return null;
  }

  const handleRequestPermission = async () => {
    try {
      const result = await requestNotificationPermission();
      setPermission(result);

      if (result === 'granted') {
        toast({
          title: 'Notifications Enabled',
          description: 'You will now receive notifications for new orders and updates.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Notifications Disabled',
          description: 'You will not receive notifications. You can enable them in your browser settings.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to request notification permission.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 bg-card border border-border rounded-lg shadow-lg p-4 max-w-xs">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          <Bell className="h-5 w-5 text-brand" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium">Enable Notifications</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Get notified about new orders and important updates.
          </p>
          <div className="mt-3 flex space-x-2">
            <Button
              size="sm"
              variant="default"
              onClick={handleRequestPermission}
              className="text-xs"
            >
              Enable
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPermission('denied')}
              className="text-xs"
            >
              Not Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationPermissionRequest;
