import type { TenantDb } from '@/lib/auth/tenant';
import type { Json } from '@/types/supabase-v2';

/**
 * The notifications write path — the core of the activity stream.
 *
 * `notify()` records ONE fact with an audience; it is not a per-recipient
 * fan-out (see docs/v2-migration/NOTIFICATIONS_REBUILD.md §6). The inbox
 * projection (app/api/notifications/route.ts) decides who sees it from the
 * audience, and excludes the actor from their own inbox.
 *
 * This is the "workflow" layer of the four-layer model (event → workflow →
 * item → channel, §12.2), kept deliberately thin: a single insert. Channels
 * (email/push) and digests plug in here later without touching the call sites.
 *
 * Called from the API write paths after the write commits (app-layer emit,
 * §7) — never a DB trigger, so nothing here sits near the money functions.
 */

/** Preference-grouping buckets (§12.4). The unit a future preference matrix attaches to. */
export type NotificationCategory = 'order_activity' | 'payments' | 'team';

/** The activity types in scope for the foundation (§9.1). Free-form by design
 *  (the column is text) — this union is the app's current vocabulary, widened
 *  by adding a member, never a migration. */
export type NotificationVerb =
  | 'order.created'
  | 'order.status_changed'
  | 'payment.recorded'
  | 'member.added';

/** Who the fact concerns — the ACCESS dimension (§6). */
export type NotificationAudience =
  | { scope: 'org' }
  | { scope: 'users'; userIds: string[] };

export interface NotifyInput {
  verb: NotificationVerb;
  category: NotificationCategory;
  /** Who performed it; null for system events. Excluded from their own inbox. */
  actorUserId: string | null;
  /** The entity the activity is about. */
  object: { type: string; id: string };
  /** Optional context (e.g. the order a payment settles). */
  target?: { type: string; id: string };
  /** Small denormalized render snapshot (order_number, client_name, amount, …). */
  data?: Json;
  /** Aggregation key, e.g. `payments:order:<id>` (§12.5). Defaults to none. */
  groupKey?: string;
  audience: NotificationAudience;
  priority?: 'normal' | 'high';
}

/**
 * Records one notification fact against the caller's org. `organization_id`
 * is injected by the org-scoped TenantDb, not passed here.
 *
 * Returns the Supabase error (or null) rather than throwing: notifications are
 * a side effect of a primary write (creating an order, recording a payment),
 * and a failure to notify must never fail or roll back that primary action.
 * Callers log the error and move on.
 */
export async function notify(
  db: TenantDb,
  input: NotifyInput,
): Promise<{ error: { message: string } | null }> {
  // Inline discriminant so TS narrows the union (a boolean alias wouldn't).
  const recipientUserIds = input.audience.scope === 'users' ? input.audience.userIds : [];

  const { error } = await db.from('notifications').insert({
    actor_user_id: input.actorUserId,
    verb: input.verb,
    category: input.category,
    object_type: input.object.type,
    object_id: input.object.id,
    target_type: input.target?.type ?? null,
    target_id: input.target?.id ?? null,
    data: input.data ?? {},
    group_key: input.groupKey ?? null,
    audience_scope: input.audience.scope,
    recipient_user_ids: recipientUserIds,
    priority: input.priority ?? 'normal',
  });

  return { error: error ? { message: error.message } : null };
}
