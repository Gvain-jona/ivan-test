import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, PATCH } from './route'
import { createFakeTenant } from '@/test/helpers/fake-tenant'
import { getRequest, jsonRequest, routeParams } from '@/test/helpers/http'
import { resolveTenant } from '@/lib/auth/tenant'

vi.mock('@/lib/auth/tenant', () => ({ resolveTenant: vi.fn() }))
const resolveTenantMock = vi.mocked(resolveTenant)

describe('GET /api/products/[id]', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('rejects unauthenticated callers with 401', async () => {
    resolveTenantMock.mockResolvedValue(null)
    const res = await GET(getRequest('/api/products/p-1'), routeParams({ id: 'p-1' }))
    expect(res.status).toBe(401)
  })

  it('404s for an id the scoped lookup cannot see', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)

    const res = await GET(getRequest('/api/products/foreign'), routeParams({ id: 'foreign' }))

    expect(res.status).toBe(404)
    // No point pricing a product that isn't ours.
    expect(db.callsFor('select:order_items')).toHaveLength(0)
  })

  /**
   * `products` holds the catalogue entry and nothing about history — a sale
   * only exists as an order_items row.
   */
  it('rolls up units and revenue from the lines the product sold on', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:products', { data: { id: 'p-1', name: 'Roll-up banner' } })
    db.queue('select:order_items', {
      data: [
        { id: 'i-1', quantity: 2, unit_price: 90000, total_amount: 180000 },
        { id: 'i-2', quantity: 3, unit_price: 90000, total_amount: 270000 },
      ],
      count: 2,
    })

    const res = await GET(getRequest('/api/products/p-1'), routeParams({ id: 'p-1' }))
    const { rollup, lines } = await res.json()

    expect(rollup.count).toBe(2)
    expect(rollup.totals).toEqual({ units: 5, revenue: 450000 })
    expect(rollup.exact).toBe(true)
    expect(lines).toHaveLength(2)

    const [items] = db.callsFor('select:order_items')
    expect(items.filters).toContainEqual(['eq', 'product_id', 'p-1'])
  })

  it('marks the rollup inexact when there are more lines than were fetched', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:products', { data: { id: 'p-1' } })
    db.queue('select:order_items', {
      data: [{ id: 'i-1', quantity: 1, total_amount: 100 }],
      count: 4000,
    })

    const { rollup } = await (
      await GET(getRequest('/api/products/p-1'), routeParams({ id: 'p-1' }))
    ).json()

    expect(rollup.count).toBe(4000)
    expect(rollup.exact).toBe(false)
  })

  // The screen shows a handful; the rollup counts them all.
  it('returns at most ten lines regardless of how many it summed', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:products', { data: { id: 'p-1' } })
    db.queue('select:order_items', {
      data: Array.from({ length: 25 }, (_, i) => ({
        id: `i-${i}`,
        quantity: 1,
        total_amount: 10,
      })),
      count: 25,
    })

    const { lines, rollup } = await (
      await GET(getRequest('/api/products/p-1'), routeParams({ id: 'p-1' }))
    ).json()

    expect(lines).toHaveLength(10)
    expect(rollup.totals.revenue).toBe(250)
  })

  it('rolls up to zero for a product never ordered', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:products', { data: { id: 'p-1' } })

    const { rollup, lines } = await (
      await GET(getRequest('/api/products/p-1'), routeParams({ id: 'p-1' }))
    ).json()

    expect(rollup).toEqual({ count: 0, totals: { units: 0, revenue: 0 }, exact: true })
    expect(lines).toEqual([])
  })
})

describe('PATCH /api/products/[id]', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('rejects an empty update with 400', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await PATCH(
      jsonRequest('/api/products/p-1', {}, 'PATCH'),
      routeParams({ id: 'p-1' }),
    )
    expect(res.status).toBe(400)
  })

  // Archiving IS the delete path in v2; nothing is ever hard-deleted.
  it('archives via status', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('update:products', { data: { id: 'p-1', status: 'archived' } })

    const res = await PATCH(
      jsonRequest('/api/products/p-1', { status: 'archived' }, 'PATCH'),
      routeParams({ id: 'p-1' }),
    )

    expect(res.status).toBe(200)
    const [update] = db.callsFor('update:products')
    expect(update.values).toEqual({ status: 'archived' })
  })
})
