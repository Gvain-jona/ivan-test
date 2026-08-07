import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, PATCH } from './route'
import { createFakeTenant } from '@/test/helpers/fake-tenant'
import { jsonRequest } from '@/test/helpers/http'
import { resolveTenant } from '@/lib/auth/tenant'

vi.mock('@/lib/auth/tenant', () => ({ resolveTenant: vi.fn() }))
const resolveTenantMock = vi.mocked(resolveTenant)

const patchRequest = (body: unknown) => jsonRequest('/api/counters', body, 'PATCH')

describe('GET /api/counters', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('rejects unauthenticated callers with 401', async () => {
    resolveTenantMock.mockResolvedValue(null)
    expect((await GET()).status).toBe(401)
  })

  it('returns the org\'s numbering sequences', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:counters', {
      data: [
        { counter_key: 'doc:invoice', current_value: 44, format: 'INV-{N4}', reset_policy: 'yearly' },
      ],
    })

    const res = await GET()

    expect(res.status).toBe(200)
    const { counters } = await res.json()
    expect(counters).toHaveLength(1)
    expect(counters[0].counter_key).toBe('doc:invoice')
  })
})

describe('PATCH /api/counters', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('rejects unauthenticated callers with 401', async () => {
    resolveTenantMock.mockResolvedValue(null)
    expect((await PATCH(patchRequest({ counter_key: 'doc:invoice', format: 'INV-{N4}' }))).status)
      .toBe(401)
  })

  it('forbids staff from changing numbering', async () => {
    const { tenant, db } = createFakeTenant({ orgRole: 'staff' })
    resolveTenantMock.mockResolvedValue(tenant)

    const res = await PATCH(patchRequest({ counter_key: 'doc:invoice', format: 'INV-{N4}' }))

    expect(res.status).toBe(403)
    expect(db.callsFor('update:counters')).toHaveLength(0)
  })

  it('rejects a patch that names no field with 400', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    expect((await PATCH(patchRequest({ counter_key: 'doc:invoice' }))).status).toBe(400)
  })

  it('404s for a counter the org does not have', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    // No queued read → maybeSingle default is data: null

    const res = await PATCH(patchRequest({ counter_key: 'doc:proforma', format: 'PRO-{N4}' }))

    expect(res.status).toBe(404)
    // A missing counter is what makes a document type illegal; PATCH must not
    // quietly create one and hand the org a new issuing capability.
    expect(db.callsFor('update:counters')).toHaveLength(0)
  })

  it('updates format and reset policy', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:counters', { data: { counter_key: 'doc:invoice', current_value: 44 } })
    db.queue('update:counters', {
      data: { counter_key: 'doc:invoice', format: 'INV-{YYYY}-{N4}', reset_policy: 'yearly' },
    })

    const res = await PATCH(
      patchRequest({
        counter_key: 'doc:invoice',
        format: 'INV-{YYYY}-{N4}',
        reset_policy: 'yearly',
      }),
    )

    expect(res.status).toBe(200)
    const [update] = db.callsFor('update:counters')
    // counter_key addresses the row; it is not part of the patch.
    expect(update.values).toEqual({ format: 'INV-{YYYY}-{N4}', reset_policy: 'yearly' })
    expect(update.filters).toContainEqual(['eq', 'counter_key', 'doc:invoice'])
  })

  it('lets numbering skip ahead (migration day: the paper book reached 999)', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:counters', { data: { counter_key: 'doc:invoice', current_value: 44 } })
    db.queue('update:counters', { data: { counter_key: 'doc:invoice', current_value: 999 } })

    const res = await PATCH(patchRequest({ counter_key: 'doc:invoice', current_value: 999 }))

    expect(res.status).toBe(200)
    const [update] = db.callsFor('update:counters')
    expect(update.values).toEqual({ current_value: 999 })
  })

  it('refuses to move numbering backwards, since those numbers are already issued', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:counters', { data: { counter_key: 'doc:invoice', current_value: 44 } })

    const res = await PATCH(patchRequest({ counter_key: 'doc:invoice', current_value: 10 }))

    expect(res.status).toBe(400)
    expect(db.callsFor('update:counters')).toHaveLength(0)
    // The message names the current value: an owner who typed the wrong box
    // needs to know where the sequence actually is.
    const { error } = await res.json()
    expect(error.message).toContain('44')
  })

  it('allows setting the same value (a no-op is not a regression)', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:counters', { data: { counter_key: 'doc:invoice', current_value: 44 } })
    db.queue('update:counters', { data: { counter_key: 'doc:invoice', current_value: 44 } })

    const res = await PATCH(patchRequest({ counter_key: 'doc:invoice', current_value: 44 }))

    expect(res.status).toBe(200)
  })
})
