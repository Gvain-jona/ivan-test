import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from './route'
import { createFakeTenant } from '@/test/helpers/fake-tenant'
import { getRequest, jsonRequest } from '@/test/helpers/http'
import { resolveTenant } from '@/lib/auth/tenant'

vi.mock('@/lib/auth/tenant', () => ({ resolveTenant: vi.fn() }))
const resolveTenantMock = vi.mocked(resolveTenant)

describe('/api/products', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('GET rejects unauthenticated callers with 401', async () => {
    resolveTenantMock.mockResolvedValue(null)
    expect((await GET(getRequest('/api/products'))).status).toBe(401)
  })

  it('GET returns { products, total }', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:products', { data: [{ id: 'p-1' }], count: 3 })
    const res = await GET(getRequest('/api/products'))
    expect(await res.json()).toEqual({ products: [{ id: 'p-1' }], total: 3 })
  })

  it('POST rejects a negative selling_price with 400', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await POST(jsonRequest('/api/products', { name: 'Flyer', selling_price: -5 }))
    expect(res.status).toBe(400)
  })

  it('POST creates and returns 201', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('insert:products', { data: { id: 'p-9', name: 'Flyer' } })
    const res = await POST(jsonRequest('/api/products', { name: 'Flyer', selling_price: 0.5 }))
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ product: { id: 'p-9', name: 'Flyer' } })
  })
})
