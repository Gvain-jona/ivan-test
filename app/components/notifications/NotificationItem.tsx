'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, MessageSquare, UserPlus, AlertCircle, Clock, DollarSign, AtSign, CheckCircle } from 'lucide-react';
import { Notification } from '@/types/notifications';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/context/NotificationsContext';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const { markAsRead, archiveNotification, deleteNotification, handleNotificationAction } = useNotifications();
  
  // Format the timestamp
  const timeAgo = formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true });
  
  // Get the appropriate icon based on notification type
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'invitation':
        return <UserPlus className="h-4 w-4 text-purple-500" />;
      case 'status_change':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'due_date':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'payment':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'mention':
        return <AtSign className="h-4 w-4 text-pink-500" />;
      case 'assignment':
        return <CheckCircle className="h-4 w-4 text-cyan-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
    }
  };
  
  // Handle click on the notification
  const handleClick = () => {
    if (notification.status === 'unread') {
      markAsRead(notification.id);
    }
  };
  
  return (
    <div 
      className={`p-4 border-b border-border/40 hover:bg-muted/10 transition-colors relative ${
        notification.status === 'unread' ? 'bg-muted/5' : ''
      }`}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {notification.status === 'unread' && (
        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500" />
      )}
      
      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar className="h-10 w-10">
          {notification.sender.avatar ? (
            <AvatarImage src={notification.sender.avatar} alt={notification.sender.name} />
          ) : (
            <AvatarFallback>
              {notification.sender.name.charAt(0)}
            </AvatarFallback>
          )}
        </Avatar>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              {/* Title with icon */}
              <div className="flex items-center gap-1.5 mb-1">
                {getNotificationIcon()}
                <span className="font-medium">{notification.title}</span>
              </div>
              
              {/* Sender and target */}
              <p className="text-sm text-muted-foreground mb-1">
                <span className="font-medium">{notification.sender.name}</span>
                {notification.type === 'comment' && ' commented on '}
                {notification.type === 'invitation' && ' invited you to '}
                {notification.type === 'status_change' && ' updated status of '}
                {notification.type === 'assignment' && ' assigned you to '}
                {notification.type === 'mention' && ' mentioned you in '}
                {notification.type === 'payment' && ' processed payment for '}
                {notification.type === 'due_date' && ' reminder for '}
                <span className="font-medium">{notification.target.title}</span>
              </p>
              
              {/* Message */}
              <p className="text-sm mb-2">{notification.message}</p>
              
              {/* Timestamp */}
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
              
              {/* Action buttons */}
              {notification.actions && (
                <div className="flex gap-2 mt-2">
                  {notification.actions.primary && (
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotificationAction(notification.id, notification.actions!.primary!.action);
                      }}
                    >
                      {notification.actions.primary.label}
                    </Button>
                  )}
                  
                  {notification.actions.secondary && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotificationAction(notification.id, notification.actions!.secondary!.action);
                      }}
                    >
                      {notification.actions.secondary.label}
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {notification.status === 'unread' ? (
                  <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                    Mark as read
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => archiveNotification(notification.id)}>
                    Archive
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive" 
                  onClick={() => deleteNotification(notification.id)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
