import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'
import { createFakeTenant } from '@/test/helpers/fake-tenant'
import { jsonRequest } from '@/test/helpers/http'
import { resolveTenant } from '@/lib/auth/tenant'

vi.mock('@/lib/auth/tenant', () => ({ resolveTenant: vi.fn() }))
const resolveTenantMock = vi.mocked(resolveTenant)

const VALID_FIELD = {
  entity: 'order',
  field_name: 'delivery_date',
  field_label: 'Delivery date',
  field_type: 'date',
}

describe('POST /api/field-definitions', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('rejects unauthenticated callers with 401', async () => {
    resolveTenantMock.mockResolvedValue(null)
    expect((await POST(jsonRequest('/api/field-definitions', VALID_FIELD))).status).toBe(401)
  })

  it('rejects staff with 403 (owner-only gate) before touching the db', async () => {
    const { tenant, db } = createFakeTenant({ orgRole: 'staff' })
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await POST(jsonRequest('/api/field-definitions', VALID_FIELD))
    expect(res.status).toBe(403)
    expect(db.calls).toHaveLength(0)
  })

  it('rejects a non-machine field_name with 400', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await POST(
      jsonRequest('/api/field-definitions', { ...VALID_FIELD, field_name: 'Delivery Date!' }),
    )
    expect(res.status).toBe(400)
  })

  it('creates for an owner and returns 201', async () => {
    const { tenant, db } = createFakeTenant({ orgRole: 'owner' })
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('insert:field_definitions', { data: { id: 'f-1', field_name: 'delivery_date' } })

    const res = await POST(jsonRequest('/api/field-definitions', VALID_FIELD))

    expect(res.status).toBe(201)
    const [insert] = db.callsFor('insert:field_definitions')
    expect(insert.values).toMatchObject({ entity: 'order', field_name: 'delivery_date' })
  })
})
