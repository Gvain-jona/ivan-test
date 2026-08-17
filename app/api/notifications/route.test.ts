import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, PATCH } from './route'
import { createFakeTenant } from '@/test/helpers/fake-tenant'
import { getRequest, jsonRequest } from '@/test/helpers/http'
import { resolveTenant } from '@/lib/auth/tenant'

vi.mock('@/lib/auth/tenant', () => ({ resolveTenant: vi.fn() }))
const resolveTenantMock = vi.mocked(resolveTenant)

const NOTIF_UUID = '22222222-2222-4222-8222-222222222222'

describe('GET /api/notifications', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('rejects unauthenticated callers with 401', async () => {
    resolveTenantMock.mockResolvedValue(null)
    const res = await GET(getRequest('/api/notifications'))
    expect(res.status).toBe(401)
  })

  it('projects the inbox by audience and excludes the caller\'s own actions', async () => {
    const { tenant, db } = createFakeTenant({ userId: 'me-1' })
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:notifications', { data: [{ id: 'n-1' }], count: 3 })

    const res = await GET(getRequest('/api/notifications', { limit: '50', offset: '0' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.total).toBe(3)
    expect(body.notifications).toHaveLength(1)

    const [call] = db.callsFor('select:notifications')
    // Access dimension: org-wide OR I'm a named recipient.
    expect(call.filters).toContainEqual(['or', 'audience_scope.eq.org,recipient_user_ids.cs.{me-1}'])
    // Never notify myself (system events, actor null, still show).
    expect(call.filters).toContainEqual(['or', 'actor_user_id.is.null,actor_user_id.neq.me-1'])
    expect(call.modifiers).toContainEqual(['range', 0, 49])
  })

  it('attaches the caller\'s own read/archived state to each fact', async () => {
    const { tenant, db } = createFakeTenant({ userId: 'me-1' })
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:notifications', { data: [{ id: 'n-1' }, { id: 'n-2' }, { id: 'n-3' }] })
    db.queue('select:notification_reads', {
      data: [
        { notification_id: 'n-1', read_at: '2026-08-15T10:00:00Z', archived_at: null },
        { notification_id: 'n-2', read_at: '2026-08-15T09:00:00Z', archived_at: '2026-08-15T11:00:00Z' },
      ],
    })

    const res = await GET(getRequest('/api/notifications'))
    const body = await res.json()

    const byId = Object.fromEntries(body.notifications.map((n: { id: string; state: string }) => [n.id, n.state]))
    expect(byId).toEqual({ 'n-1': 'read', 'n-2': 'archived', 'n-3': 'unread' })

    // State was fetched for exactly this page, scoped to the caller.
    const [reads] = db.callsFor('select:notification_reads')
    expect(reads.filters).toContainEqual(['eq', 'user_id', 'me-1'])
    expect(reads.filters).toContainEqual(['in', 'notification_id', ['n-1', 'n-2', 'n-3']])
  })

  it('skips the read-state query when the page is empty', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:notifications', { data: [], count: 0 })

    const res = await GET(getRequest('/api/notifications'))
    expect(await res.json()).toEqual({ notifications: [], total: 0 })
    expect(db.callsFor('select:notification_reads')).toHaveLength(0)
  })
})

describe('PATCH /api/notifications', () => {
  beforeEach(() => resolveTenantMock.mockReset())

  it('rejects unauthenticated callers with 401', async () => {
    resolveTenantMock.mockResolvedValue(null)
    const res = await PATCH(jsonRequest('/api/notifications', { id: NOTIF_UUID, state: 'read' }, 'PATCH'))
    expect(res.status).toBe(401)
  })

  it('rejects a bad payload with 400', async () => {
    const { tenant } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    const res = await PATCH(jsonRequest('/api/notifications', { id: 'not-a-uuid', state: 'read' }, 'PATCH'))
    expect(res.status).toBe(400)
  })

  it('creates a state row when none exists (update matches nothing → insert)', async () => {
    const { tenant, db } = createFakeTenant({ userId: 'me-1' })
    resolveTenantMock.mockResolvedValue(tenant)
    // The notification is in the caller's audience (authorization passes).
    db.queue('select:notifications', { data: { id: NOTIF_UUID } })
    // No queued update result → default empty → route falls through to insert.

    const res = await PATCH(jsonRequest('/api/notifications', { id: NOTIF_UUID, state: 'read' }, 'PATCH'))
    expect(res.status).toBe(200)

    const [update] = db.callsFor('update:notification_reads')
    expect(update.values).toMatchObject({ read_at: expect.any(String) })
    expect(update.filters).toContainEqual(['eq', 'notification_id', NOTIF_UUID])
    expect(update.filters).toContainEqual(['eq', 'user_id', 'me-1'])

    const [insert] = db.callsFor('insert:notification_reads')
    expect(insert.values).toMatchObject({ notification_id: NOTIF_UUID, user_id: 'me-1', read_at: expect.any(String) })
  })

  it('updates in place when a state row already exists (no insert)', async () => {
    const { tenant, db } = createFakeTenant()
    resolveTenantMock.mockResolvedValue(tenant)
    db.queue('select:notifications', { data: { id: NOTIF_UUID } })
    db.queue('update:notification_reads', { data: [{ id: 'r-1' }] })

    const res = await PATCH(jsonRequest('/api/notifications', { id: NOTIF_UUID, state: 'archived' }, 'PATCH'))
    expect(res.status).toBe(200)

    const [update] = db.callsFor('update:notification_reads')
    expect(update.values).toMatchObject({ archived_at: expect.any(String) })
    expect(db.callsFor('insert:notification_reads')).toHaveLength(0)
  })

  it('refuses to write state on a notification outside the caller\'s audience (404, no write)', async () => {
    const { tenant, db } = createFakeTenant({ userId: 'me-1' })
    resolveTenantMock.mockResolvedValue(tenant)
    // No queued select:notifications → the audience probe finds nothing, so the
    // caller isn't allowed to touch this id (a write-side IDOR is rejected).

    const res = await PATCH(jsonRequest('/api/notifications', { id: NOTIF_UUID, state: 'read' }, 'PATCH'))
    expect(res.status).toBe(404)

    // Authorization ran the audience predicate, and nothing was written.
    const [probe] = db.callsFor('select:notifications')
    expect(probe.filters).toContainEqual(['eq', 'id', NOTIF_UUID])
    expect(probe.filters).toContainEqual(['or', 'audience_scope.eq.org,recipient_user_ids.cs.{me-1}'])
    expect(db.callsFor('update:notification_reads')).toHaveLength(0)
    expect(db.callsFor('insert:notification_reads')).toHaveLength(0)
  })
})
