import { auth } from '@clerk/nextjs/server'
import { createV2AdminClient } from '@/utils/supabase/server-v2'
import { createTenantDb } from './tenant-db'
import type { TenantDb } from './tenant-db'

export type { TenantDb, OrgScopedTable } from './tenant-db'

export type OrgRole = 'owner' | 'admin' | 'staff'

export interface TenantContext {
  userId: string
  organizationId: string
  orgRole: OrgRole
  /**
   * Org-scoped accessor over the service-role v2 client (see
   * tenant-db.ts). Routes cannot reach the raw client from here — the
   * organization_id filter is applied by construction, not by
   * convention. Swap target when Clerk lands: back this with the RLS
   * client and the interface holds.
   */
  db: TenantDb
}

/**
 * Resolves the caller's tenant context for v2 routes.
 *
 * Identity source: the Clerk session. The app-facing user id is NOT
 * the Clerk id (`user_…`, not a UUID) — it is the `internal_user_id`
 * UUID claim, set from Clerk `public_metadata.internal_user_id` via
 * the dashboard's session-token customization. Existing users carry
 * their pre-Clerk auth.users UUID there, so v2.organization_members
 * needed no remap. A signed-in user without the claim (not yet
 * provisioned) has no tenancy and resolves to null.
 *
 * Data access stays on the service-role TenantDb until the RLS flip
 * (Supabase third-party auth + v2 policies); this function remains
 * the single swap point for that.
 *
 * Active org follows the handoff semantics: user_settings.
 * active_organization_id wins when it matches a real membership,
 * otherwise the first membership.
 */
export async function resolveTenant(): Promise<TenantContext | null> {
  const { userId: clerkUserId, sessionClaims } = await auth()
  if (!clerkUserId) return null

  const internalUserId = sessionClaims?.internal_user_id
  if (!internalUserId || !UUID_RE.test(internalUserId)) return null

  const admin = createV2AdminClient()

  const [{ data: settings }, { data: memberships, error }] = await Promise.all([
    admin.from('user_settings').select('active_organization_id').eq('user_id', internalUserId).maybeSingle(),
    admin.from('organization_members').select('organization_id, role').eq('user_id', internalUserId),
  ])

  if (error || !memberships || memberships.length === 0) return null

  const membership =
    memberships.find(m => m.organization_id === settings?.active_organization_id) ??
    memberships[0]

  return {
    userId: internalUserId,
    organizationId: membership.organization_id,
    orgRole: membership.role as OrgRole,
    db: createTenantDb(admin, membership.organization_id),
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
