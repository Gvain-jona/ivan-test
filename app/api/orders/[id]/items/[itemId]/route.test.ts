import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DELETE, PATCH } from './route'
import { createFakeTenant } from '@/test/helpers/fake-tenant'
import { getRequest, jsonRequest, routeParams } from '@/test/helpers/http'
import { resolveTenant } from '@/lib/auth/tenant'

vi.mock('@/lib/auth/tenant', () => ({ resolveTenant: vi.fn() }))
const resolveTenantMock = vi.mocked(resolveTenant)

const params = routeParams({ id: 'o-1', itemId: 'i-1' })

describe('PATCH /api/orders/[id]/items/[itemId]', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('rejects unauthenticated callers with 401', async () => {
    resolveTenantMock.mockResolvedValue(null)
    const res = await PATCH(jsonRequest('/api/orders/o-1/items/i-1', { quantity: 3 }, 'PATCH'), params)
    expect(res.status).toBe(401)
  })

  it('rejects an empty update with 400', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await PATCH(jsonRequest('/api/orders/o-1/items/i-1', {}, 'PATCH'), params)
    expect(res.status).toBe(400)
  })

  it('returns 404 when the item is not in the org/order', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await PATCH(
      jsonRequest('/api/orders/o-1/items/i-1', { quantity: 3 }, 'PATCH'),
      params,
    )
    expect(res.status).toBe(404)
    expect(db.callsFor('update:order_items')).toHaveLength(0)
  })

  it('recomputes total_amount from the merged row', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:order_items', {
      data: { id: 'i-1', product_id: null, product_name_raw: 'Banner', quantity: 2, unit_price: 500, discount: 50 },
    })
    db.queue('update:order_items', { data: { id: 'i-1', total_amount: 1450 } })
    db.queue('select:orders', {
      data: { id: 'o-1', total_amount: 1450, amount_paid: 0, balance: 1450, payment_status: 'unpaid' },
    })

    // Only quantity changes; price/discount come from the current row.
    const res = await PATCH(
      jsonRequest('/api/orders/o-1/items/i-1', { quantity: 3 }, 'PATCH'),
      params,
    )

    expect(res.status).toBe(200)
    const [update] = db.callsFor('update:order_items')
    expect(update.values).toMatchObject({ quantity: 3, total_amount: 1450 }) // 3 × 500 − 50
    expect(update.filters).toContainEqual(['eq', 'id', 'i-1'])
    expect(update.filters).toContainEqual(['eq', 'order_id', 'o-1'])
  })

  it('rejects stripping the name from a free-text line', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:order_items', {
      data: { id: 'i-1', product_id: null, product_name_raw: 'Banner', quantity: 1, unit_price: 100, discount: 0 },
    })

    const res = await PATCH(
      jsonRequest('/api/orders/o-1/items/i-1', { product_name_raw: null }, 'PATCH'),
      params,
    )

    expect(res.status).toBe(400)
    expect(db.callsFor('update:order_items')).toHaveLength(0)
  })
})

describe('DELETE /api/orders/[id]/items/[itemId]', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('rejects unauthenticated callers with 401', async () => {
    resolveTenantMock.mockResolvedValue(null)
    const res = await DELETE(getRequest('/api/orders/o-1/items/i-1'), params)
    expect(res.status).toBe(401)
  })

  it('returns 404 when the item is not among the order lines', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:order_items', { data: [{ id: 'other' }, { id: 'another' }] })

    const res = await DELETE(getRequest('/api/orders/o-1/items/i-1'), params)

    expect(res.status).toBe(404)
    expect(db.callsFor('delete:order_items')).toHaveLength(0)
  })

  it('refuses to remove the last line of an order', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:order_items', { data: [{ id: 'i-1' }] })

    const res = await DELETE(getRequest('/api/orders/o-1/items/i-1'), params)

    expect(res.status).toBe(400)
    expect(db.callsFor('delete:order_items')).toHaveLength(0)
  })

  it('removes the line and returns the retotaled order', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:order_items', { data: [{ id: 'i-1' }, { id: 'i-2' }] })
    db.queue('delete:order_items', { data: null })
    db.queue('select:orders', {
      data: { id: 'o-1', total_amount: 500, amount_paid: 0, balance: 500, payment_status: 'unpaid' },
    })

    const res = await DELETE(getRequest('/api/orders/o-1/items/i-1'), params)

    expect(res.status).toBe(200)
    expect((await res.json()).order.total_amount).toBe(500)
    const [del] = db.callsFor('delete:order_items')
    expect(del.filters).toContainEqual(['eq', 'id', 'i-1'])
    expect(del.filters).toContainEqual(['eq', 'order_id', 'o-1'])
  })
})
