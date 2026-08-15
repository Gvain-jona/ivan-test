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
    // Ownership select finds nothing → 404, and crucially no money moves.
    const res = await POST(
      jsonRequest('/api/orders/foreign/payments', { amount: 10 }),
      routeParams({ id: 'foreign' }),
    )
    expect(res.status).toBe(404)
    expect(db.callsFor('rpc:record_payment_as_org')).toHaveLength(0)
  })

  it('records the cash event and its allocation in one RPC, against the order', async () => {
    const { tenant, db } = createFakeTenant({ organizationId: 'org-7', userId: 'user-7' })
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:orders', { data: { id: 'o-1', client_id: 'c-1' } }) // ownership check
    db.queue('select:documents', { data: null }) // no live invoice
    db.queue('rpc:record_payment_as_org', { data: 'p-1' })
    db.queue('select:payments', { data: { id: 'p-1', amount: 100 } })
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

    const [rpc] = db.callsFor('rpc:record_payment_as_org')
    const values = rpc.values as { p_org: string; p_user: string; payload: Record<string, unknown> }
    expect(values.p_org).toBe('org-7')
    expect(values.p_user).toBe('user-7')
    expect(values.payload).toMatchObject({
      direction: 'in',
      // The order's client is the payment's party — the allocation trigger
      // rejects a client payment settling another client's order.
      party_type: 'client',
      party_id: 'c-1',
      amount: 100,
      payment_method: 'mobile_money',
      allocations: [{ target_type: 'order', target_id: 'o-1', amount: 100 }],
    })

    // Recording the payment emits a payment.recorded activity, targeting the order.
    const [notif] = db.callsFor('insert:notifications')
    expect(notif.values).toMatchObject({
      verb: 'payment.recorded',
      category: 'payments',
      audience_scope: 'org',
      object_type: 'payment',
      object_id: 'p-1',
      target_type: 'order',
      target_id: 'o-1',
    })
  })

  // SINGLE RECEIVABLE: validate_payment_allocation() refuses an allocation
  // aimed at an order that already has a live invoice.
  it('allocates to the live invoice instead of the order when one exists', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:orders', { data: { id: 'o-1', client_id: 'c-1' } })
    db.queue('select:documents', { data: { id: 'doc-9' } })
    db.queue('rpc:record_payment_as_org', { data: 'p-2' })
    db.queue('select:payments', { data: { id: 'p-2', amount: 50 } })
    db.queue('select:orders', { data: { id: 'o-1', payment_status: 'partial' } })

    const res = await POST(
      jsonRequest('/api/orders/o-1/payments', { amount: 50 }),
      routeParams({ id: 'o-1' }),
    )

    expect(res.status).toBe(201)
    const [rpc] = db.callsFor('rpc:record_payment_as_org')
    const { payload } = rpc.values as { payload: { allocations: unknown[] } }
    expect(payload.allocations).toEqual([
      { target_type: 'document', target_id: 'doc-9', amount: 50 },
    ])
  })

  it('carries a reference through to the cash event, defaulting it to null', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:orders', { data: { id: 'o-1', client_id: 'c-1' } })
    db.queue('select:documents', { data: null })
    db.queue('rpc:record_payment_as_org', { data: 'p-4' })
    db.queue('select:payments', { data: { id: 'p-4' } })
    db.queue('select:orders', { data: { id: 'o-1' } })

    await POST(
      jsonRequest('/api/orders/o-1/payments', {
        amount: 75,
        payment_method: 'mobile_money',
        reference: 'MTN-8842190',
        notes: 'Deposit',
      }),
      routeParams({ id: 'o-1' }),
    )

    const [rpc] = db.callsFor('rpc:record_payment_as_org')
    const { payload } = rpc.values as { payload: Record<string, unknown> }
    // How a real payment is traced back to the bank — distinct from notes,
    // which is free commentary.
    expect(payload.reference).toBe('MTN-8842190')
    expect(payload.notes).toBe('Deposit')

    // Omitted → explicit null, not undefined: the payload is jsonb, and a
    // missing key and a null key are not the same thing to plpgsql.
    db.queue('select:orders', { data: { id: 'o-2', client_id: 'c-1' } })
    db.queue('select:documents', { data: null })
    db.queue('rpc:record_payment_as_org', { data: 'p-5' })
    db.queue('select:payments', { data: { id: 'p-5' } })
    db.queue('select:orders', { data: { id: 'o-2' } })

    await POST(jsonRequest('/api/orders/o-2/payments', { amount: 10 }), routeParams({ id: 'o-2' }))

    const bare = db.callsFor('rpc:record_payment_as_org')[1]
    expect((bare.values as { payload: Record<string, unknown> }).payload.reference).toBeNull()
  })

  it('leaves party unset for a walk-in order with no client', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:orders', { data: { id: 'o-1', client_id: null } })
    db.queue('select:documents', { data: null })
    db.queue('rpc:record_payment_as_org', { data: 'p-3' })
    db.queue('select:payments', { data: { id: 'p-3', amount: 20 } })
    db.queue('select:orders', { data: { id: 'o-1' } })

    const res = await POST(
      jsonRequest('/api/orders/o-1/payments', { amount: 20 }),
      routeParams({ id: 'o-1' }),
    )

    expect(res.status).toBe(201)
    const [rpc] = db.callsFor('rpc:record_payment_as_org')
    const { payload } = rpc.values as { payload: Record<string, unknown> }
    // party_type and party_id must be null together — a check constraint
    // rejects one without the other.
    expect(payload.party_type).toBeNull()
    expect(payload.party_id).toBeNull()
  })
})
