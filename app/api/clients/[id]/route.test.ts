import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, PATCH } from './route'
import { createFakeTenant } from '@/test/helpers/fake-tenant'
import { getRequest, jsonRequest, routeParams } from '@/test/helpers/http'
import { resolveTenant } from '@/lib/auth/tenant'

vi.mock('@/lib/auth/tenant', () => ({ resolveTenant: vi.fn() }))
const resolveTenantMock = vi.mocked(resolveTenant)

describe('GET /api/clients/[id]', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('returns 404 for an id the scoped lookup cannot see', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await GET(getRequest('/api/clients/foreign'), routeParams({ id: 'foreign' }))
    expect(res.status).toBe(404)
  })

  /**
   * There is no balance column on clients, and there shouldn't be — it would
   * be a derived number that drifts. It is summed from their orders instead.
   */
  it('rolls up what the client has been billed, paid and still owes', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:clients', { data: { id: 'c-1', name: 'Kampala Traders' } })
    db.queue('select:orders', {
      data: [
        { total_amount: 480000, amount_paid: 300000, balance: 180000 },
        { total_amount: 620000, amount_paid: 620000, balance: 0 },
      ],
      count: 2,
    })

    const res = await GET(getRequest('/api/clients/c-1'), routeParams({ id: 'c-1' }))
    const { rollup } = await res.json()

    expect(rollup.count).toBe(2)
    expect(rollup.totals).toEqual({ billed: 1100000, paid: 920000, outstanding: 180000 })
    expect(rollup.exact).toBe(true)

    const [orders] = db.callsFor('select:orders')
    expect(orders.filters).toContainEqual(['eq', 'client_id', 'c-1'])
  })

  // A partial sum that looks authoritative is worse than none, so the flag
  // travels with it and the screen shows nothing rather than a wrong figure.
  it('marks the rollup inexact when there are more orders than were fetched', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:clients', { data: { id: 'c-1' } })
    db.queue('select:orders', {
      data: [{ total_amount: 100, amount_paid: 0, balance: 100 }],
      count: 900,
    })

    const { rollup } = await (
      await GET(getRequest('/api/clients/c-1'), routeParams({ id: 'c-1' }))
    ).json()

    // The count stays exact — PostgREST counts rows, it doesn't sample them.
    expect(rollup.count).toBe(900)
    expect(rollup.exact).toBe(false)
  })

  it('rolls up to zero for a client with no orders', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:clients', { data: { id: 'c-1' } })

    const { rollup } = await (
      await GET(getRequest('/api/clients/c-1'), routeParams({ id: 'c-1' }))
    ).json()

    expect(rollup).toEqual({
      count: 0,
      totals: { billed: 0, paid: 0, outstanding: 0 },
      exact: true,
    })
  })

})

describe('PATCH /api/clients/[id]', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('archives via status (the delete path in v2)', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('update:clients', { data: { id: 'c-1', status: 'archived' } })

    const res = await PATCH(
      jsonRequest('/api/clients/c-1', { status: 'archived' }, 'PATCH'),
      routeParams({ id: 'c-1' }),
    )

    expect(res.status).toBe(200)
    const [update] = db.callsFor('update:clients')
    expect(update.values).toEqual({ status: 'archived' })
    expect(update.filters).toContainEqual(['eq', 'id', 'c-1'])
  })

  it('rejects an empty update with 400', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await PATCH(jsonRequest('/api/clients/c-1', {}, 'PATCH'), routeParams({ id: 'c-1' }))
    expect(res.status).toBe(400)
  })
})
