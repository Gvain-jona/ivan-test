import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'
import { createFakeTenant } from '@/test/helpers/fake-tenant'
import { jsonRequest, routeParams } from '@/test/helpers/http'
import { resolveTenant } from '@/lib/auth/tenant'

vi.mock('@/lib/auth/tenant', () => ({ resolveTenant: vi.fn() }))
const resolveTenantMock = vi.mocked(resolveTenant)

describe('POST /api/orders/[id]/payments', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('rejects unauthenticated callers with 401', async () => {
    resolveTenantMock.mockResolvedValue(null)
    const res = await POST(jsonRequest('/api/orders/o-1/payments', { amount: 10 }), routeParams({ id: 'o-1' }))
    expect(res.status).toBe(401)
  })

  it('rejects a non-positive amount with 400', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await POST(jsonRequest('/api/orders/o-1/payments', { amount: 0 }), routeParams({ id: 'o-1' }))
    expect(res.status).toBe(400)
  })

  it('refuses to write against an order outside the org (ownership check)', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    // Ownership select finds nothing → 404, and crucially no insert happens.
    const res = await POST(
      jsonRequest('/api/orders/foreign/payments', { amount: 10 }),
      routeParams({ id: 'foreign' }),
    )
    expect(res.status).toBe(404)
    expect(db.callsFor('insert:payments')).toHaveLength(0)
  })

  it('records the payment and returns the recomputed order money fields', async () => {
    const { tenant, db } = createFakeTenant({ userId: 'user-7' })
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:orders', { data: { id: 'o-1' } }) // ownership check
    db.queue('insert:payments', { data: { id: 'p-1', amount: 100 } })
    db.queue('select:orders', {
      data: { id: 'o-1', total_amount: 300, amount_paid: 100, balance: 200, payment_status: 'partial' },
    })

    const res = await POST(
      jsonRequest('/api/orders/o-1/payments', { amount: 100, payment_method: 'mobile_money' }),
      routeParams({ id: 'o-1' }),
    )

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.payment).toEqual({ id: 'p-1', amount: 100 })
    expect(body.order.payment_status).toBe('partial')

    const [insert] = db.callsFor('insert:payments')
    expect(insert.values).toMatchObject({
      entity_type: 'order',
      entity_id: 'o-1',
      amount: 100,
      payment_method: 'mobile_money',
      created_by: 'user-7',
    })
    // organization_id is the accessor's job — the fake throws if a
    // route ever passes one, so reaching here already proves it.
  })
})
