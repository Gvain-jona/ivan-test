import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DELETE, PATCH } from './route'
import { createFakeTenant } from '@/test/helpers/fake-tenant'
import { jsonRequest, routeParams } from '@/test/helpers/http'
import { resolveTenant } from '@/lib/auth/tenant'

vi.mock('@/lib/auth/tenant', () => ({ resolveTenant: vi.fn() }))
const resolveTenantMock = vi.mocked(resolveTenant)

const params = routeParams({ id: 'o-1', itemId: 'i-1' })
const url = '/api/orders/o-1/items/i-1'

describe('PATCH /api/orders/[id]/items/[itemId]', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('rejects unauthenticated callers with 401', async () => {
    resolveTenantMock.mockResolvedValue(null)
    expect((await PATCH(jsonRequest(url, { quantity: 3 }), params)).status).toBe(401)
  })

  it('rejects an empty patch', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    expect((await PATCH(jsonRequest(url, {}), params)).status).toBe(400)
  })

  it('refuses to touch a line on an order outside the org', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await PATCH(jsonRequest(url, { quantity: 3 }), params)
    expect(res.status).toBe(404)
    expect(db.callsFor('update:order_items')).toHaveLength(0)
  })

  it('pins the update to both the line and its order', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:orders', { data: { id: 'o-1' } })
    db.queue('update:order_items', { data: { id: 'i-1', quantity: 3 } })
    db.queue('select:orders', { data: { id: 'o-1', total_amount: 270000 } })

    const res = await PATCH(jsonRequest(url, { quantity: 3 }), params)

    expect(res.status).toBe(200)
    const [update] = db.callsFor('update:order_items')
    // order_id as well as id: without it a line could be edited through
    // another order's URL, recomputing a total the caller never named.
    expect(update.filters).toContainEqual(['eq', 'id', 'i-1'])
    expect(update.filters).toContainEqual(['eq', 'order_id', 'o-1'])
  })

  it('404s when the line is not on this order', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:orders', { data: { id: 'o-1' } })
    db.queue('update:order_items', { data: null })

    expect((await PATCH(jsonRequest(url, { quantity: 3 }), params)).status).toBe(404)
  })

  it('returns the order money the trigger recomputed', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:orders', { data: { id: 'o-1' } })
    db.queue('update:order_items', { data: { id: 'i-1' } })
    db.queue('select:orders', { data: { id: 'o-1', total_amount: 270000, balance: 270000 } })

    const body = await (await PATCH(jsonRequest(url, { unit_price: 90000 }), params)).json()
    expect(body.order).toMatchObject({ total_amount: 270000, balance: 270000 })
  })
})

describe('DELETE /api/orders/[id]/items/[itemId]', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('rejects unauthenticated callers with 401', async () => {
    resolveTenantMock.mockResolvedValue(null)
    expect((await DELETE(jsonRequest(url, {}), params)).status).toBe(401)
  })

  it('refuses to delete from an order outside the org', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await DELETE(jsonRequest(url, {}), params)
    expect(res.status).toBe(404)
    expect(db.callsFor('delete:order_items')).toHaveLength(0)
  })

  it('removes the line, pinned to its order, and returns the new totals', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:orders', { data: { id: 'o-1' } })
    db.queue('delete:order_items', { data: { id: 'i-1' } })
    db.queue('select:orders', { data: { id: 'o-1', total_amount: 0, balance: 0 } })

    const res = await DELETE(jsonRequest(url, {}), params)

    expect(res.status).toBe(200)
    const [del] = db.callsFor('delete:order_items')
    expect(del.filters).toContainEqual(['eq', 'id', 'i-1'])
    expect(del.filters).toContainEqual(['eq', 'order_id', 'o-1'])
    expect((await res.json()).order).toMatchObject({ total_amount: 0 })
  })

  it('404s when the line is already gone rather than reporting success', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:orders', { data: { id: 'o-1' } })
    // PostgREST does not treat a delete matching no rows as an error, so the
    // route's .select() is what turns "nothing happened" into a 404.
    db.queue('delete:order_items', { data: null })

    expect((await DELETE(jsonRequest(url, {}), params)).status).toBe(404)
  })
})
