'use client';

import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { SideDrawer } from '@/components/ui/side-drawer';
import { useNotifications } from '@/context/NotificationsContext';
import { NotificationGroup } from './NotificationGroup';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

import { NotificationStatus } from '@/types/notifications';

export function NotificationsDrawer() {
  const {
    notifications,
    loading,
    error,
    isDrawerOpen,
    closeDrawer,
    activeTab,
    setActiveTab,
    markAllAsRead,
    deleteAllArchived,
    groupNotificationsByDate,
    fetchNotifications
  } = useNotifications();
  const { toast } = useToast();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionType, setActionType] = useState<'markAllRead' | 'clearArchived' | null>(null);

  // Filter notifications by active tab
  const filteredNotifications = notifications.filter(n => n.status === activeTab);

  // Group notifications by date
  const groupedNotifications = groupNotificationsByDate(filteredNotifications);

  // Count notifications by status
  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const readCount = notifications.filter(n => n.status === 'read').length;
  const archivedCount = notifications.filter(n => n.status === 'archived').length;

  // Handle refresh
  const handleRefresh = async () => {
    setIsActionLoading(true);
    await fetchNotifications();
    setIsActionLoading(false);

    toast({
      title: 'Notifications refreshed',
      description: 'Your notifications have been refreshed.',
      variant: 'default',
    });
  };

  // Refresh notifications when drawer is opened
  useEffect(() => {
    if (isDrawerOpen) {
      console.log('Drawer opened, refreshing notifications');
      fetchNotifications();
    }
  }, [isDrawerOpen, fetchNotifications]);

  return (
    <SideDrawer
      isOpen={isDrawerOpen}
      onClose={closeDrawer}
      title="Notifications"
      width="450px"
    >
      <div className="flex flex-col h-full">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as NotificationStatus)} className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-border/40">
            <TabsList className="grid grid-cols-3 w-auto flex-1 mr-2">

              <TabsTrigger value="unread" className="relative">
                Unread
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="read">
                Read
                {readCount > 0 && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {readCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="archived">
                Archived
                {archivedCount > 0 && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {archivedCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={loading || isActionLoading}
              title="Refresh notifications"
            >
              {loading || isActionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <TabsContent value="unread" className="m-0 h-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
                  <Bell className="h-6 w-6 text-primary animate-pulse" />
                </div>
                <h3 className="text-lg font-medium mb-2">Loading notifications...</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Please wait while we fetch your notifications.
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <Bell className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-lg font-medium mb-2">Error loading notifications</h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-4">
                  {error}
                </p>
                <Button onClick={fetchNotifications} variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            ) : unreadCount > 0 ? (
              <>
                <div className="flex justify-between items-center p-4 border-b border-border/40">
                  <span className="text-sm text-muted-foreground">
                    You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 text-xs"
                    onClick={async () => {
                      setIsActionLoading(true);
                      setActionType('markAllRead');
                      const success = await markAllAsRead();
                      setIsActionLoading(false);
                      setActionType(null);

                      if (success) {
                        toast({
                          title: 'All notifications marked as read',
                          description: 'All unread notifications have been marked as read.',
                          variant: 'default',
                        });
                      } else {
                        toast({
                          title: 'Error',
                          description: 'Failed to mark all notifications as read. Please try again.',
                          variant: 'destructive',
                        });
                      }
                    }}
                    disabled={isActionLoading}
                  >
                    {isActionLoading && actionType === 'markAllRead' ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCheck className="h-3.5 w-3.5" />
                        Mark all as read
                      </>
                    )}
                  </Button>
                </div>
                {groupedNotifications.map(group => (
                  <NotificationGroup key={group.date} group={group} />
                ))}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">No unread notifications</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  You're all caught up! Check the read or archived tabs to view previous notifications.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="read" className="m-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
                  <Bell className="h-6 w-6 text-primary animate-pulse" />
                </div>
                <h3 className="text-lg font-medium mb-2">Loading notifications...</h3>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <Bell className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-lg font-medium mb-2">Error loading notifications</h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-4">
                  {error}
                </p>
                <Button onClick={fetchNotifications} variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            ) : readCount > 0 ? (
              groupedNotifications.map(group => (
                <NotificationGroup key={group.date} group={group} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">No read notifications</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  You haven't read any notifications yet. Check the unread tab for new notifications.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="archived" className="m-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
                  <Bell className="h-6 w-6 text-primary animate-pulse" />
                </div>
                <h3 className="text-lg font-medium mb-2">Loading notifications...</h3>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <Bell className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-lg font-medium mb-2">Error loading notifications</h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-4">
                  {error}
                </p>
                <Button onClick={fetchNotifications} variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            ) : archivedCount > 0 ? (
              <>
                <div className="flex justify-between items-center p-4 border-b border-border/40">
                  <span className="text-sm text-muted-foreground">
                    You have {archivedCount} archived notification{archivedCount !== 1 ? 's' : ''}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 text-xs text-destructive hover:text-destructive"
                    onClick={async () => {
                      setIsActionLoading(true);
                      setActionType('clearArchived');
                      const success = await deleteAllArchived();
                      setIsActionLoading(false);
                      setActionType(null);

                      if (success) {
                        toast({
                          title: 'Archived notifications cleared',
                          description: 'All archived notifications have been deleted.',
                          variant: 'default',
                        });
                      } else {
                        toast({
                          title: 'Error',
                          description: 'Failed to clear archived notifications. Please try again.',
                          variant: 'destructive',
                        });
                      }
                    }}
                    disabled={isActionLoading}
                  >
                    {isActionLoading && actionType === 'clearArchived' ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        Clearing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-3.5 w-3.5" />
                        Clear All
                      </>
                    )}
                  </Button>
                </div>
                {groupedNotifications.map(group => (
                  <NotificationGroup key={group.date} group={group} />
                ))}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">No archived notifications</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  You haven't archived any notifications yet. Archived notifications will appear here.
                </p>
              </div>
            )}
          </TabsContent>
          </div>
        </Tabs>
      </div>
    </SideDrawer>
  );
}
