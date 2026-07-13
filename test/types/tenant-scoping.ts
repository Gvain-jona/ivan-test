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
  // Hard delete is not exposed — v2 archives via status updates.
  // @ts-expect-error — no delete on scoped tables
  tenant.db.from('orders').delete()

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
