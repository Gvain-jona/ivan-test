'use client';

import React from 'react';
import { Bell, CheckCheck, ArrowRight, Info } from 'lucide-react';
import { useNotifications } from '@/context/NotificationsContext';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/auth-context';

export function NotificationsMenu() {
  const { notifications, loading, error, unreadCount, markAllAsRead, openDrawer, markAsRead, fetchNotifications } = useNotifications();
  const { isAuthenticated } = useAuth();

  // Add a local loading state to prevent flashing
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

  // Effect to handle initial loading state and force refresh if needed
  React.useEffect(() => {
    // If we have data but are still in initial load state, exit the loading state
    if (notifications.length > 0 && isInitialLoad) {
      setIsInitialLoad(false);
    }
    // If we're not loading anymore, exit the initial load state
    else if (!loading && isInitialLoad) {
      setIsInitialLoad(false);
    }

    // Force refresh notifications when the menu is opened
    const refreshData = async () => {
      try {
        await fetchNotifications();
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    refreshData();
  }, [loading, isInitialLoad, notifications.length, fetchNotifications]);

  // Get the most recent 5 unread notifications
  const recentNotifications = notifications
    .filter(n => n.status === 'unread')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  // Show a consistent loading state during initial load, but only for a maximum of 2 seconds
  // This prevents the menu from being stuck in loading state forever
  React.useEffect(() => {
    if (isInitialLoad) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 2000); // 2 second maximum loading time
      return () => clearTimeout(timer);
    }
  }, [isInitialLoad]);

  // Show loading state only during initial load and not during subsequent loading operations
  if (isInitialLoad && loading) {
    return (
      <div className="w-full p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4 w-full">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Notifications</h2>
            <div className="h-5 w-5 rounded-full bg-primary/10 animate-pulse"></div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-6 w-full">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 animate-pulse">
            <Bell className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <p className="text-sm font-medium mb-1">Loading notifications...</p>
          <p className="text-xs text-muted-foreground">Please wait</p>
        </div>
      </div>
    );
  }

  // Show a message for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="w-full p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4 w-full">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>
        </div>
        <div className="bg-blue-900/30 border border-blue-800 rounded-md p-3 mb-4">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-300">Public Mode Active</h4>
              <p className="text-sm text-blue-400 mt-1">
                Notifications are only available when signed in.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4 w-full">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <span className={`inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary ${unreadCount === 0 ? 'opacity-0' : ''}`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-xs h-8"
            onClick={markAllAsRead}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all as read
          </Button>
        )}
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-6 w-full">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
            <Bell className="h-5 w-5 text-destructive" />
          </div>
          <p className="text-sm font-medium mb-1">Error loading notifications</p>
          <p className="text-xs text-muted-foreground mb-2 text-center max-w-[250px] overflow-hidden text-ellipsis">
            {typeof error === 'string' ? error : 'Failed to load notifications'}
          </p>
          <Button
            onClick={() => fetchNotifications()}
            variant="outline"
            size="sm"
            className="text-xs py-1 h-7"
          >
            Try Again
          </Button>
        </div>
      ) : recentNotifications.length > 0 ? (
        <div className="space-y-3 mb-3 w-full">
          {recentNotifications.map(notification => (
            <div
              key={notification.id}
              className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/20 cursor-pointer transition-colors relative"
              onClick={() => markAsRead(notification.id)}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                {notification.sender.avatar ? (
                  <AvatarImage src={notification.sender.avatar} alt={notification.sender.name} />
                ) : (
                  <AvatarFallback>
                    {notification.sender.name.charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>

              <div className="flex-1 min-w-0 pr-4"> {/* Added right padding to prevent overlap */}
                <p className="text-sm font-medium truncate">{notification.title}</p>
                <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                </p>
              </div>

              <div className="w-2 h-2 rounded-full bg-blue-500 absolute right-2 top-3 flex-shrink-0" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 w-full">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm font-medium mb-1">All caught up!</p>
          <p className="text-xs text-muted-foreground">You have no unread notifications.</p>
        </div>
      )}

      <Button
        variant="outline"
        className="w-full justify-between mt-4"
        onClick={openDrawer}
        size="sm"
      >
        <span>View all notifications</span>
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
