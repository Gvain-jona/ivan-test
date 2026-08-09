import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from './route'
import { createFakeTenant } from '@/test/helpers/fake-tenant'
import { getRequest, jsonRequest } from '@/test/helpers/http'
import { resolveTenant } from '@/lib/auth/tenant'

vi.mock('@/lib/auth/tenant', () => ({ resolveTenant: vi.fn() }))
const resolveTenantMock = vi.mocked(resolveTenant)

const CLIENT_UUID = '11111111-1111-4111-8111-111111111111'

describe('GET /api/orders', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('rejects unauthenticated callers with 401', async () => {
    resolveTenantMock.mockResolvedValue(null)
    const res = await GET(getRequest('/api/orders'))
    expect(res.status).toBe(401)
  })

  it('lists orders with pagination and returns { orders, total }', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:orders', { data: [{ id: 'o-1' }], count: 7 })

    const res = await GET(getRequest('/api/orders', { limit: '10', offset: '20' }))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ orders: [{ id: 'o-1' }], total: 7 })
    const [call] = db.callsFor('select:orders')
    expect(call.modifiers).toContainEqual(['range', 20, 29])
  })

  it('maps status/payment_status/search/date filters onto the query', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)

    await GET(
      getRequest('/api/orders', {
        status: 'pending,ready',
        payment_status: 'partial',
        search: 'INV-01',
        start_date: '2026-07-01',
        end_date: '2026-07-31',
        client_id: CLIENT_UUID,
      }),
    )

    const [call] = db.callsFor('select:orders')
    expect(call.filters).toContainEqual(['in', 'status', ['pending', 'ready']])
    expect(call.filters).toContainEqual(['in', 'payment_status', ['partial']])
    expect(call.filters).toContainEqual(['ilike', 'order_number', '%INV-01%'])
    expect(call.filters).toContainEqual(['gte', 'order_date', '2026-07-01'])
    expect(call.filters).toContainEqual(['lte', 'order_date', '2026-07-31'])
    expect(call.filters).toContainEqual(['eq', 'client_id', CLIENT_UUID])
  })
})

