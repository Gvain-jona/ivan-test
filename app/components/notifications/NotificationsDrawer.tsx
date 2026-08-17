'use client';

import { useState, type ReactNode } from 'react';
import { Bell, CheckCheck, Loader2, RefreshCw } from 'lucide-react';
import AppSheet from '@/components/ui/sheets/AppSheet';
import { useNotifications } from '@/context/NotificationsContext';
import { NotificationGroup } from './NotificationGroup';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import type { NotificationGroup as NotificationGroupType, NotificationStatus } from '@/types/notifications';
import { useOnceEffect } from '@/lib/useOnceEffect';

/** Loading / error / empty placeholder — one shape for all three tabs. */
function StateMessage({
  tone = 'default',
  title,
  subtitle,
  action,
}: {
  tone?: 'default' | 'error';
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      <div
        className={cn(
          'mb-4 flex h-12 w-12 items-center justify-center rounded-full',
          tone === 'error' ? 'bg-destructive/10' : 'bg-primary/10',
        )}
      >
        <Bell className={cn('h-6 w-6', tone === 'error' ? 'text-destructive' : 'text-primary')} />
      </div>
      <h3 className="mb-2 text-lg font-medium">{title}</h3>
      {subtitle && <p className="max-w-xs text-sm text-muted-foreground">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * The notifications inbox. Rendered through the app sheet primitive
 * (`AppSheet`) — a bottom sheet on mobile (opened by the tab bar's Alerts tab)
 * and a right panel on desktop. See docs/v2-migration/NOTIFICATIONS_REBUILD.md.
 */
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
    groupNotificationsByDate,
    fetchNotifications,
  } = useNotifications();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const busy = refreshing || markingAll;

  const grouped: NotificationGroupType[] = groupNotificationsByDate(
    notifications.filter(n => n.status === activeTab),
  );
  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const readCount = notifications.filter(n => n.status === 'read').length;
  const archivedCount = notifications.filter(n => n.status === 'archived').length;

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  // Refresh when the sheet opens (useOnceEffect guards against a refetch loop).
  useOnceEffect(() => { fetchNotifications(); }, isDrawerOpen, [fetchNotifications]);

  const handleMarkAll = async () => {
    setMarkingAll(true);
    const ok = await markAllAsRead();
    setMarkingAll(false);
    if (!ok) {
      toast({
        title: 'Error',
        description: 'Could not mark all as read. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const list = grouped.map(group => <NotificationGroup key={group.date} group={group} />);

  // The body of one tab: loading/error/empty share StateMessage; otherwise an
  // optional action bar above the grouped list.
  const tabBody = (count: number, emptyTitle: string, emptySubtitle: string, actionBar?: ReactNode) => {
    if (loading) return <StateMessage title="Loading notifications…" subtitle="One moment." />;
    if (error) {
      return (
        <StateMessage
          tone="error"
          title="Couldn't load notifications"
          subtitle={error}
          action={
            <Button onClick={fetchNotifications} variant="outline" size="sm">
              Try again
            </Button>
          }
        />
      );
    }
    if (count === 0) return <StateMessage title={emptyTitle} subtitle={emptySubtitle} />;
    return (
      <>
        {actionBar}
        {list}
      </>
    );
  };

  return (
    <AppSheet
      open={isDrawerOpen}
      onOpenChange={(open) => { if (!open) closeDrawer(); }}
      title="Notifications"
    >
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as NotificationStatus)}
        className="flex min-h-[60dvh] flex-col lg:min-h-full"
      >
        {/* Tab bar stays pinned while the list scrolls inside the sheet body. */}
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border/40 bg-background px-4 py-3">
          <TabsList className="grid flex-1 grid-cols-3">
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 && (
                <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="read">
              Read
              {readCount > 0 && <span className="ml-1.5 text-xs text-muted-foreground">{readCount}</span>}
            </TabsTrigger>
            <TabsTrigger value="archived">
              Archived
              {archivedCount > 0 && <span className="ml-1.5 text-xs text-muted-foreground">{archivedCount}</span>}
            </TabsTrigger>
          </TabsList>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 flex-shrink-0"
            onClick={handleRefresh}
            disabled={busy}
            aria-label="Refresh notifications"
          >
            <RefreshCw className={cn('h-4 w-4', (loading || refreshing) && 'animate-spin')} />
          </Button>
        </div>

        <TabsContent value="unread" className="m-0">
          {tabBody(
            unreadCount,
            "You're all caught up",
            'No unread notifications right now.',
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
              <span className="text-sm text-muted-foreground">{unreadCount} unread</span>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
                onClick={handleMarkAll}
                disabled={busy}
              >
                {markingAll ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
                Mark all read
              </Button>
            </div>,
          )}
        </TabsContent>

        <TabsContent value="read" className="m-0">
          {tabBody(readCount, 'Nothing read yet', "Notifications you've opened show here.")}
        </TabsContent>

        <TabsContent value="archived" className="m-0">
          {tabBody(archivedCount, 'Nothing archived', 'Notifications you dismiss show here.')}
        </TabsContent>
      </Tabs>
    </AppSheet>
  );
}
