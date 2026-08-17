import { NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import {
  handleApiError,
  handleSupabaseError,
  handleUnexpectedError,
} from '@/lib/api/error-handler';

/**
 * GET /api/notifications/count — the caller's unread badge count.
 *
 * Cheap and page-independent (the inbox GET's per-page count can't feed a
 * badge). Computed as: audience notifications the caller didn't cause, minus
 * the ones they've resolved (read or archived).
 *
 * Two head-only COUNTs and a subtraction, rather than an anti-join: every
 * resolved `notification_reads` row for a user necessarily belongs to a
 * notification that was in their audience (they can only act on what their
 * inbox showed them), so the subtraction is exact. A row left explicitly
 * unread (read_at and archived_at both null) is not "resolved", so it still
 * counts — which is the point of marking something unread again.
 *
 * Design: docs/v2-migration/NOTIFICATIONS_REBUILD.md §13.
 */
export async function GET() {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    // Validated UUID (resolveTenant's anchored regex), so the interpolation
    // into the .or() filters below carries no injection surface.
    const me = tenant.userId;

    const { count: audience, error: audienceError } = await tenant.db
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .or(`audience_scope.eq.org,recipient_user_ids.cs.{${me}}`)
      .or(`actor_user_id.is.null,actor_user_id.neq.${me}`);
    if (audienceError) return handleSupabaseError(audienceError);

    const { count: resolved, error: resolvedError } = await tenant.db
      .from('notification_reads')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', me)
      .or('read_at.not.is.null,archived_at.not.is.null');
    if (resolvedError) return handleSupabaseError(resolvedError);

    const unread = Math.max(0, (audience ?? 0) - (resolved ?? 0));
    return NextResponse.json({ unread });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
