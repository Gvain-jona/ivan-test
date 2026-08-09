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

  it('returns the order plus the payments settling it, at their ALLOCATED amounts', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:orders', { data: { id: 'o-1', order_number: 'ORD-1' } })
    db.queue('select:documents', { data: [] })
    db.queue('select:payment_allocations', {
      data: [
        {
          // A 500 payment split across two orders; 300 of it settles this one.
          amount: 300,
          payments: {
            id: 'p-1',
            payment_date: '2026-08-01',
            payment_method: 'cash',
            reference: 'MTN-8842190',
            notes: 'Deposit',
            created_at: '2026-08-01T09:00:00Z',
          },
        },
      ],
    })

    const res = await GET(getRequest('/api/orders/o-1'), routeParams({ id: 'o-1' }))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      order: { id: 'o-1', order_number: 'ORD-1' },
      payments: [
        {
          id: 'p-1',
          amount: 300,
          payment_date: '2026-08-01',
          payment_method: 'cash',
          reference: 'MTN-8842190',
          notes: 'Deposit',
          created_at: '2026-08-01T09:00:00Z',
        },
      ],
    })
  })

  it('collects allocations against the order AND its documents (SINGLE RECEIVABLE)', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:orders', { data: { id: 'o-1' } })
    db.queue('select:documents', { data: [{ id: 'doc-1' }, { id: 'doc-2' }] })

    const res = await GET(getRequest('/api/orders/o-1'), routeParams({ id: 'o-1' }))
    expect(res.status).toBe(200)

    const [documents] = db.callsFor('select:documents')
    expect(documents.filters).toContainEqual(['eq', 'entity_type', 'order'])
    expect(documents.filters).toContainEqual(['eq', 'entity_id', 'o-1'])

    // Once an invoice is live, allocations point at the document, not the
    // order — reading only the order would report "paid nothing".
    const [allocations] = db.callsFor('select:payment_allocations')
    expect(allocations.filters).toContainEqual(['in', 'target_type', ['order', 'document']])
    expect(allocations.filters).toContainEqual(['in', 'target_id', ['o-1', 'doc-1', 'doc-2']])
  })

  it('never queries payments by entity_type/entity_id (dropped 2026-07-29)', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:orders', { data: { id: 'o-1' } })

    await GET(getRequest('/api/orders/o-1'), routeParams({ id: 'o-1' }))

    // The columns no longer exist; selecting on them is a 42703 at runtime.
    // This route shipped broken because the previous test asserted the
    // broken filter — assert the table is not reached directly at all.
    expect(db.callsFor('select:payments')).toHaveLength(0)
  })

  it('drops allocations whose payment embed is missing rather than emitting a null row', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:orders', { data: { id: 'o-1' } })
    db.queue('select:documents', { data: [] })
    db.queue('select:payment_allocations', { data: [{ amount: 300, payments: null }] })

    const res = await GET(getRequest('/api/orders/o-1'), routeParams({ id: 'o-1' }))

    expect(res.status).toBe(200)
    expect((await res.json()).payments).toEqual([])
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

  /**
   * The discount is the one money-affecting field this route accepts. It is
   * safe to write because it is an *input*: the trigger derives total_amount
   * from it, so the route never states a total.
   */
  it('writes the discount and scopes the update to the org', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('update:orders', {
      data: { id: 'o-1', discount_type: 'percent', discount_value: 10, total_amount: 81000 },
    })

    const res = await PATCH(
      jsonRequest('/api/orders/o-1', { discount_type: 'percent', discount_value: 10 }, 'PATCH'),
      routeParams({ id: 'o-1' }),
    )

    expect(res.status).toBe(200)
    const [update] = db.callsFor('update:orders')
    expect(update.values).toEqual({ discount_type: 'percent', discount_value: 10 })
    // tenant.db is service-role — id alone would reach another org's order,
    // and this is a money write.
    expect(update.filters).toContainEqual(['eq', 'organization_id', tenant.organizationId])
  })

  // null is how a discount is removed; omitting the key leaves it in place.
  it('accepts a null discount_type as the clear', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('update:orders', { data: { id: 'o-1', discount_type: null } })

    const res = await PATCH(
      jsonRequest('/api/orders/o-1', { discount_type: null, discount_value: 0 }, 'PATCH'),
      routeParams({ id: 'o-1' }),
    )

    expect(res.status).toBe(200)
    const [update] = db.callsFor('update:orders')
    expect(update.values).toEqual({ discount_type: null, discount_value: 0 })
  })

  /**
   * Also a DB CHECK (orders_discount_percent_range). Rejecting it here is what
   * turns it into a field error instead of a 400 naming a constraint.
   */
  it('rejects a percentage over 100 before it reaches the DB', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)

    const res = await PATCH(
      jsonRequest('/api/orders/o-1', { discount_type: 'percent', discount_value: 150 }, 'PATCH'),
      routeParams({ id: 'o-1' }),
    )

    expect(res.status).toBe(400)
    expect(db.callsFor('update:orders')).toHaveLength(0)
  })

  // 150 is a legitimate fixed amount; only percentages are capped.
  it('allows a fixed amount above 100', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('update:orders', { data: { id: 'o-1' } })

    const res = await PATCH(
      jsonRequest('/api/orders/o-1', { discount_type: 'amount', discount_value: 150 }, 'PATCH'),
      routeParams({ id: 'o-1' }),
    )

    expect(res.status).toBe(200)
  })

  it('rejects a negative discount', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await PATCH(
      jsonRequest('/api/orders/o-1', { discount_type: 'amount', discount_value: -1 }, 'PATCH'),
      routeParams({ id: 'o-1' }),
    )
    expect(res.status).toBe(400)
  })
})
