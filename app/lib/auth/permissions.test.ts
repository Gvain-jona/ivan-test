import { describe, expect, it } from 'vitest'
import { can } from './permissions'

/**
 * Pins the default role→permission map. If the map's source ever moves
 * (org settings, Clerk claims), these become the defaults new orgs
 * start from — the semantics asserted here are the product baseline.
 */
describe('can', () => {
  it('grants owner and admin the gated operations', () => {
    expect(can('owner', 'orders:cancel')).toBe(true)
    expect(can('owner', 'fields:manage')).toBe(true)
    expect(can('admin', 'orders:cancel')).toBe(true)
    expect(can('admin', 'fields:manage')).toBe(true)
  })

  it('denies staff the gated operations', () => {
    expect(can('staff', 'orders:cancel')).toBe(false)
    expect(can('staff', 'fields:manage')).toBe(false)
  })

  it('denies when the role is not yet known (least privilege)', () => {
    expect(can(null, 'orders:cancel')).toBe(false)
    expect(can(undefined, 'fields:manage')).toBe(false)
  })
})
