import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'
import { createFakeTenant } from '@/test/helpers/fake-tenant'
import { jsonRequest, routeParams } from '@/test/helpers/http'
import { resolveTenant } from '@/lib/auth/tenant'

vi.mock('@/lib/auth/tenant', () => ({ resolveTenant: vi.fn() }))
const resolveTenantMock = vi.mocked(resolveTenant)

describe('POST /api/orders/[id]/items', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('rejects unauthenticated callers with 401', async () => {
    resolveTenantMock.mockResolvedValue(null)
    const res = await POST(
      jsonRequest('/api/orders/o-1/items', { quantity: 1, unit_price: 100 }),
      routeParams({ id: 'o-1' }),
    )
    expect(res.status).toBe(401)
  })

  it('rejects an item with neither product_id nor product_name_raw', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await POST(
      jsonRequest('/api/orders/o-1/items', { quantity: 1, unit_price: 100 }),
      routeParams({ id: 'o-1' }),
    )
    expect(res.status).toBe(400)
  })

  it('returns 404 for an order outside the org, before any insert', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    // No queued order → maybeSingle resolves null
    const res = await POST(
      jsonRequest('/api/orders/foreign/items', {
        product_name_raw: 'Banner',
        quantity: 1,
        unit_price: 100,
      }),
      routeParams({ id: 'foreign' }),
    )
    expect(res.status).toBe(404)
    expect(db.callsFor('insert:order_items')).toHaveLength(0)
  })

  it('adds a line, computes total_amount, and returns the retotaled order', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:orders', { data: { id: 'o-1' } })
    db.queue('insert:order_items', {
      data: { id: 'i-2', order_id: 'o-1', total_amount: 950 },
    })
    db.queue('select:orders', {
      data: { id: 'o-1', total_amount: 1950, amount_paid: 0, balance: 1950, payment_status: 'unpaid' },
    })

    const res = await POST(
      jsonRequest('/api/orders/o-1/items', {
        product_name_raw: 'Vinyl banner',
        quantity: 2,
        unit_price: 500,
        discount: 50,
      }),
      routeParams({ id: 'o-1' }),
    )

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.item.id).toBe('i-2')
    expect(body.order.total_amount).toBe(1950)

    const [insert] = db.callsFor('insert:order_items')
    expect(insert.values).toMatchObject({
      order_id: 'o-1',
      product_name_raw: 'Vinyl banner',
      quantity: 2,
      unit_price: 500,
      discount: 50,
      total_amount: 950, // 2 × 500 − 50, computed server-side
    })
  })
})
