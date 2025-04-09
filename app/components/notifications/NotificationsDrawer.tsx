'use client';

import React from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { SideDrawer } from '@/components/ui/side-drawer';
import { useNotifications } from '@/context/NotificationsContext';
import { NotificationGroup } from './NotificationGroup';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { NotificationStatus } from '@/types/notifications';

export function NotificationsDrawer() {
  const {
    notifications,
    isDrawerOpen,
    closeDrawer,
    activeTab,
    setActiveTab,
    markAllAsRead,
    groupNotificationsByDate
  } = useNotifications();

  // Filter notifications by active tab
  const filteredNotifications = notifications.filter(n => n.status === activeTab);

  // Group notifications by date
  const groupedNotifications = groupNotificationsByDate(filteredNotifications);

  // Count notifications by status
  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const readCount = notifications.filter(n => n.status === 'read').length;
  const archivedCount = notifications.filter(n => n.status === 'archived').length;

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
          <div className="p-4 border-b border-border/40">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="unread" className="relative">
                Unread
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="read">Read</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <TabsContent value="unread" className="m-0 h-full">
            {unreadCount > 0 ? (
              <>
                <div className="flex justify-between items-center p-4 border-b border-border/40">
                  <span className="text-sm text-muted-foreground">
                    You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 text-xs"
                    onClick={markAllAsRead}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all as read
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
            {readCount > 0 ? (
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
            {archivedCount > 0 ? (
              groupedNotifications.map(group => (
                <NotificationGroup key={group.date} group={group} />
              ))
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
