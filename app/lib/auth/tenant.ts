import { createClient } from '@/utils/supabase/server'
import { createV2AdminClient } from '@/utils/supabase/server-v2'
import type { DatabaseV2 } from '@/types/supabase-v2'

export type OrgRole = 'owner' | 'admin' | 'staff'

type V2Client = ReturnType<typeof createV2AdminClient>
type V2Tables = DatabaseV2['v2']['Tables']
type V2Functions = DatabaseV2['v2']['Functions']

/**
 * Tables that carry an organization_id column. 'organizations' itself
 * is scoped by id (see TenantDb.organization()); 'user_settings' is
 * user-scoped and only touched inside resolveTenant().
 */
export type OrgScopedTable = Exclude<keyof V2Tables & string, 'organizations' | 'user_settings'>

/**
 * Org-scoped data access. The underlying client is service-role (RLS
 * is bypassed), so this wrapper IS the tenant boundary until Clerk +
 * RLS land: every operation it exposes applies the organization_id
 * scope itself, and the raw client is never handed to route code.
 *
 * - select/update auto-append .eq('organization_id', …)
 * - insert injects organization_id (the Insert type won't accept one)
 * - there is deliberately no delete: v2 archives via status updates
 * - further chaining (.eq/.in/.ilike/.order/.range/.single/…) works as
 *   usual on the returned builders
 */
export interface TenantDb {
  from<T extends OrgScopedTable>(table: T): {
    select<Q extends string = '*'>(
      columns?: Q,
      options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean },
    ): ReturnType<ReturnType<V2Client['from']>['select']>
    insert(values: Omit<V2Tables[T]['Insert'], 'organization_id'>): ReturnType<ReturnType<V2Client['from']>['insert']>
    update(values: V2Tables[T]['Update']): ReturnType<ReturnType<V2Client['from']>['update']>
  }
  /** The caller's own organizations row (scoped by id, read-only). */
  organization(): {
    select<Q extends string = '*'>(columns?: Q): ReturnType<ReturnType<V2Client['from']>['select']>
  }
  /** RPCs take their org explicitly (p_org) — nothing to inject. */
  rpc<F extends keyof V2Functions & string>(
    fn: F,
    args?: V2Functions[F]['Args'],
  ): ReturnType<V2Client['rpc']>
}

function createTenantDb(client: V2Client, organizationId: string): TenantDb {
  // The `any` casts below are the single sanctioned spot where scoping
  // meets supabase-js generics; everything callers see is typed via
  // the TenantDb interface above.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return {
    from(table) {
      return {
        select: (columns?: string, options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) =>
          (client.from(table) as any).select(columns, options).eq('organization_id', organizationId),
        insert: (values: object) =>
          (client.from(table) as any).insert({ ...values, organization_id: organizationId }),
        update: (values: object) =>
          (client.from(table) as any).update(values).eq('organization_id', organizationId),
      } as any
    },
    organization() {
      return {
        select: (columns?: string) =>
          (client.from('organizations') as any).select(columns).eq('id', organizationId),
      } as any
    },
    rpc(fn, args) {
      return client.rpc(fn, args as any) as any
    },
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export interface TenantContext {
  userId: string
  organizationId: string
  orgRole: OrgRole
  /**
   * Org-scoped accessor over the service-role v2 client. Routes cannot
   * reach the raw client from here — the organization_id filter is
   * applied by construction, not by convention. Swap target when Clerk
   * lands: back this with the RLS client and the interface holds.
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
