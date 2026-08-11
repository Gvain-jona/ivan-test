/**
 * Compile-time enforcement tests for the TenantDb scoped accessor.
 *
 * This file is never executed — `npx tsc --noEmit` (and `next build`,
 * which type-checks with the same tsconfig) is what runs it. Each
 * @ts-expect-error below asserts that the marked line FAILS to
 * compile; if a refactor ever makes one of them legal, tsc reports
 * "unused @ts-expect-error" and the build breaks. That is the point:
 * the tenant boundary is enforced by the type system, and this file
 * keeps it that way.
 */
import type { TenantContext } from '@/lib/auth/tenant'

export async function tenantScopingCompileChecks(tenant: TenantContext) {
  // Entities archive rather than delete, and the type is what enforces it:
  // `delete` resolves to `never` on every table outside `DeletableTable`, so
  // calling it doesn't compile. This is the guard that keeps the carve-out
  // below from quietly becoming a general hard delete.
  // @ts-expect-error — no delete on an entity table; orders archive as 'cancelled'
  tenant.db.from('orders').delete()
  // @ts-expect-error — clients archive too
  tenant.db.from('clients').delete()

  // order_items is the one exception: a child row of an aggregate, with no
  // status to archive into and no identity outside its order. This line must
  // keep compiling — removing a mistaken line is how an order gets corrected.
  tenant.db.from('order_items').delete()

  // A route cannot smuggle its own organization_id into an insert;
  // the accessor injects the caller's org itself.
  tenant.db.from('notes').insert({
    entity_type: 'order',
    entity_id: '00000000-0000-0000-0000-000000000000',
    content: 'x',
    // @ts-expect-error — organization_id is stripped from Insert
    organization_id: 'someone-elses-org',
  })

  // The raw service-role client is not reachable from route code.
  // @ts-expect-error — no .auth on the scoped accessor
  tenant.db.auth

  // User-scoped tables are not accessible through the org-scoped path.
  // @ts-expect-error — user_settings is not an org-scoped table
  tenant.db.from('user_settings')

  // The organizations row is read-only through the accessor.
  // @ts-expect-error — no update via organization()
  tenant.db.organization().update({ name: 'x' })
}
