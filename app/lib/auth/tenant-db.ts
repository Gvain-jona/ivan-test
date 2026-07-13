import type { SupabaseClient } from '@supabase/supabase-js'
import type { DatabaseV2 } from '@/types/supabase-v2'

type V2Client = SupabaseClient<DatabaseV2, 'v2'>
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
 *
 * This module is deliberately free of Next.js imports so it can be
 * unit-tested against a stub client (see tenant-db.test.ts).
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

export function createTenantDb(client: V2Client, organizationId: string): TenantDb {
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
