import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, PATCH } from './route'
import { createFakeTenant } from '@/test/helpers/fake-tenant'
import { jsonRequest } from '@/test/helpers/http'
import { resolveTenant } from '@/lib/auth/tenant'

vi.mock('@/lib/auth/tenant', () => ({ resolveTenant: vi.fn() }))
const resolveTenantMock = vi.mocked(resolveTenant)

// The brand colour lives in Clerk org metadata, not the v2 row, so the route
// reaches Clerk directly for that one key — see app/lib/theme/brand.ts.
const clerk = vi.hoisted(() => ({
  auth: vi.fn(),
  updateOrganizationMetadata: vi.fn(),
}))
vi.mock('@clerk/nextjs/server', () => ({
  auth: clerk.auth,
  clerkClient: async () => ({
    organizations: { updateOrganizationMetadata: clerk.updateOrganizationMetadata },
  }),
}))

/** Signed in, with an active Clerk org and an optional brand claim. */
function signedIn(brandColor?: string) {
  clerk.auth.mockResolvedValue({
    orgId: 'org_clerk_1',
    sessionClaims: brandColor ? { brand_color: brandColor } : {},
  })
}

beforeEach(() => {
  clerk.auth.mockReset()
  clerk.updateOrganizationMetadata.mockReset()
  signedIn()
})

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

  it('serves the brand colour from the Clerk session claim', async () => {
    const { tenant, db } = createFakeTenant({ orgRole: 'owner' })
    resolveTenantMock.mockResolvedValue(tenant)
    signedIn('ocean')
    db.queue('select:organization', { data: { id: 'org-1', name: 'Ivan Prints' } })

    const body = await (await GET()).json()

    expect(body.brand_color).toBe('ocean')
  })

  it('falls back to the default preset when the claim is missing or unknown', async () => {
    for (const claim of [undefined, 'chartreuse']) {
      const { tenant, db } = createFakeTenant({ orgRole: 'owner' })
      resolveTenantMock.mockResolvedValue(tenant)
      signedIn(claim)
      db.queue('select:organization', { data: { id: 'org-1' } })

      const body = await (await GET()).json()

      // A claim is untrusted input; an unrecognised value must not reach the
      // stylesheet, it must degrade to the shipped default.
      expect(body.brand_color).toBe('ember')
    }
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

  /**
   * A5: null removes the key. Deleting rather than storing '' matters because
   * settings is frozen verbatim into issued document snapshots — a document
   * carrying `"phone": ""` asserts the business has a blank phone number.
   */
  it('removes a key sent as null, leaving its siblings alone', async () => {
    const { tenant, db } = createFakeTenant({ orgRole: 'owner' })
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:organization', {
      data: {
        settings: {
          identity: { legal_name: 'Ivan Prints Ltd', phone: '0772 100 200', tax_id: '1000123456' },
        },
      },
    })
    db.queue('update:organization', { data: { id: 'org-1' } })

    const res = await PATCH(
      jsonRequest(
        '/api/organization',
        { settings: { identity: { phone: null, tax_id: '2000999888' } } },
        'PATCH',
      ),
    )

    expect(res.status).toBe(200)
    const [update] = db.callsFor('update:organization')
    expect(update.values).toEqual({
      settings: {
        identity: { legal_name: 'Ivan Prints Ltd', tax_id: '2000999888' },
      },
    })
  })

  // An org that cannot name a currency cannot issue anything, so this one key
  // is a change and never a removal — refused here rather than at issue time.
  it('refuses to clear the currency with 400', async () => {
    const { tenant, db } = createFakeTenant({ orgRole: 'owner' })
    resolveTenantMock.mockResolvedValue(tenant)

    const res = await PATCH(
      jsonRequest('/api/organization', { settings: { locale: { currency: null } } }, 'PATCH'),
    )

    expect(res.status).toBe(400)
    expect(db.callsFor('update:organization')).toHaveLength(0)
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

  it('writes the brand colour to Clerk metadata, not to the org row', async () => {
    const { tenant, db } = createFakeTenant({ orgRole: 'owner' })
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:organization', { data: { id: 'org-1' } })

    const res = await PATCH(jsonRequest('/api/organization', { brand_color: 'teal' }, 'PATCH'))

    expect(res.status).toBe(200)
    expect(clerk.updateOrganizationMetadata).toHaveBeenCalledWith('org_clerk_1', {
      publicMetadata: { brand_color: 'teal' },
    })
    // Nothing in the row changed, so the route reads instead of issuing an
    // empty update.
    expect(db.callsFor('update:organization')).toHaveLength(0)
    expect(db.callsFor('select:organization')).toHaveLength(1)
    // Echoed back so the client can repaint before the claim refreshes.
    expect((await res.json()).brand_color).toBe('teal')
  })

  it('rejects an unknown brand colour with 400 and writes nothing', async () => {
    const { tenant } = createFakeTenant({ orgRole: 'owner' })
    resolveTenantMock.mockResolvedValue(tenant)

    const res = await PATCH(
      jsonRequest('/api/organization', { brand_color: 'chartreuse' }, 'PATCH'),
    )

    expect(res.status).toBe(400)
    expect(clerk.updateOrganizationMetadata).not.toHaveBeenCalled()
  })

  it('forbids staff from changing the brand colour (403)', async () => {
    const { tenant } = createFakeTenant({ orgRole: 'staff' })
    resolveTenantMock.mockResolvedValue(tenant)

    const res = await PATCH(jsonRequest('/api/organization', { brand_color: 'teal' }, 'PATCH'))

    expect(res.status).toBe(403)
    expect(clerk.updateOrganizationMetadata).not.toHaveBeenCalled()
  })
})
