'use client';

import { useCallback } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { PLATFORM_API, buildKey, keysUnder, apiFetcher, apiRequest } from '@/lib/api/client';

/**
 * The notifications read layer — the bell's DIRECTED projection of the
 * activity stream (docs/v2-migration/NOTIFICATIONS_REBUILD.md §6).
 *
 * Delivery is SWR pull, not realtime: no v2 module can subscribe RLS-scoped
 * until the Phase 2 flip (§4). `refreshInterval` + `revalidateOnFocus` here are
 * the deliberate, documented exception to the app-wide no-auto-refresh default
 * (app/lib/swr-config.ts) — the bell is the one surface that must feel live.
 */

/** One row of the inbox projection, as GET /api/notifications returns it. */
export interface InboxNotification {
  id: string;
  actor_user_id: string | null;
  verb: string;
  category: string;
  object_type: string;
  object_id: string;
  target_type: string | null;
  target_id: string | null;
  data: Record<string, unknown> | null;
  group_key: string | null;
  priority: string;
  created_at: string;
  state: 'unread' | 'read' | 'archived';
  read_at: string | null;
  archived_at: string | null;
}

export type NotificationStateChange = 'read' | 'unread' | 'archived' | 'active';

const REFRESH_MS = 90_000; // ~90s pull cadence (§4/§10).

export function useNotificationInbox(params: { limit?: number } = {}) {
  const key = buildKey(PLATFORM_API.NOTIFICATIONS, { limit: params.limit });
  const { data, error, isLoading, mutate } = useSWR<{
    notifications: InboxNotification[];
    total: number;
  }>(key, apiFetcher, {
    refreshInterval: REFRESH_MS,
    revalidateOnFocus: true,
    dedupingInterval: 30_000,
  });

  return {
    notifications: data?.notifications ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}

/**
 * The unread badge count — a cheap, page-independent server count
 * (GET /api/notifications/count), separate from the inbox list so the badge
 * doesn't depend on how many rows the drawer happened to fetch. Shares the
 * `/api/notifications` key prefix, so `useNotificationMutations` invalidates it
 * too — marking one read updates the badge.
 */
export function useUnreadCount() {
  const { data } = useSWR<{ unread: number }>(
    `${PLATFORM_API.NOTIFICATIONS}/count`,
    apiFetcher,
    {
      refreshInterval: REFRESH_MS,
      revalidateOnFocus: true,
      dedupingInterval: 30_000,
    },
  );
  return data?.unread ?? 0;
}

export function useNotificationMutations() {
  const { mutate } = useSWRConfig();
  const invalidate = useCallback(
    () => mutate(keysUnder(PLATFORM_API.NOTIFICATIONS)),
    [mutate],
  );

  /** Move one notification's per-user state, then revalidate the inbox. */
  const setState = useCallback(
    async (id: string, state: NotificationStateChange) => {
      await apiRequest(PLATFORM_API.NOTIFICATIONS, 'PATCH', { id, state });
      await invalidate();
    },
    [invalidate],
  );

  return { setState };
}
