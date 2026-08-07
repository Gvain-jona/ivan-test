import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from './route'
import { createFakeTenant } from '@/test/helpers/fake-tenant'
import { getRequest, jsonRequest } from '@/test/helpers/http'
import { resolveTenant } from '@/lib/auth/tenant'

vi.mock('@/lib/auth/tenant', () => ({ resolveTenant: vi.fn() }))
const resolveTenantMock = vi.mocked(resolveTenant)

const ORDER_UUID = '33333333-3333-4333-8333-333333333333'

describe('/api/documents', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('GET lists the whole org when no entity is named', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:documents', { data: [{ id: 'd-1' }], count: 12 })

    const res = await GET(getRequest('/api/documents'))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ documents: [{ id: 'd-1' }], total: 12 })
    // No entity filter narrowed it — that's the whole point of this shape.
    const [call] = db.callsFor('select:documents')
    expect(call.filters).not.toContainEqual(['eq', 'entity_type', 'order'])
  })

  it('GET still serves one record when the entity pair is given', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:documents', { data: [{ id: 'd-1' }], count: 1 })

    const res = await GET(
      getRequest('/api/documents', { entity_type: 'order', entity_id: ORDER_UUID }),
    )

    expect(res.status).toBe(200)
    const [call] = db.callsFor('select:documents')
    expect(call.filters).toContainEqual(['eq', 'entity_type', 'order'])
    expect(call.filters).toContainEqual(['eq', 'entity_id', ORDER_UUID])
  })

  // Half a pair is ambiguous, not narrower.
  it('GET rejects one half of the entity pair with 400', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    expect((await GET(getRequest('/api/documents', { entity_id: ORDER_UUID }))).status).toBe(400)
    expect((await GET(getRequest('/api/documents', { entity_type: 'order' }))).status).toBe(400)
  })

  it('GET maps type/status/search filters and pagination onto the query', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)

    await GET(
      getRequest('/api/documents', {
        document_type: 'invoice,quotation',
        status: 'issued,sent',
        search: 'INV-004',
        limit: '10',
        offset: '20',
      }),
    )

    const [call] = db.callsFor('select:documents')
    expect(call.filters).toContainEqual(['in', 'document_type', ['invoice', 'quotation']])
    expect(call.filters).toContainEqual(['in', 'status', ['issued', 'sent']])
    expect(call.filters).toContainEqual(['ilike', 'document_number', '%INV-004%'])
    expect(call.modifiers).toContainEqual(['range', 20, 29])
  })

  it('POST issues through the RPC and returns the frozen document', async () => {
    const { tenant, db } = createFakeTenant({ organizationId: 'org-4', userId: 'user-4' })
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('rpc:issue_document_as_org', { data: 'd-1' })
    db.queue('select:documents', {
      data: { id: 'd-1', document_number: 'INV-0007', status: 'issued', currency: 'UGX', total: 300 },
    })

    const res = await POST(
      jsonRequest('/api/documents', {
        entity_type: 'order',
        entity_id: ORDER_UUID,
        document_type: 'invoice',
      }),
    )

    expect(res.status).toBe(201)
    const { document } = await res.json()
    // Issued, not draft: numbering, snapshot and financials all happen inside
    // the RPC, so the route never invents any of them.
    expect(document.status).toBe('issued')
    expect(document.currency).toBe('UGX')

    const [rpc] = db.callsFor('rpc:issue_document_as_org')
    expect(rpc.values).toEqual({
      p_org: 'org-4',
      p_user: 'user-4',
      p_order_id: ORDER_UUID,
      p_document_type: 'invoice',
      p_options: {},
    })
    // No hand-rolled numbering left: the counter is the RPC's business.
    expect(db.callsFor('rpc:next_number')).toHaveLength(0)
    expect(db.callsFor('insert:documents')).toHaveLength(0)
  })

  it('POST passes terms/validity overrides through as options', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('rpc:issue_document_as_org', { data: 'd-2' })
    db.queue('select:documents', { data: { id: 'd-2' } })

    await POST(
      jsonRequest('/api/documents', {
        entity_type: 'order',
        entity_id: ORDER_UUID,
        document_type: 'quotation',
        validity_days: 14,
      }),
    )

    const [rpc] = db.callsFor('rpc:issue_document_as_org')
    const values = rpc.values as { p_options: Record<string, number> }
    expect(values.p_options).toEqual({ validity_days: 14 })
  })

  it('POST surfaces an RPC failure without reading a document back', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('rpc:issue_document_as_org', {
      data: null,
      error: { code: 'P0001', message: 'order already has a live invoice' },
    })

    const res = await POST(
      jsonRequest('/api/documents', {
        entity_type: 'order',
        entity_id: ORDER_UUID,
        document_type: 'invoice',
      }),
    )

    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(db.callsFor('select:documents')).toHaveLength(0)
  })

  it('POST rejects an unknown document_type with 400', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await POST(
      jsonRequest('/api/documents', {
        entity_type: 'order',
        entity_id: ORDER_UUID,
        document_type: 'contract',
      }),
    )
    expect(res.status).toBe(400)
  })

  // Nothing DB-side can issue a non-order document yet; failing here beats
  // failing inside the RPC with a less obvious message.
  it('POST rejects a non-order entity_type with 400', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await POST(
      jsonRequest('/api/documents', {
        entity_type: 'client',
        entity_id: ORDER_UUID,
        document_type: 'invoice',
      }),
    )
    expect(res.status).toBe(400)
    expect(db.callsFor('rpc:issue_document_as_org')).toHaveLength(0)
  })
})
