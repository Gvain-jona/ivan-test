import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'
import { createFakeTenant } from '@/test/helpers/fake-tenant'
import { resolveTenant } from '@/lib/auth/tenant'

vi.mock('@/lib/auth/tenant', () => ({ resolveTenant: vi.fn() }))
const resolveTenantMock = vi.mocked(resolveTenant)

describe('GET /api/organization', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('rejects unauthenticated callers with 401', async () => {
    resolveTenantMock.mockResolvedValue(null)
    expect((await GET()).status).toBe(401)
  })

  it("returns the caller's org and role via the id-scoped accessor", async () => {
    const { tenant, db } = createFakeTenant({ orgRole: 'owner' })
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:organization', {
      data: { id: 'org-1', name: 'Ivan Prints', settings: { order_statuses: ['pending'] } },
    })

    const res = await GET()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.organization.name).toBe('Ivan Prints')
    expect(body.orgRole).toBe('owner')
    // Reads go through organization(), never from('organizations').
    expect(db.callsFor('select:organization')).toHaveLength(1)
  })
})
