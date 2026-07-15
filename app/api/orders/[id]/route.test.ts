import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, PATCH } from './route'
import { createFakeTenant } from '@/test/helpers/fake-tenant'
import { getRequest, jsonRequest, routeParams } from '@/test/helpers/http'
import { resolveTenant } from '@/lib/auth/tenant'

vi.mock('@/lib/auth/tenant', () => ({ resolveTenant: vi.fn() }))
const resolveTenantMock = vi.mocked(resolveTenant)

describe('GET /api/orders/[id]', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('rejects unauthenticated callers with 401', async () => {
    resolveTenantMock.mockResolvedValue(null)
    const res = await GET(getRequest('/api/orders/o-1'), routeParams({ id: 'o-1' }))
    expect(res.status).toBe(401)
  })

  it('returns 404 for an id outside the org (scoped lookup finds nothing)', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    // No queued result → maybeSingle default is data: null
    const res = await GET(getRequest('/api/orders/foreign'), routeParams({ id: 'foreign' }))
    expect(res.status).toBe(404)
  })

  it('returns the order plus its payments as a sibling key', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:orders', { data: { id: 'o-1', order_number: 'ORD-1' } })
    db.queue('select:payments', { data: [{ id: 'p-1', amount: 50 }] })

    const res = await GET(getRequest('/api/orders/o-1'), routeParams({ id: 'o-1' }))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      order: { id: 'o-1', order_number: 'ORD-1' },
      payments: [{ id: 'p-1', amount: 50 }],
    })
    const [payments] = db.callsFor('select:payments')
    expect(payments.filters).toContainEqual(['eq', 'entity_type', 'order'])
    expect(payments.filters).toContainEqual(['eq', 'entity_id', 'o-1'])
  })
})

describe('PATCH /api/orders/[id]', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('rejects an empty update with 400', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await PATCH(jsonRequest('/api/orders/o-1', {}, 'PATCH'), routeParams({ id: 'o-1' }))
    expect(res.status).toBe(400)
  })

  it('rejects money fields with 400 (generated/trigger-maintained columns)', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await PATCH(
      jsonRequest('/api/orders/o-1', { total_amount: 999 }, 'PATCH'),
      routeParams({ id: 'o-1' }),
    )
    expect(res.status).toBe(400)
  })

  it('rejects a staff cancel with 403 before touching the db (owner/admin gate)', async () => {
    const { tenant, db } = createFakeTenant({ orgRole: 'staff' })
    resolveTenantMock.mockResolvedValue(tenant)

    const res = await PATCH(
      jsonRequest('/api/orders/o-1', { status: 'cancelled' }, 'PATCH'),
      routeParams({ id: 'o-1' }),
    )

    expect(res.status).toBe(403)
    expect(db.callsFor('update:orders')).toHaveLength(0)
  })

  it('lets staff make workflow status changes (only cancel is gated)', async () => {
    const { tenant, db } = createFakeTenant({ orgRole: 'staff' })
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('update:orders', { data: { id: 'o-1', status: 'in_progress' } })

    const res = await PATCH(
      jsonRequest('/api/orders/o-1', { status: 'in_progress' }, 'PATCH'),
      routeParams({ id: 'o-1' }),
    )

    expect(res.status).toBe(200)
    expect(db.callsFor('update:orders')[0].values).toEqual({ status: 'in_progress' })
  })

  it('lets an admin cancel', async () => {
    const { tenant, db } = createFakeTenant({ orgRole: 'admin' })
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('update:orders', { data: { id: 'o-1', status: 'cancelled' } })

    const res = await PATCH(
      jsonRequest('/api/orders/o-1', { status: 'cancelled' }, 'PATCH'),
      routeParams({ id: 'o-1' }),
    )

    expect(res.status).toBe(200)
    expect(db.callsFor('update:orders')[0].values).toEqual({ status: 'cancelled' })
  })

  it('updates status and returns the fresh row, 404 when out of org', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('update:orders', { data: { id: 'o-1', status: 'completed' } })

    const ok = await PATCH(
      jsonRequest('/api/orders/o-1', { status: 'completed' }, 'PATCH'),
      routeParams({ id: 'o-1' }),
    )
    expect(ok.status).toBe(200)
    expect(await ok.json()).toEqual({ order: { id: 'o-1', status: 'completed' } })
    const [update] = db.callsFor('update:orders')
    expect(update.values).toEqual({ status: 'completed' })
    expect(update.filters).toContainEqual(['eq', 'id', 'o-1'])

    // Same call against an id the scoped update can't reach → 404
    const missing = await PATCH(
      jsonRequest('/api/orders/foreign', { status: 'completed' }, 'PATCH'),
      routeParams({ id: 'foreign' }),
    )
    expect(missing.status).toBe(404)
  })
})
