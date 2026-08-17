'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useNotifications } from '@/context/NotificationsContext';
import MobileFeedHeader from '@/components/navigation/MobileFeedHeader';
import { NotificationGroup } from '@/components/notifications/NotificationGroup';
import { cn } from '@/lib/utils';
import type { NotificationGroup as NotificationGroupType } from '@/types/notifications';

type Filter = 'all' | 'unread';

/**
 * Notifications — the full-screen inbox (N1).
 *
 * A top-level destination, not an overlay: the tab bar's Alerts tab routes
 * here, and a notification's deep-link out to its order returns here on Back.
 * The screen carve-out for a browse-and-triage surface — see
 * docs/v2-migration/NOTIFICATIONS_REBUILD.md and CLAUDE.md ("screen vs sheet").
 *
 * Data is the shared bell layer (NotificationsContext → SWR pull). The inbox
 * list is fetched lazily, so this screen opts in via subscribeList() while
 * mounted; the badge count runs independently.
 */
export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAllAsRead,
    groupNotificationsByDate,
    subscribeList,
  } = useNotifications();

  const [filter, setFilter] = useState<Filter>('all');
  const [markingAll, setMarkingAll] = useState(false);
  // The lazy list is only enabled once this surface's subscribe effect runs
  // (after first paint). Until then, treat the screen as resolving rather than
  // flashing the empty state for a frame.
  const [entered, setEntered] = useState(false);

  // Opt this surface into the lazily-fetched inbox list while it is mounted.
  useEffect(() => {
    setEntered(true);
    return subscribeList();
  }, [subscribeList]);

  const visible = useMemo(
    () =>
      notifications.filter(n =>
        filter === 'unread' ? n.status === 'unread' : n.status !== 'archived',
      ),
    [notifications, filter],
  );
  const groups: NotificationGroupType[] = useMemo(
    () => groupNotificationsByDate(visible),
    [visible, groupNotificationsByDate],
  );

  const handleMarkAll = async () => {
    setMarkingAll(true);
    await markAllAsRead();
    setMarkingAll(false);
  };

  const showLoading = (!entered || loading) && notifications.length === 0;

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-5">
      <MobileFeedHeader />

      <header>
        <h1 className="text-[22px] font-semibold text-foreground">Notifications</h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {unreadCount > 0 ? `${unreadCount} unread` : 'You’re all caught up'}
        </p>
      </header>

      <div className="mt-4 flex items-center justify-between">
        {/* All / Unread — the triage filter a screen has room for. */}
        <div className="inline-flex items-center gap-1 rounded-full border border-border p-1">
          {(['all', 'unread'] as Filter[]).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-[13px] font-medium capitalize transition-colors',
                filter === f ? 'bg-muted text-foreground' : 'text-muted-foreground',
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleMarkAll}
          disabled={markingAll || unreadCount === 0}
          className="inline-flex items-center gap-1.5 px-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          {markingAll ? (
            <Loader2 className="h-[15px] w-[15px] animate-spin" />
          ) : (
            <CheckCheck className="h-[15px] w-[15px]" />
          )}
          Mark all read
        </button>
      </div>

      <div className="mt-2">
        {showLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : error ? (
          <EmptyState
            title="Couldn’t load notifications"
            subtitle={error}
            action={
              <button
                type="button"
                onClick={() => fetchNotifications()}
                className="rounded-full border border-border px-4 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
              >
                Try again
              </button>
            }
          />
        ) : groups.length === 0 ? (
          <EmptyState
            title={filter === 'unread' ? 'No unread notifications' : 'You’re all caught up'}
            subtitle={
              filter === 'unread'
                ? 'Everything here has been read.'
                : 'Order activity and payments will show up here.'
            }
          />
        ) : (
          <div className="-mx-4">
            {groups.map(group => (
              <NotificationGroup key={group.date} group={group} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Neutral, monochrome empty/error placeholder. */
function EmptyState({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border">
        <Bell className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-[15px] font-medium text-foreground">{title}</p>
      {subtitle && <p className="mt-1 max-w-xs text-[13px] text-muted-foreground">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
