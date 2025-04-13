'use client';

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, MessageSquare, UserPlus, AlertCircle, Clock, DollarSign, AtSign, CheckCircle, Loader2 } from 'lucide-react';
import { Notification } from '@/types/notifications';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/context/NotificationsContext';
import { useToast } from '@/components/ui/use-toast';
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
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState<'read' | 'archive' | 'delete' | null>(null);

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
  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on buttons, dropdown, or dropdown content
    if (
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('[role="menuitem"]') ||
      (e.target as HTMLElement).closest('[data-radix-popper-content-wrapper]')
    ) {
      e.stopPropagation();
      return;
    }

    if (notification.status === 'unread') {
      markAsRead(notification.id);
    }
  };

  return (
    <div
      className={`p-4 border-b border-border/40 hover:bg-muted/10 transition-colors relative ${
        notification.status === 'unread' ? 'bg-muted/5' : ''
      } ${notification.status === 'archived' ? 'opacity-80' : ''}`}
      onClick={handleClick}
      data-testid="notification-item"
    >
      {/* Status indicator */}
      {notification.status === 'unread' && (
        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500" />
      )}
      {notification.status === 'archived' && (
        <div className="absolute top-4 right-4 text-xs text-muted-foreground">
          Archived
        </div>
      )}

      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar className="h-10 w-10">
          {notification.sender?.avatar ? (
            <AvatarImage src={notification.sender.avatar} alt={notification.sender?.name || 'User'} />
          ) : (
            <AvatarFallback>
              {notification.sender?.name?.charAt(0) || 'U'}
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
                <span className="font-medium">{notification.sender?.name || 'System'}</span>
                {notification.type === 'comment' && ' commented on '}
                {notification.type === 'invitation' && ' invited you to '}
                {notification.type === 'status_change' && ' updated status of '}
                {notification.type === 'assignment' && ' assigned you to '}
                {notification.type === 'mention' && ' mentioned you in '}
                {notification.type === 'payment' && ' processed payment for '}
                {notification.type === 'due_date' && ' reminder for '}
                <span className="font-medium">{notification.target?.title || 'Unknown'}</span>
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
            <div
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="relative z-10"
            >
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDownOutside={(e) => e.preventDefault()}
                  className="z-50"
                >
                  {notification.status === 'unread' && (
                    <DropdownMenuItem
                      onSelect={async () => {
                        setIsLoading(true);
                        setActionType('read');
                        const success = await markAsRead(notification.id);
                        setIsLoading(false);
                        setActionType(null);

                        if (success) {
                          toast({
                            title: 'Notification marked as read',
                            description: 'The notification has been marked as read.',
                            variant: 'default',
                          });
                        } else {
                          toast({
                            title: 'Error',
                            description: 'Failed to mark notification as read. Please try again.',
                            variant: 'destructive',
                          });
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      disabled={isLoading}
                    >
                      {isLoading && actionType === 'read' ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Marking as read...
                        </>
                      ) : (
                        'Mark as read'
                      )}
                    </DropdownMenuItem>
                  )}
                  {notification.status !== 'archived' && (
                    <DropdownMenuItem
                      onSelect={async () => {
                        setIsLoading(true);
                        setActionType('archive');
                        const success = await archiveNotification(notification.id);
                        setIsLoading(false);
                        setActionType(null);

                        if (success) {
                          toast({
                            title: 'Notification archived',
                            description: 'The notification has been archived.',
                            variant: 'default',
                          });
                        } else {
                          toast({
                            title: 'Error',
                            description: 'Failed to archive notification. Please try again.',
                            variant: 'destructive',
                          });
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      disabled={isLoading}
                    >
                      {isLoading && actionType === 'archive' ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Archiving...
                        </>
                      ) : (
                        'Archive'
                      )}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={async () => {
                      setIsLoading(true);
                      setActionType('delete');
                      const success = await deleteNotification(notification.id);
                      setIsLoading(false);
                      setActionType(null);

                      if (success) {
                        toast({
                          title: 'Notification deleted',
                          description: 'The notification has been deleted.',
                          variant: 'default',
                        });
                      } else {
                        toast({
                          title: 'Error',
                          description: 'Failed to delete notification. Please try again.',
                          variant: 'destructive',
                        });
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    disabled={isLoading}
                  >
                    {isLoading && actionType === 'delete' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
