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

  const currencyPatch = { settings: { locale: { currency: 'USD' } } }

  it('rejects unauthenticated callers with 401', async () => {
    resolveTenantMock.mockResolvedValue(null)
    const res = await PATCH(jsonRequest('/api/organization', currencyPatch, 'PATCH'))
    expect(res.status).toBe(401)
  })

  it('forbids staff from changing org settings (403)', async () => {
    const { tenant } = createFakeTenant({ orgRole: 'staff' })
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await PATCH(jsonRequest('/api/organization', currencyPatch, 'PATCH'))
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
    const res = await PATCH(
      jsonRequest('/api/organization', { settings: { locale: { currency: 'dollars' } } }, 'PATCH'),
    )
    expect(res.status).toBe(400)
  })

  // The DB trigger whitelists top-level blocks; catching a bad one here
  // turns a round-trip P0001 into a straight 400.
  it('rejects an unknown settings block with 400', async () => {
    const { tenant } = createFakeTenant({ orgRole: 'owner' })
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await PATCH(
      jsonRequest('/api/organization', { settings: { onboarding: { completed: true } } }, 'PATCH'),
    )
    expect(res.status).toBe(400)
  })

  it('rejects a flat currency — it belongs to the locale block now', async () => {
    const { tenant } = createFakeTenant({ orgRole: 'owner' })
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await PATCH(jsonRequest('/api/organization', { currency: 'USD' }, 'PATCH'))
    expect(res.status).toBe(400)
  })

  it('merges INTO a block, so a sibling key in that block survives', async () => {
    const { tenant, db } = createFakeTenant({ orgRole: 'owner' })
    resolveTenantMock.mockResolvedValue(tenant)
    // locale already carries a timezone; the patch only sets currency.
    db.queue('select:organization', {
      data: { settings: { locale: { timezone: 'Africa/Kampala' }, tax: { registered: false } } },
    })
    db.queue('update:organization', { data: { id: 'org-1' } })

    const res = await PATCH(jsonRequest('/api/organization', currencyPatch, 'PATCH'))

    expect(res.status).toBe(200)
    const [update] = db.callsFor('update:organization')
    // A shallow merge would have replaced the whole locale block and lost
    // the timezone. Sibling blocks are untouched either way.
    expect(update.values).toEqual({
      settings: {
        locale: { timezone: 'Africa/Kampala', currency: 'USD' },
        tax: { registered: false },
      },
    })
  })

  it('writes onboarding completion to its column, never into settings', async () => {
    const { tenant, db } = createFakeTenant({ orgRole: 'owner' })
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('update:organization', { data: { id: 'org-1' } })

    const res = await PATCH(
      jsonRequest('/api/organization', { onboarding_completed: true }, 'PATCH'),
    )

    expect(res.status).toBe(200)
    const [update] = db.callsFor('update:organization')
    const values = update.values as Record<string, unknown>
    expect(values.settings).toBeUndefined()
    expect(typeof values.onboarding_completed_at).toBe('string')
    // No settings in the patch means no read-modify-write at all.
    expect(db.callsFor('select:organization')).toHaveLength(0)
  })
})
