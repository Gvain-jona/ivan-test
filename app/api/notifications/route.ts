import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import {
  handleApiError,
  handleSupabaseError,
  handleUnexpectedError,
} from '@/lib/api/error-handler';
import { listQuerySchema, notificationPatchSchema } from '@/lib/api/validators';

/**
 * The notifications module — the read/mutate half of the foundation.
 * Design: docs/v2-migration/NOTIFICATIONS_REBUILD.md (§5, §6, §12).
 *
 * There is one activity stream (v2.notifications); the bell inbox is its
 * DIRECTED projection — activities where the caller is in the audience, minus
 * their own actions, with the caller's own read/archived state attached.
 * Writes come from notify() (app/lib/notifications/notify.ts), not from here.
 */

const NOTIFICATION_COLUMNS =
  'id, actor_user_id, verb, category, object_type, object_id, ' +
  'target_type, target_id, data, group_key, priority, created_at';

type NotificationState = 'unread' | 'read' | 'archived';

/**
 * GET /api/notifications — the caller's inbox projection.
 *
 * Two queries, not a PostgREST embed: the facts page (audience-filtered,
 * actor-excluded, newest first), then the caller's read-state for that page,
 * merged in. The embed's left-join-with-filter semantics are subtle enough
 * that two plain queries are the honest foundation; an inbox view can replace
 * them later without changing this contract.
 *
 * Archived items are returned with `state: 'archived'` rather than filtered in
 * SQL — excluding them at the DB layer needs the read-state join and would
 * complicate paging; the surface decides what to show. Query: limit, offset.
 */
export async function GET(request: NextRequest) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const params = request.nextUrl.searchParams;
    const { limit, offset } = listQuerySchema.parse({
      limit: params.get('limit') ?? undefined,
      offset: params.get('offset') ?? undefined,
    });

    // `me` is interpolated into the .or() filter strings below. It is the
    // internal_user_id claim, which resolveTenant() validates against an
    // anchored UUID regex before we ever get here — so it cannot carry a comma,
    // paren or PostgREST operator, and the interpolation is not injectable.
    // Keep that invariant if this value's source ever changes.
    const me = tenant.userId;

    const { data: facts, error, count } = await tenant.db
      .from('notifications')
      .select(NOTIFICATION_COLUMNS, { count: 'exact' })
      // Access: org-wide OR I'm a named recipient.
      .or(`audience_scope.eq.org,recipient_user_ids.cs.{${me}}`)
      // Never notify myself of my own action (system events have no actor).
      .or(`actor_user_id.is.null,actor_user_id.neq.${me}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) return handleSupabaseError(error);

    const rows = (facts ?? []) as { id: string }[];
    const ids = rows.map(r => r.id);

    // The caller's own state for exactly this page.
    const stateById = new Map<string, { read_at: string | null; archived_at: string | null }>();
    if (ids.length > 0) {
      const { data: reads, error: readsError } = await tenant.db
        .from('notification_reads')
        .select('notification_id, read_at, archived_at')
        .eq('user_id', me)
        .in('notification_id', ids);
      if (readsError) return handleSupabaseError(readsError);

      for (const r of (reads ?? []) as {
        notification_id: string;
        read_at: string | null;
        archived_at: string | null;
      }[]) {
        stateById.set(r.notification_id, { read_at: r.read_at, archived_at: r.archived_at });
      }
    }

    const notifications = rows.map(row => {
      const s = stateById.get(row.id);
      const state: NotificationState = s?.archived_at ? 'archived' : s?.read_at ? 'read' : 'unread';
      return {
        ...row,
        state,
        read_at: s?.read_at ?? null,
        archived_at: s?.archived_at ?? null,
      };
    });

    return NextResponse.json({ notifications, total: count ?? 0 });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

/**
 * PATCH /api/notifications — move one notification's per-user state.
 *
 * State is the caller's own row in notification_reads, not the fact. The row
 * is sparse, so this is update-then-insert-if-missing (the scoped accessor
 * exposes no upsert). Archive-not-delete: 'archived'/'active' toggle
 * archived_at; 'read'/'unread' toggle read_at.
 */
export async function PATCH(request: NextRequest) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const parsed = notificationPatchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten());
    }

    const { id, state } = parsed.data;
    const me = tenant.userId; // validated UUID (see GET) — safe to interpolate.
    const now = new Date().toISOString();

    // Authorization: you may only move state on a notification you can actually
    // see. TenantDb already scopes this to the caller's org; the audience
    // predicate (the same one GET projects with) additionally requires that the
    // notification is addressed to the caller and is not their own action.
    // Without it, a caller could write read-state rows against arbitrary
    // notification ids (a write-side IDOR) — harmless cross-tenant, but it lets
    // them skew their own unread count. Reject anything outside the audience.
    const { data: visible, error: visibleError } = await tenant.db
      .from('notifications')
      .select('id')
      .eq('id', id)
      .or(`audience_scope.eq.org,recipient_user_ids.cs.{${me}}`)
      .or(`actor_user_id.is.null,actor_user_id.neq.${me}`)
      .maybeSingle();
    if (visibleError) return handleSupabaseError(visibleError);
    if (!visible) return handleApiError('NOT_FOUND', 'Notification not found');

    // Only the column the transition names; the other is left untouched on
    // update, and defaults to null on insert.
    const patch: { read_at?: string | null; archived_at?: string | null } =
      state === 'read'
        ? { read_at: now }
        : state === 'unread'
          ? { read_at: null }
          : state === 'archived'
            ? { archived_at: now }
            : { archived_at: null };

    const { data: updated, error: updateError } = await tenant.db
      .from('notification_reads')
      .update(patch)
      .eq('notification_id', id)
      .eq('user_id', me)
      .select('id');
    if (updateError) return handleSupabaseError(updateError);

    if (!updated || (updated as unknown[]).length === 0) {
      const { error: insertError } = await tenant.db
        .from('notification_reads')
        .insert({ notification_id: id, user_id: me, ...patch });
      if (insertError) return handleSupabaseError(insertError);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
