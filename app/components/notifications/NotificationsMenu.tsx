'use client';

import React from 'react';
import { Bell, CheckCheck, ArrowRight } from 'lucide-react';
import { useNotifications } from '@/context/NotificationsContext';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function NotificationsMenu() {
  const { notifications, unreadCount, markAllAsRead, openDrawer, markAsRead } = useNotifications();
  
  // Get the most recent 5 unread notifications
  const recentNotifications = notifications
    .filter(n => n.status === 'unread')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);
  
  return (
    <div className="w-full max-w-[350px] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {unreadCount}
            </span>
          )}
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
      
      {recentNotifications.length > 0 ? (
        <div className="space-y-3 mb-3">
          {recentNotifications.map(notification => (
            <div 
              key={notification.id}
              className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/20 cursor-pointer transition-colors"
              onClick={() => markAsRead(notification.id)}
            >
              <Avatar className="h-8 w-8">
                {notification.sender.avatar ? (
                  <AvatarImage src={notification.sender.avatar} alt={notification.sender.name} />
                ) : (
                  <AvatarFallback>
                    {notification.sender.name.charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{notification.title}</p>
                <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                </p>
              </div>
              
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm font-medium mb-1">All caught up!</p>
          <p className="text-xs text-muted-foreground">You have no unread notifications.</p>
        </div>
      )}
      
      <Button 
        variant="outline" 
        className="w-full justify-between"
        onClick={openDrawer}
      >
        <span>View all notifications</span>
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
