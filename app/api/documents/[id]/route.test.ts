import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, PATCH } from './route'
import { createFakeTenant } from '@/test/helpers/fake-tenant'
import { getRequest, jsonRequest, routeParams } from '@/test/helpers/http'
import { resolveTenant } from '@/lib/auth/tenant'

vi.mock('@/lib/auth/tenant', () => ({ resolveTenant: vi.fn() }))
const resolveTenantMock = vi.mocked(resolveTenant)

describe('GET /api/documents/[id]', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('rejects unauthenticated callers with 401', async () => {
    resolveTenantMock.mockResolvedValue(null)
    const res = await GET(getRequest('/api/documents/d-1'), routeParams({ id: 'd-1' }))
    expect(res.status).toBe(401)
  })

  it('404s for an id outside the org (the scoped lookup finds nothing)', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)

    const res = await GET(getRequest('/api/documents/foreign'), routeParams({ id: 'foreign' }))

    expect(res.status).toBe(404)
    // No point pricing a document that isn't ours.
    expect(db.callsFor('select:payment_allocations')).toHaveLength(0)
  })

  /**
   * A document's balance cannot come from its snapshot — that is frozen at
   * issue time, before any money arrives — so it is summed from allocations.
   */
  it('attaches amount_paid summed from the allocations against it', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:documents', { data: { id: 'd-1', total: 432000 } })
    db.queue('select:payment_allocations', {
      data: [{ amount: 200000 }, { amount: 100000 }],
    })

    const res = await GET(getRequest('/api/documents/d-1'), routeParams({ id: 'd-1' }))

    expect(res.status).toBe(200)
    const { document } = await res.json()
    expect(document.amount_paid).toBe(300000)

    const [allocations] = db.callsFor('select:payment_allocations')
    expect(allocations.filters).toContainEqual(['eq', 'target_type', 'document'])
    expect(allocations.filters).toContainEqual(['eq', 'target_id', 'd-1'])
  })

  it('reports nothing allocated as 0, not undefined', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:documents', { data: { id: 'd-1', total: 432000 } })

    const res = await GET(getRequest('/api/documents/d-1'), routeParams({ id: 'd-1' }))

    // The renderer subtracts this; undefined would produce NaN on the paper.
    expect((await res.json()).document.amount_paid).toBe(0)
  })
})

describe('PATCH /api/documents/[id]', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('rejects an empty patch with 400', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await PATCH(
      jsonRequest('/api/documents/d-1', {}, 'PATCH'),
      routeParams({ id: 'd-1' }),
    )
    expect(res.status).toBe(400)
  })

  it('rejects an unknown status with 400', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await PATCH(
      jsonRequest('/api/documents/d-1', { status: 'posted' }, 'PATCH'),
      routeParams({ id: 'd-1' }),
    )
    expect(res.status).toBe(400)
  })

  // Same response shape as GET on purpose: a PATCH that dropped amount_paid
  // would wipe it from whatever cache the response is written into.
  it('returns the updated document with amount_paid attached', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('update:documents', { data: { id: 'd-1', status: 'sent' } })
    db.queue('select:payment_allocations', { data: [{ amount: 50 }] })

    const res = await PATCH(
      jsonRequest('/api/documents/d-1', { status: 'sent' }, 'PATCH'),
      routeParams({ id: 'd-1' }),
    )

    expect(res.status).toBe(200)
    const { document } = await res.json()
    expect(document.status).toBe('sent')
    expect(document.amount_paid).toBe(50)
  })
})
