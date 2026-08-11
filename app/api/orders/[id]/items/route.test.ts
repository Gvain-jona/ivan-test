import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'
import { createFakeTenant } from '@/test/helpers/fake-tenant'
import { jsonRequest, routeParams } from '@/test/helpers/http'
import { resolveTenant } from '@/lib/auth/tenant'

vi.mock('@/lib/auth/tenant', () => ({ resolveTenant: vi.fn() }))
const resolveTenantMock = vi.mocked(resolveTenant)

const LINE = { product_id: '11111111-1111-1111-1111-111111111111', quantity: 2, unit_price: 90000 }

describe('POST /api/orders/[id]/items', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('rejects unauthenticated callers with 401', async () => {
    resolveTenantMock.mockResolvedValue(null)
    const res = await POST(jsonRequest('/api/orders/o-1/items', LINE), routeParams({ id: 'o-1' }))
    expect(res.status).toBe(401)
  })

  it('rejects a line with neither a product nor a name', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await POST(
      jsonRequest('/api/orders/o-1/items', { quantity: 1, unit_price: 10 }),
      routeParams({ id: 'o-1' }),
    )
    expect(res.status).toBe(400)
  })

  it('rejects a non-positive quantity', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await POST(
      jsonRequest('/api/orders/o-1/items', { ...LINE, quantity: 0 }),
      routeParams({ id: 'o-1' }),
    )
    expect(res.status).toBe(400)
  })

  it('refuses to write a line against an order outside the org', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    // Ownership select finds nothing → 404, and crucially no line is written:
    // the insert's trigger would recompute another org's order total.
    const res = await POST(
      jsonRequest('/api/orders/foreign/items', LINE),
      routeParams({ id: 'foreign' }),
    )
    expect(res.status).toBe(404)
    expect(db.callsFor('insert:order_items')).toHaveLength(0)
  })

  it('scopes the ownership check by organization, not by id alone', async () => {
    const { tenant, db } = createFakeTenant({ organizationId: 'org-7' })
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:orders', { data: { id: 'o-1' } })
    db.queue('insert:order_items', { data: { id: 'i-1' } })
    db.queue('select:orders', { data: { id: 'o-1', total_amount: 180000 } })

    await POST(jsonRequest('/api/orders/o-1/items', LINE), routeParams({ id: 'o-1' }))

    const [ownership] = db.callsFor('select:orders')
    expect(ownership.filters).toContainEqual(['eq', 'id', 'o-1'])
    expect(ownership.filters).toContainEqual(['eq', 'organization_id', 'org-7'])
  })

  it('writes the line against the order and returns the recomputed totals', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:orders', { data: { id: 'o-1' } })
    db.queue('insert:order_items', { data: { id: 'i-1', total_amount: 180000 } })
    db.queue('select:orders', {
      data: { id: 'o-1', total_amount: 180000, amount_paid: 0, balance: 180000, payment_status: 'unpaid' },
    })

    const res = await POST(jsonRequest('/api/orders/o-1/items', LINE), routeParams({ id: 'o-1' }))

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.item).toEqual({ id: 'i-1', total_amount: 180000 })

    const [insert] = db.callsFor('insert:order_items')
    // order_id comes from the URL, never the body — a caller must not be able
    // to file a line against a different order than the one it addressed.
    expect(insert.values).toMatchObject({ ...LINE, order_id: 'o-1' })

    // The totals come from a re-read, not from arithmetic here:
    // trg_items_totals has already run and the DB is the authority.
    expect(body.order).toMatchObject({ total_amount: 180000, balance: 180000 })
  })

  it('never sends total_amount — the trigger owns it', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:orders', { data: { id: 'o-1' } })
    db.queue('insert:order_items', { data: { id: 'i-2' } })
    db.queue('select:orders', { data: { id: 'o-1' } })

    await POST(
      jsonRequest('/api/orders/o-1/items', { ...LINE, total_amount: 999 }),
      routeParams({ id: 'o-1' }),
    )

    const [insert] = db.callsFor('insert:order_items')
    expect(insert.values).not.toHaveProperty('total_amount')
  })

  it('accepts a one-off line with no product', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:orders', { data: { id: 'o-1' } })
    db.queue('insert:order_items', { data: { id: 'i-3' } })
    db.queue('select:orders', { data: { id: 'o-1' } })

    const res = await POST(
      jsonRequest('/api/orders/o-1/items', {
        product_name_raw: 'Vinyl sticker',
        quantity: 1,
        unit_price: 35000,
      }),
      routeParams({ id: 'o-1' }),
    )

    expect(res.status).toBe(201)
    const [insert] = db.callsFor('insert:order_items')
    expect(insert.values).toMatchObject({ product_name_raw: 'Vinyl sticker' })
  })
})
