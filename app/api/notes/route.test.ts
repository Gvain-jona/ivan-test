import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from './route'
import { createFakeTenant } from '@/test/helpers/fake-tenant'
import { getRequest, jsonRequest } from '@/test/helpers/http'
import { resolveTenant } from '@/lib/auth/tenant'

vi.mock('@/lib/auth/tenant', () => ({ resolveTenant: vi.fn() }))
const resolveTenantMock = vi.mocked(resolveTenant)

const ENTITY_UUID = '22222222-2222-4222-8222-222222222222'

describe('/api/notes', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('GET requires entity_type and entity_id', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await GET(getRequest('/api/notes', { entity_type: 'order' }))
    expect(res.status).toBe(400)
  })

  it('GET lists notes for one entity', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:notes', { data: [{ id: 'n-1', content: 'call client' }] })

    const res = await GET(getRequest('/api/notes', { entity_type: 'order', entity_id: ENTITY_UUID }))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ notes: [{ id: 'n-1', content: 'call client' }] })
    const [call] = db.callsFor('select:notes')
    expect(call.filters).toContainEqual(['eq', 'entity_type', 'order'])
    expect(call.filters).toContainEqual(['eq', 'entity_id', ENTITY_UUID])
  })

  it('POST stamps created_by and returns 201', async () => {
    const { tenant, db } = createFakeTenant({ userId: 'user-5' })
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('insert:notes', { data: { id: 'n-2', content: 'printed' } })

    const res = await POST(
      jsonRequest('/api/notes', { entity_type: 'order', entity_id: ENTITY_UUID, content: 'printed' }),
    )

    expect(res.status).toBe(201)
    const [insert] = db.callsFor('insert:notes')
    expect(insert.values).toMatchObject({ content: 'printed', created_by: 'user-5' })
  })

  it('POST rejects empty content with 400', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await POST(
      jsonRequest('/api/notes', { entity_type: 'order', entity_id: ENTITY_UUID, content: ' ' }),
    )
    expect(res.status).toBe(400)
  })
})
