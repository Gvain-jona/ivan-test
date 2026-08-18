'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  MoreHorizontal,
  MessageSquare,
  UserPlus,
  RefreshCw,
  Clock,
  Banknote,
  AtSign,
  Package,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import type { Notification, NotificationType } from '@/types/notifications';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/context/NotificationsContext';
import { useSheets } from '@/context/sheet-host';
import { notificationOrderId } from '@/lib/notifications/present';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NotificationItemProps {
  notification: Notification;
}

/**
 * The leading glyph is monochrome by design: the icon *shape* carries the
 * category (nothing is colour-coded), so the list reads as one calm stream
 * rather than a wall of coloured chips.
 */
const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  payment: Banknote,
  assignment: Package, // order.created
  status_change: RefreshCw,
  due_date: Clock,
  invitation: UserPlus, // member.added
  mention: AtSign,
  comment: MessageSquare,
};

/** Compact relative time — "now", "5m", "3h", "2d", then a short date. */
function compactAgo(iso: string): string {
  const secs = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return 'now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  if (secs < 86_400) return `${Math.floor(secs / 3600)}h`;
  if (secs < 604_800) return `${Math.floor(secs / 86_400)}d`;
  return format(new Date(iso), 'MMM d');
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const { markAsRead, archiveNotification } = useNotifications();
  const { openOrder } = useSheets();
  const { toast } = useToast();
  const [busy, setBusy] = useState<'read' | 'archive' | null>(null);

  const Icon = TYPE_ICON[notification.type] ?? MessageSquare;
  const unread = notification.status === 'unread';
  const archived = notification.status === 'archived';

  const handleClick = (e: React.MouseEvent) => {
    // Let the overflow menu (and its popover) handle their own clicks.
    if (
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('[role="menuitem"]') ||
      (e.target as HTMLElement).closest('[data-radix-popper-content-wrapper]')
    ) {
      e.stopPropagation();
      return;
    }

    if (unread) markAsRead(notification.id);

    // Deep-link to the linked order, if any. From a screen this is a clean
    // forward navigation — Back returns to the inbox.
    const orderId = notificationOrderId(notification);
    if (orderId) openOrder(orderId);
  };

  const runAction = async (
    kind: 'read' | 'archive',
    fn: () => Promise<boolean>,
    failure: string,
  ) => {
    setBusy(kind);
    const ok = await fn();
    setBusy(null);
    if (!ok) {
      toast({ title: 'Error', description: failure, variant: 'destructive' });
    }
  };

  return (
    <div
      className={cn(
        'group relative flex cursor-pointer items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40',
        archived && 'opacity-70',
      )}
      onClick={handleClick}
      data-testid="notification-item"
    >
      {/* Category glyph — neutral, gray-bordered. */}
      <div className="mt-0.5 flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] border border-border">
        <Icon className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={2} />
      </div>

      {/* Copy */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-[14px] text-foreground',
            unread ? 'font-semibold' : 'font-medium',
          )}
        >
          {notification.title}
        </p>
        {notification.message && (
          <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
            {notification.message}
          </p>
        )}
      </div>

      {/* Timestamp + unread dot (neutral). */}
      <div className="flex flex-shrink-0 flex-col items-end gap-1.5 pl-1">
        <span className="text-[11.5px] tabular-nums text-muted-foreground">
          {compactAgo(notification.timestamp)}
        </span>
        {unread && (
          <span
            className="h-[7px] w-[7px] rounded-full bg-foreground"
            aria-label="Unread"
          />
        )}
      </div>

      {/* Overflow actions — revealed on hover/focus so the row stays clean. */}
      <div
        className="absolute right-2 top-2 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 bg-background/90 backdrop-blur"
              aria-label="Notification actions"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreHorizontal className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            {unread && (
              <DropdownMenuItem
                onSelect={() =>
                  runAction(
                    'read',
                    () => markAsRead(notification.id),
                    'Could not mark as read. Please try again.',
                  )
                }
              >
                Mark as read
              </DropdownMenuItem>
            )}
            {!archived && (
              <DropdownMenuItem
                onSelect={() =>
                  runAction(
                    'archive',
                    () => archiveNotification(notification.id),
                    'Could not archive. Please try again.',
                  )
                }
              >
                Archive
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
