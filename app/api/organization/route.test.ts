import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, PATCH } from './route'
import { createFakeTenant } from '@/test/helpers/fake-tenant'
import { jsonRequest } from '@/test/helpers/http'
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

describe('PATCH /api/organization', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('rejects unauthenticated callers with 401', async () => {
    resolveTenantMock.mockResolvedValue(null)
    const res = await PATCH(jsonRequest('/api/organization', { currency: 'USD' }, 'PATCH'))
    expect(res.status).toBe(401)
  })

  it('forbids staff from changing org settings (403)', async () => {
    const { tenant } = createFakeTenant({ orgRole: 'staff' })
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await PATCH(jsonRequest('/api/organization', { currency: 'USD' }, 'PATCH'))
    expect(res.status).toBe(403)
  })

  it('rejects an empty patch with 400', async () => {
    const { tenant } = createFakeTenant({ orgRole: 'owner' })
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await PATCH(jsonRequest('/api/organization', {}, 'PATCH'))
    expect(res.status).toBe(400)
  })

  it('rejects a malformed currency with 400', async () => {
    const { tenant } = createFakeTenant({ orgRole: 'owner' })
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await PATCH(jsonRequest('/api/organization', { currency: 'dollars' }, 'PATCH'))
    expect(res.status).toBe(400)
  })

  it('merges the patch into existing settings, never replacing them', async () => {
    const { tenant, db } = createFakeTenant({ orgRole: 'owner' })
    resolveTenantMock.mockResolvedValue(tenant)
    // Existing settings already carry a locale; the patch only sets currency.
    db.queue('select:organization', { data: { settings: { locale: 'en-UG' } } })
    db.queue('update:organization', {
      data: { id: 'org-1', settings: { locale: 'en-UG', currency: 'USD' } },
    })

    const res = await PATCH(jsonRequest('/api/organization', { currency: 'USD' }, 'PATCH'))

    expect(res.status).toBe(200)
    const [update] = db.callsFor('update:organization')
    // locale preserved, currency added — a merge, not a replace.
    expect(update.values).toEqual({ settings: { locale: 'en-UG', currency: 'USD' } })
  })
})
