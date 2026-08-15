import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'
import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { clerkClient } from '@clerk/nextjs/server'
import { createV2AdminClient } from '@/utils/supabase/server-v2'

/**
 * Route-contract tests for the Clerk -> v2 org sync webhook. Signature
 * verification, Clerk Backend API calls, and the admin DB client are
 * all mocked; each test asserts the resulting DB call shape.
 */

vi.mock('@clerk/nextjs/webhooks', () => ({ verifyWebhook: vi.fn() }))
vi.mock('@clerk/nextjs/server', () => ({ clerkClient: vi.fn() }))
vi.mock('@/utils/supabase/server-v2', () => ({ createV2AdminClient: vi.fn() }))
vi.mock('crypto', () => ({ randomUUID: () => 'generated-uuid' }))

const verifyWebhookMock = vi.mocked(verifyWebhook)
const clerkClientMock = vi.mocked(clerkClient)
const adminMock = vi.mocked(createV2AdminClient)

const INTERNAL_UUID = '11111111-2222-3333-4444-555555555555'

function stubClerkClient({ publicMetadata = {} }: { publicMetadata?: Record<string, unknown> } = {}) {
  const getUser = vi.fn().mockResolvedValue({ publicMetadata })
  const updateUserMetadata = vi.fn().mockResolvedValue({})
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clerkClientMock.mockResolvedValue({ users: { getUser, updateUserMetadata } } as any)
  return { getUser, updateUserMetadata }
}

