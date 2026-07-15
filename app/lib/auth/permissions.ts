import type { OrgRole } from './tenant'

/**
 * The v2 authorization vocabulary: code checks PERMISSIONS, never roles
 * (see STATE.md "Authorization model" decision, research-grounded
 * 2026-07-15). Routes and UI ask `can(role, 'orders:cancel')`; which
 * roles grant which permissions is DATA, held in the map below.
 *
 * Today the map is a fixed, code-level default — the industry baseline
 * (fixed role set, per-tenant assignment). When org-configurable
 * privileges or Clerk custom-permission claims arrive, THIS MODULE is
 * the only thing that changes: the map's source moves (org settings /
 * JWT claims); every `can()` call site stays put.
 *
 * Add a permission slug only when a real gate needs it — no
 * speculative vocabulary.
 */
export type Permission = 'orders:cancel' | 'fields:manage'

const ROLE_PERMISSIONS: Record<OrgRole, ReadonlySet<Permission>> = {
  owner: new Set<Permission>(['orders:cancel', 'fields:manage']),
  admin: new Set<Permission>(['orders:cancel', 'fields:manage']),
  // Staff run intake and production: create orders, edit items, record
  // payments, move workflow status — none of which are gated. They
  // don't cancel orders or reshape the org's field registry.
  staff: new Set<Permission>(),
}

/**
 * Whether `role` grants `permission`. `null`/`undefined` (e.g. a UI
 * whose org context is still loading) is always denied — least
 * privilege by default.
 */
export function can(role: OrgRole | null | undefined, permission: Permission): boolean {
  return role != null && ROLE_PERMISSIONS[role].has(permission)
}
