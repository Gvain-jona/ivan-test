import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from './route'
import { createFakeTenant } from '@/test/helpers/fake-tenant'
import { getRequest, jsonRequest } from '@/test/helpers/http'
import { resolveTenant } from '@/lib/auth/tenant'

vi.mock('@/lib/auth/tenant', () => ({ resolveTenant: vi.fn() }))
const resolveTenantMock = vi.mocked(resolveTenant)

describe('GET /api/clients', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('rejects unauthenticated callers with 401', async () => {
    resolveTenantMock.mockResolvedValue(null)
    expect((await GET(getRequest('/api/clients'))).status).toBe(401)
  })

  it('defaults to active clients and supports name search', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:clients', { data: [{ id: 'c-1', name: 'Acme' }], count: 1 })

    const res = await GET(getRequest('/api/clients', { search: 'acm' }))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ clients: [{ id: 'c-1', name: 'Acme' }], total: 1 })
    const [call] = db.callsFor('select:clients')
    expect(call.filters).toContainEqual(['eq', 'status', 'active'])
    expect(call.filters).toContainEqual(['ilike', 'name', '%acm%'])
  })

  it("status=all drops the status filter", async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    await GET(getRequest('/api/clients', { status: 'all' }))
    const [call] = db.callsFor('select:clients')
    expect(call.filters.find(f => f[0] === 'eq' && f[1] === 'status')).toBeUndefined()
  })
})

describe('POST /api/clients', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('rejects an empty name with 400', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    expect((await POST(jsonRequest('/api/clients', { name: '  ' }))).status).toBe(400)
  })

  it('creates the client with created_by stamped from the tenant', async () => {
    const { tenant, db } = createFakeTenant({ userId: 'user-3' })
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('insert:clients', { data: { id: 'c-9', name: 'New Client' } })

    const res = await POST(jsonRequest('/api/clients', { name: 'New Client' }))

    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ client: { id: 'c-9', name: 'New Client' } })
    const [insert] = db.callsFor('insert:clients')
    expect(insert.values).toMatchObject({ name: 'New Client', created_by: 'user-3' })
  })
})
