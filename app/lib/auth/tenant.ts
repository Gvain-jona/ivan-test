import { auth } from '@clerk/nextjs/server'
import { createV2AdminClient } from '@/utils/supabase/server-v2'
import { createTenantDb } from './tenant-db'
import type { TenantDb } from './tenant-db'

export type { TenantDb, OrgScopedTable } from './tenant-db'

// 'admin' deliberately dropped for now: Clerk's free plan gives 2 free
// custom org roles, and keeping the app to owner/staff avoids the paid
// B2B add-on. Re-add 'admin' as a custom Clerk role + here together
// if/when a middle tier is needed.
export type OrgRole = 'owner' | 'staff'

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
 * the dashboard's session-token customization (for new signups, the
 * Clerk webhook in app/api/webhooks/clerk sets this on `user.created`
 * — see that route for the provisioning flow).
 *
 * Tenancy source: Clerk Organizations, not the old custom
 * multi-membership model. `orgId`/`orgRole` are default Clerk session
 * claims (populated whenever the user has an active organization —
 * no custom "Customize session token" config needed, unlike
 * internal_user_id). Clerk's own org-switcher is the sole "active
 * org" signal now; there is no app-side equivalent —
 * user_settings.active_organization_id is retired here (it was always
 * read-only, nothing ever wrote to it).
 *
 * v2.organizations stays a thin mirror keyed by `clerk_org_id` (for
 * app-only fields: order_statuses, currency, counters) — its internal
 * uuid `id` is what feeds TenantDb/organizationId everywhere, unchanged.
 * A brand-new Clerk org can have a few seconds' lag before its mirror
 * row exists (webhook delivery isn't instant): this resolves to null
 * in that window, same as any other unprovisioned case — see
 * app/dashboard/layout.tsx for the "setting up" state that covers it.
 *
 * Data access stays on the service-role TenantDb until the RLS flip
 * (Supabase third-party auth + v2 policies); this function remains
 * the single swap point for that.
 */
export async function resolveTenant(): Promise<TenantContext | null> {
  const { userId: clerkUserId, sessionClaims, orgId, orgRole: rawOrgRole } = await auth()
  if (!clerkUserId) return null

  const internalUserId = sessionClaims?.internal_user_id
  if (!internalUserId || !UUID_RE.test(internalUserId)) return null

  if (!orgId || !rawOrgRole) return null

  // Clerk role keys are namespaced (`org:owner`); strip the prefix to
  // match the app's plain role strings. Configure Clerk's dashboard
  // custom org roles as owner/staff so this is a straight match, not a
  // translation.
  const orgRole = rawOrgRole.replace(/^org:/, '')
  if (orgRole !== 'owner' && orgRole !== 'staff') return null

  const admin = createV2AdminClient()

  const { data: organization, error } = await admin
    .from('organizations')
    .select('id')
    .eq('clerk_org_id', orgId)
    .maybeSingle()

  if (error || !organization) return null

  return {
    userId: internalUserId,
    organizationId: organization.id,
    orgRole,
    db: createTenantDb(admin, organization.id),
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