function stubAdmin() {
  const rpc = vi.fn().mockResolvedValue({ data: 'org-uuid', error: null })
  const update = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }))
  const maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'org-uuid' }, error: null })
  const upsert = vi.fn().mockResolvedValue({ error: null })
  // The starter-field seed that runs right after provision_organization.
  const seedUpsert = vi.fn().mockResolvedValue({ error: null })
  const del = vi.fn(() => ({
    eq: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
  }))
  // The "member.added" notification a new membership emits (via createTenantDb,
  // which reaches the raw client's notifications table).
  const notifyInsert = vi.fn().mockResolvedValue({ error: null })

  const from = vi.fn((table: string) => {
    if (table === 'organizations') {
      return {
        update,
        select: () => ({ eq: () => ({ maybeSingle }) }),
      }
    }
    if (table === 'organization_members') {
      return { upsert, delete: del }
    }
    if (table === 'field_definitions') {
      return { upsert: seedUpsert }
    }
    if (table === 'notifications') {
      return { insert: notifyInsert }
    }
    throw new Error(`unexpected table ${table}`)
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminMock.mockReturnValue({ from, rpc } as any)
  return { rpc, update, maybeSingle, upsert, seedUpsert, del, notifyInsert }
}

function fakeRequest() {
  return {} as never
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/webhooks/clerk', () => {
  it('rejects a request with an invalid signature', async () => {
    verifyWebhookMock.mockRejectedValue(new Error('bad signature'))
    const res = await POST(fakeRequest())
    expect(res.status).toBe(400)
  })

  it('user.created mints an internal_user_id when none exists', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    verifyWebhookMock.mockResolvedValue({ type: 'user.created', data: { id: 'user_new' } } as any)
    const { updateUserMetadata } = stubClerkClient({ publicMetadata: {} })
    stubAdmin()

    const res = await POST(fakeRequest())

    expect(res.status).toBe(200)
    expect(updateUserMetadata).toHaveBeenCalledWith('user_new', {
      publicMetadata: { internal_user_id: 'generated-uuid' },
    })
  })

  it('user.created is a no-op when internal_user_id is already set', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    verifyWebhookMock.mockResolvedValue({ type: 'user.created', data: { id: 'user_existing' } } as any)
    const { updateUserMetadata } = stubClerkClient({ publicMetadata: { internal_user_id: INTERNAL_UUID } })
    stubAdmin()

    await POST(fakeRequest())

    expect(updateUserMetadata).not.toHaveBeenCalled()
  })

  it('organization.created provisions via the RPC with the resolved owner', async () => {
    verifyWebhookMock.mockResolvedValue({
      type: 'organization.created',
      data: { id: 'org_clerk1', name: 'Acme', slug: 'acme', created_by: 'user_owner' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    stubClerkClient({ publicMetadata: { internal_user_id: INTERNAL_UUID } })
    const { rpc, seedUpsert } = stubAdmin()

    const res = await POST(fakeRequest())

    expect(res.status).toBe(200)
    expect(rpc).toHaveBeenCalledWith('provision_organization', {
      p_clerk_org_id: 'org_clerk1',
      p_name: 'Acme',
      p_owner_user_id: INTERNAL_UUID,
      p_slug: 'acme',
    })
    // The org's starter field_definitions are seeded against the resolved
    // org id right after provisioning, so the app is usable from screen one.
    const [rows, options] = seedUpsert.mock.calls[0]
    expect(rows.every((r: { organization_id: string }) => r.organization_id === 'org-uuid')).toBe(true)
    expect(options).toMatchObject({ onConflict: 'organization_id,entity,field_name' })
  })

  it('organization.created skips provisioning when there is no creator', async () => {
    verifyWebhookMock.mockResolvedValue({
      type: 'organization.created',
      data: { id: 'org_clerk1', name: 'Acme', slug: 'acme', created_by: undefined },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    const { rpc } = stubAdmin()

    const res = await POST(fakeRequest())

    expect(res.status).toBe(200)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('organizationMembership.created upserts the membership with the org: prefix stripped', async () => {
    verifyWebhookMock.mockResolvedValue({
      type: 'organizationMembership.created',
      data: {
        role: 'org:admin',
        organization: { id: 'org_clerk1' },
        public_user_data: { user_id: 'user_member' },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    stubClerkClient({ publicMetadata: { internal_user_id: INTERNAL_UUID } })
    const { upsert, notifyInsert } = stubAdmin()

    const res = await POST(fakeRequest())

    expect(res.status).toBe(200)
    expect(upsert).toHaveBeenCalledWith(
      { organization_id: 'org-uuid', user_id: INTERNAL_UUID, role: 'admin' },
      { onConflict: 'organization_id,user_id' },
    )
    // A new member is notified they were added, directed to just them.
    expect(notifyInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        verb: 'member.added',
        category: 'team',
        audience_scope: 'users',
        recipient_user_ids: [INTERNAL_UUID],
        organization_id: 'org-uuid',
      }),
    )
  })

  it('organizationMembership.created fails (for retry) when the org is not yet mirrored', async () => {
    verifyWebhookMock.mockResolvedValue({
      type: 'organizationMembership.created',
      data: {
        role: 'org:admin',
        organization: { id: 'org_not_mirrored' },
        public_user_data: { user_id: 'user_member' },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    stubClerkClient({ publicMetadata: { internal_user_id: INTERNAL_UUID } })
    const admin = stubAdmin()
    admin.maybeSingle.mockResolvedValue({ data: null, error: null })

    const res = await POST(fakeRequest())

    expect(res.status).toBe(500)
  })

  it('organizationMembership.deleted removes the membership row', async () => {
    verifyWebhookMock.mockResolvedValue({
      type: 'organizationMembership.deleted',
      data: {
        organization: { id: 'org_clerk1' },
        public_user_data: { user_id: 'user_member' },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    stubClerkClient({ publicMetadata: { internal_user_id: INTERNAL_UUID } })
    const { del } = stubAdmin()

    const res = await POST(fakeRequest())

    expect(res.status).toBe(200)
    expect(del).toHaveBeenCalled()
  })

  it('organization.deleted archives the mirror row instead of hard-deleting it', async () => {
    verifyWebhookMock.mockResolvedValue({
      type: 'organization.deleted',
      data: { id: 'org_clerk1', deleted: true },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    const { update } = stubAdmin()

    const res = await POST(fakeRequest())

    expect(res.status).toBe(200)
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'archived', deleted_at: expect.any(String) }),
    )
  })

  it('an unhandled event type is a no-op 200', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    verifyWebhookMock.mockResolvedValue({ type: 'session.created', data: {} } as any)
    stubAdmin()

    const res = await POST(fakeRequest())

    expect(res.status).toBe(200)
  })
})