describe('POST /api/orders', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('rejects unauthenticated callers with 401', async () => {
    resolveTenantMock.mockResolvedValue(null)
    const res = await POST(jsonRequest('/api/orders', {}))
    expect(res.status).toBe(401)
  })

  it('rejects a payload without items with 400', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await POST(jsonRequest('/api/orders', { client_id: CLIENT_UUID, items: [] }))
    expect(res.status).toBe(400)
  })

  it('creates atomically via create_order_as_org with the tenant org and user', async () => {
    const { tenant, db } = createFakeTenant({ organizationId: 'org-9', userId: 'user-9' })
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('rpc:create_order_as_org', { data: 'new-order-id' })
    db.queue('select:orders', { data: { id: 'new-order-id', status: 'pending' } })

    const res = await POST(
      jsonRequest('/api/orders', {
        client_id: CLIENT_UUID,
        items: [{ product_name_raw: 'Business cards', quantity: 100, unit_price: 1.5 }],
      }),
    )

    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ order: { id: 'new-order-id', status: 'pending' } })

    const [rpc] = db.callsFor('rpc:create_order_as_org')
    expect(rpc.values).toMatchObject({ p_org: 'org-9', p_user: 'user-9' })

    // Refetch is by the id the RPC returned.
    const [refetch] = db.callsFor('select:orders')
    expect(refetch.filters).toContainEqual(['eq', 'id', 'new-order-id'])
    expect(refetch.single).toBe('single')
  })

  // Verified against the live v2.create_order source, not the handoff doc:
  // the payment insert reads `reference`, so it must pass through.
  it('passes an inline payment through, reference included', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('rpc:create_order_as_org', { data: 'o-2' })
    db.queue('select:orders', { data: { id: 'o-2' } })

    const res = await POST(
      jsonRequest('/api/orders', {
        client_id: CLIENT_UUID,
        items: [{ product_name_raw: 'Flyers', quantity: 500, unit_price: 100 }],
        payments: [
          {
            amount: 20000,
            payment_method: 'cash',
            payment_date: '2026-08-07',
            reference: 'MTN-8842190',
          },
        ],
      }),
    )

    expect(res.status).toBe(201)
    const [rpc] = db.callsFor('rpc:create_order_as_org')
    const { payload } = rpc.values as { payload: { payments: unknown[] } }
    expect(payload.payments).toEqual([
      {
        amount: 20000,
        payment_method: 'cash',
        payment_date: '2026-08-07',
        reference: 'MTN-8842190',
      },
    ])
  })

  /**
   * A note used to vanish on this path — create_order's payment insert named
   * no notes column — so the schema refused it outright rather than let it be
   * lost silently. A4 (20260809180000) added the column to the insert;
   * verified against the live function on 2026-08-09.
   */
  it('passes an inline payment note through', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('rpc:create_order_as_org', { data: 'o-4' })
    db.queue('select:orders', { data: { id: 'o-4' } })

    const res = await POST(
      jsonRequest('/api/orders', {
        client_id: CLIENT_UUID,
        items: [{ product_name_raw: 'Flyers', quantity: 500, unit_price: 100 }],
        payments: [{ amount: 20000, notes: 'Deposit', reference: 'MTN-8842190' }],
      }),
    )

    expect(res.status).toBe(201)
    const [rpc] = db.callsFor('rpc:create_order_as_org')
    const { payload } = rpc.values as { payload: { payments: unknown[] } }
    expect(payload.payments).toEqual([
      { amount: 20000, notes: 'Deposit', reference: 'MTN-8842190' },
    ])
  })

  // Still strict: this path takes exactly what create_order reads, and a key
  // it doesn't read is a key that would be silently lost.
  it('rejects an unknown key on an inline payment with 400', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)

    const res = await POST(
      jsonRequest('/api/orders', {
        client_id: CLIENT_UUID,
        items: [{ product_name_raw: 'Flyers', quantity: 500, unit_price: 100 }],
        payments: [{ amount: 20000, cheque_book: 'B-12' }],
      }),
    )

    expect(res.status).toBe(400)
    expect(db.callsFor('rpc:create_order_as_org')).toHaveLength(0)
  })

  /**
   * create_order() reads discount_type/discount_value off the payload and
   * inserts them on the order; the items trigger then derives total_amount net
   * of them. Verified against the live function source on 2026-08-09.
   */
  it('passes an order-level discount through to create_order', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('rpc:create_order_as_org', { data: 'o-3' })
    db.queue('select:orders', { data: { id: 'o-3' } })

    const res = await POST(
      jsonRequest('/api/orders', {
        client_id: CLIENT_UUID,
        discount_type: 'percent',
        discount_value: 10,
        items: [{ product_name_raw: 'Banners', quantity: 2, unit_price: 45000 }],
      }),
    )

    expect(res.status).toBe(201)
    const [rpc] = db.callsFor('rpc:create_order_as_org')
    const { payload } = rpc.values as {
      payload: { discount_type: string; discount_value: number }
    }
    expect(payload.discount_type).toBe('percent')
    expect(payload.discount_value).toBe(10)
  })

  // Mirrors the orders_discount_percent_range CHECK, so the user sees a field
  // error rather than a constraint name.
  it('rejects a percentage discount over 100 with 400', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)

    const res = await POST(
      jsonRequest('/api/orders', {
        client_id: CLIENT_UUID,
        discount_type: 'percent',
        discount_value: 150,
        items: [{ product_name_raw: 'Banners', quantity: 2, unit_price: 45000 }],
      }),
    )

    expect(res.status).toBe(400)
    expect(db.callsFor('rpc:create_order_as_org')).toHaveLength(0)
  })
})
