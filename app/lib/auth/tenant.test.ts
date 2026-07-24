import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveTenant } from './tenant'
import { auth } from '@clerk/nextjs/server'
import { createV2AdminClient } from '@/utils/supabase/server-v2'

/**
 * Unit tests for resolveTenant(): Clerk identity (internal_user_id)
 * plus Clerk Organizations tenancy (orgId/orgRole), resolved against
 * the clerk_org_id mirror row via a stub admin client.
 */

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
vi.mock('@/utils/supabase/server-v2', () => ({ createV2AdminClient: vi.fn() }))

const authMock = vi.mocked(auth)
const adminMock = vi.mocked(createV2AdminClient)

const UUID = '11111111-2222-3333-4444-555555555555'
const ORG_UUID = '99999999-8888-7777-6666-555555555555'

function stubAdmin({
  organization = null,
  error = null,
}: {
  organization?: { id: string } | null
  error?: { message: string } | null
} = {}) {
  const client = {
    from: vi.fn((table: string) => {
      if (table === 'organizations') {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: organization, error }) }),
          }),
        }
      }
      throw new Error(`unexpected table ${table}`)
    }),
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminMock.mockReturnValue(client as any)
  return client
}

function signedIn({
  claims,
  orgId,
  orgRole,
}: {
  claims: Record<string, unknown> | null
  orgId?: string | null
  orgRole?: string | null
}) {
  authMock.mockResolvedValue({
    userId: 'user_clerk123',
    sessionClaims: claims,
    orgId: orgId ?? null,
    orgRole: orgRole ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('resolveTenant', () => {
  it('returns null when there is no Clerk session', async () => {
    authMock.mockResolvedValue({
      userId: null,
      sessionClaims: null,
      orgId: null,
      orgRole: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    expect(await resolveTenant()).toBeNull()
  })

  it('returns null for a signed-in user without the internal_user_id claim (unprovisioned)', async () => {
    signedIn({ claims: {}, orgId: 'org_abc', orgRole: 'org:owner' })
    stubAdmin()
    expect(await resolveTenant()).toBeNull()
    expect(adminMock).not.toHaveBeenCalled()
  })

  it('returns null when the claim is not a UUID (e.g. a raw Clerk id)', async () => {
    signedIn({ claims: { internal_user_id: 'user_clerk123' }, orgId: 'org_abc', orgRole: 'org:owner' })
    stubAdmin()
    expect(await resolveTenant()).toBeNull()
    expect(adminMock).not.toHaveBeenCalled()
  })

  it('returns null when the user has no active organization (no org_id claim)', async () => {
    signedIn({ claims: { internal_user_id: UUID }, orgId: null, orgRole: null })
    stubAdmin()
    expect(await resolveTenant()).toBeNull()
    expect(adminMock).not.toHaveBeenCalled()
  })

  it('returns null when the org role does not match a known app role', async () => {
    signedIn({ claims: { internal_user_id: UUID }, orgId: 'org_abc', orgRole: 'org:guest' })
    stubAdmin()
    expect(await resolveTenant()).toBeNull()
    expect(adminMock).not.toHaveBeenCalled()
  })

  it('returns null when no organizations row mirrors this Clerk org yet (webhook lag)', async () => {
    signedIn({ claims: { internal_user_id: UUID }, orgId: 'org_abc', orgRole: 'org:owner' })
    stubAdmin({ organization: null })
    expect(await resolveTenant()).toBeNull()
  })

  it('returns null when the organizations lookup errors', async () => {
    signedIn({ claims: { internal_user_id: UUID }, orgId: 'org_abc', orgRole: 'org:owner' })
    stubAdmin({ error: { message: 'boom' } })
    expect(await resolveTenant()).toBeNull()
  })

  it('resolves the tenant, stripping the org: prefix from the role', async () => {
    signedIn({ claims: { internal_user_id: UUID }, orgId: 'org_abc', orgRole: 'org:owner' })
    stubAdmin({ organization: { id: ORG_UUID } })

    const tenant = await resolveTenant()

    expect(tenant).not.toBeNull()
    expect(tenant!.userId).toBe(UUID)
    expect(tenant!.organizationId).toBe(ORG_UUID)
    expect(tenant!.orgRole).toBe('owner')
    expect(tenant!.db).toBeDefined()
  })

  it('accepts an org role claim with no org: prefix', async () => {
    signedIn({ claims: { internal_user_id: UUID }, orgId: 'org_abc', orgRole: 'staff' })
    stubAdmin({ organization: { id: ORG_UUID } })

    const tenant = await resolveTenant()

    expect(tenant!.orgRole).toBe('staff')
  })

  it('returns null for the retired admin role', async () => {
    signedIn({ claims: { internal_user_id: UUID }, orgId: 'org_abc', orgRole: 'org:admin' })
    stubAdmin({ organization: { id: ORG_UUID } })

    expect(await resolveTenant()).toBeNull()
  })
})
