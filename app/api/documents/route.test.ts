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

  it('GET requires entity_type and entity_id', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    expect((await GET(getRequest('/api/documents'))).status).toBe(400)
  })

  it('POST draft flow (interim shim): next_number first, then insert as draft', async () => {
    const { tenant, db } = createFakeTenant({ organizationId: 'org-4', userId: 'user-4' })
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('rpc:next_number', { data: 'INV-0007' })
    db.queue('insert:documents', { data: { id: 'd-1', document_number: 'INV-0007', status: 'draft' } })

    const res = await POST(
      jsonRequest('/api/documents', {
        entity_type: 'order',
        entity_id: ORDER_UUID,
        document_type: 'invoice',
      }),
    )

    expect(res.status).toBe(201)
    expect((await res.json()).document.status).toBe('draft')

    // Counter key convention: document:<document_type>, org passed explicitly.
    const [rpc] = db.callsFor('rpc:next_number')
    expect(rpc.values).toEqual({ p_counter_key: 'document:invoice', p_org: 'org-4' })

    const [insert] = db.callsFor('insert:documents')
    expect(insert.values).toMatchObject({
      document_number: 'INV-0007',
      status: 'draft', // POST only ever creates drafts until issue_document()
      created_by: 'user-4',
    })
  })

  it('POST surfaces a counter failure without inserting', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('rpc:next_number', { data: null, error: { code: 'P0001', message: 'No counter seeded' } })

    const res = await POST(
      jsonRequest('/api/documents', {
        entity_type: 'order',
        entity_id: ORDER_UUID,
        document_type: 'receipt',
      }),
    )

    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(db.callsFor('insert:documents')).toHaveLength(0)
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
})
