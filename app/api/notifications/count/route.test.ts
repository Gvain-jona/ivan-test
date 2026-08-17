import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'
import { createFakeTenant } from '@/test/helpers/fake-tenant'
import { resolveTenant } from '@/lib/auth/tenant'

vi.mock('@/lib/auth/tenant', () => ({ resolveTenant: vi.fn() }))
const resolveTenantMock = vi.mocked(resolveTenant)

describe('GET /api/notifications/count', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('rejects unauthenticated callers with 401', async () => {
    resolveTenantMock.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns audience notifications minus the ones the caller resolved', async () => {
    const { tenant, db } = createFakeTenant({ userId: 'me-1' })
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:notifications', { count: 10 })       // audience, actor-excluded
    db.queue('select:notification_reads', { count: 4 })   // read or archived by me

    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ unread: 6 })

    // Audience filter (org-wide OR I'm a recipient) + self-exclusion.
    const [audience] = db.callsFor('select:notifications')
    expect(audience.filters).toContainEqual(['or', 'audience_scope.eq.org,recipient_user_ids.cs.{me-1}'])
    expect(audience.filters).toContainEqual(['or', 'actor_user_id.is.null,actor_user_id.neq.me-1'])

    // Resolved = my read/archived state rows only.
    const [resolved] = db.callsFor('select:notification_reads')
    expect(resolved.filters).toContainEqual(['eq', 'user_id', 'me-1'])
    expect(resolved.filters).toContainEqual(['or', 'read_at.not.is.null,archived_at.not.is.null'])
  })

  it('never returns a negative count', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:notifications', { count: 0 })
    db.queue('select:notification_reads', { count: 3 })

    const res = await GET()
    expect(await res.json()).toEqual({ unread: 0 })
  })
})
