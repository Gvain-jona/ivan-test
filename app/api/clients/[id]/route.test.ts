import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, PATCH } from './route'
import { createFakeTenant } from '@/test/helpers/fake-tenant'
import { getRequest, jsonRequest, routeParams } from '@/test/helpers/http'
import { resolveTenant } from '@/lib/auth/tenant'

vi.mock('@/lib/auth/tenant', () => ({ resolveTenant: vi.fn() }))
const resolveTenantMock = vi.mocked(resolveTenant)

describe('GET /api/clients/[id]', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('returns 404 for an id the scoped lookup cannot see', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await GET(getRequest('/api/clients/foreign'), routeParams({ id: 'foreign' }))
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/clients/[id]', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('archives via status (the delete path in v2)', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('update:clients', { data: { id: 'c-1', status: 'archived' } })

    const res = await PATCH(
      jsonRequest('/api/clients/c-1', { status: 'archived' }, 'PATCH'),
      routeParams({ id: 'c-1' }),
    )

    expect(res.status).toBe(200)
    const [update] = db.callsFor('update:clients')
    expect(update.values).toEqual({ status: 'archived' })
    expect(update.filters).toContainEqual(['eq', 'id', 'c-1'])
  })

  it('rejects an empty update with 400', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await PATCH(jsonRequest('/api/clients/c-1', {}, 'PATCH'), routeParams({ id: 'c-1' }))
    expect(res.status).toBe(400)
  })
})
