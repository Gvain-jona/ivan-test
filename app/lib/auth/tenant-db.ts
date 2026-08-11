import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import type { DatabaseV2, Json } from '@/types/supabase-v2'

type V2Client = SupabaseClient<DatabaseV2, 'v2'>
type V2Tables = DatabaseV2['v2']['Tables']
type V2Functions = DatabaseV2['v2']['Functions']
type OrganizationRow = V2Tables['organizations']['Row']

/**
 * Columns the app may write on its own organizations row. name/slug/logo
 * are Clerk-authoritative and everything else is DB-derived; `settings` is
 * further governed by a DB trigger that whitelists its blocks.
 */
export type OrganizationWritable = {
  settings?: Json
  onboarding_completed_at?: string | null
}

type OrgResult<T> = PromiseLike<{ data: T; error: PostgrestError | null }>

/**
 * The organizations accessor is typed against its own row rather than the
 * client's relation union. The union collapses to `{}` as soon as the schema
 * declares views, which would silently strip every column from callers
 * instead of failing loudly.
 */
interface OrgSelectBuilder extends OrgResult<Partial<OrganizationRow>[] | null> {
  single(): OrgResult<Partial<OrganizationRow> | null>
  maybeSingle(): OrgResult<Partial<OrganizationRow> | null>
}

interface OrgUpdateBuilder extends OrgResult<null> {
  select(columns?: string): OrgSelectBuilder
}

/**
 * Tables that carry an organization_id column. 'organizations' itself
 * is scoped by id (see TenantDb.organization()); 'user_settings' is
 * user-scoped and only touched inside resolveTenant().
 */
export type OrgScopedTable = Exclude<keyof V2Tables & string, 'organizations' | 'user_settings'>

/**
 * The tables a row may actually be deleted from.
 *
 * v2's rule is that **entities archive** — orders become `cancelled`, clients,
 * products and field definitions become `archived`. Nothing with a lifecycle
 * gets destroyed, and this wrapper carried no `delete` at all so that rule
 * couldn't be broken by accident.
 *
 * `order_items` is the case that rule doesn't fit. It is not an entity: it has
 * no status column to archive into (verified against the live schema), no
 * identity outside its order, and it already CASCADEs when that order goes.
 * Removing a line someone added by mistake is *editing the order*, not
 * destroying a record — and leaving a wrong line on an order permanently would
 * corrupt the one thing that must be right, its total.
 *
 * Keep this union as small as the argument for it. A table belongs here only
 * when it is a child row of an aggregate with no lifecycle of its own; if it
 * has a `status`, archive it instead.
 */
export type DeletableTable = Extract<OrgScopedTable, 'order_items'>

/**
 * Org-scoped data access. The underlying client is service-role (RLS
 * is bypassed), so this wrapper IS the tenant boundary until Clerk +
 * RLS land: every operation it exposes applies the organization_id
 * scope itself, and the raw client is never handed to route code.
 *
 * - select/update auto-append .eq('organization_id', …)
 * - insert injects organization_id (the Insert type won't accept one)
 * - delete is org-scoped and restricted to `DeletableTable` (see below)
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
    /**
     * Only present for `DeletableTable`. Everything else archives, and the
     * type is what enforces that — `db.from('orders').delete()` does not
     * compile.
     */
    delete: T extends DeletableTable
      ? () => ReturnType<ReturnType<V2Client['from']>['delete']>
      : never
  }
  /**
   * The caller's own organizations row (scoped by id). update() accepts
   * only `settings` and `onboarding_completed_at` — name/slug/logo are
   * Clerk-authoritative, and order status values live in field_definitions,
   * not here.
   */
  organization(): {
    select(columns?: string): OrgSelectBuilder
    update(values: OrganizationWritable): OrgUpdateBuilder
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
        // Scoped like the rest: a caller still has to narrow by id, and the
        // org filter is applied here so a missing .eq() can't widen it to
        // another tenant's rows.
        delete: () =>
          (client.from(table) as any).delete().eq('organization_id', organizationId),
      } as any
    },
    organization() {
      return {
        select: (columns?: string) =>
          (client.from('organizations') as any).select(columns).eq('id', organizationId),
        update: (values: object) =>
          (client.from('organizations') as any).update(values).eq('id', organizationId),
      } as any
    },
    rpc(fn, args) {
      return client.rpc(fn, args as any) as any
    },
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
