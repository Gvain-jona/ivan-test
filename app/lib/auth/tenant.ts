import { createClient } from '@/utils/supabase/server'
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
 * INTERIM identity source: the existing Supabase-Auth session (magic
 * link) still authenticates users, and v2.organization_members is
 * seeded with those same auth.users UUIDs. When Clerk replaces auth,
 * only the identity step here changes — routes are untouched.
 *
 * Active org follows the handoff semantics: user_settings.
 * active_organization_id wins when it matches a real membership,
 * otherwise the first membership.
 */
export async function resolveTenant(): Promise<TenantContext | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createV2AdminClient()

  const [{ data: settings }, { data: memberships, error }] = await Promise.all([
    admin.from('user_settings').select('active_organization_id').eq('user_id', user.id).maybeSingle(),
    admin.from('organization_members').select('organization_id, role').eq('user_id', user.id),
  ])

  if (error || !memberships || memberships.length === 0) return null

  const membership =
    memberships.find(m => m.organization_id === settings?.active_organization_id) ??
    memberships[0]

  return {
    userId: user.id,
    organizationId: membership.organization_id,
    orgRole: membership.role as OrgRole,
    db: createTenantDb(admin, membership.organization_id),
  }
}
