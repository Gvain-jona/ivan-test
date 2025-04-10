'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/context/NotificationsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


export default function NotificationsTestPage() {
  const {
    openDrawer,
    markAllAsRead,
    unreadCount,
    notifications,
    markAsRead,
    archiveNotification
  } = useNotifications();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications Test</h1>
          <p className="text-muted-foreground mt-1">Test the notifications feature</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={markAllAsRead}>
            Mark All as Read
          </Button>
          <Button onClick={openDrawer}>
            Open Notifications
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notifications Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-medium">Unread Count: {unreadCount}</p>
              <p className="text-sm text-muted-foreground">
                Total Notifications: {notifications.length}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-medium mb-2">Unread Notifications</h3>
                <div className="space-y-2">
                  {notifications
                    .filter(n => n.status === 'unread')
                    .map(notification => (
                      <div
                        key={notification.id}
                        className="p-2 border border-border/40 rounded-md"
                      >
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.message}</p>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsRead(notification.id)}
                          >
                            Mark as Read
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Read Notifications</h3>
                <div className="space-y-2">
                  {notifications
                    .filter(n => n.status === 'read')
                    .map(notification => (
                      <div
                        key={notification.id}
                        className="p-2 border border-border/40 rounded-md"
                      >
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.message}</p>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => archiveNotification(notification.id)}
                          >
                            Archive
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Archived Notifications</h3>
                <div className="space-y-2">
                  {notifications
                    .filter(n => n.status === 'archived')
                    .map(notification => (
                      <div
                        key={notification.id}
                        className="p-2 border border-border/40 rounded-md"
                      >
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.message}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
