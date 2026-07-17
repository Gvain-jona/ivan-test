import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveTenant } from './tenant'
import { auth } from '@clerk/nextjs/server'
import { createV2AdminClient } from '@/utils/supabase/server-v2'

/**
 * Unit tests for the Clerk identity step of resolveTenant(): who
 * resolves to a tenant and who doesn't. The membership/active-org
 * lookup runs against a stub admin client.
 */

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
vi.mock('@/utils/supabase/server-v2', () => ({ createV2AdminClient: vi.fn() }))

const authMock = vi.mocked(auth)
const adminMock = vi.mocked(createV2AdminClient)

const UUID = '11111111-2222-3333-4444-555555555555'

function stubAdmin({
  settings = null,
  memberships = [],
  membershipsError = null,
}: {
  settings?: { active_organization_id: string } | null
  memberships?: { organization_id: string; role: string }[]
  membershipsError?: { message: string } | null
} = {}) {
  const client = {
    from: vi.fn((table: string) => {
      if (table === 'user_settings') {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: settings, error: null }) }),
          }),
        }
      }
      if (table === 'organization_members') {
        return {
          select: () => ({
            eq: async () => ({ data: membershipsError ? null : memberships, error: membershipsError }),
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function signedIn(claims: Record<string, unknown> | null) {
  authMock.mockResolvedValue({ userId: 'user_clerk123', sessionClaims: claims } as any)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('resolveTenant', () => {
  it('returns null when there is no Clerk session', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    authMock.mockResolvedValue({ userId: null, sessionClaims: null } as any)
    expect(await resolveTenant()).toBeNull()
  })

  it('returns null for a signed-in user without the internal_user_id claim (unprovisioned)', async () => {
    signedIn({})
    stubAdmin()
    expect(await resolveTenant()).toBeNull()
    expect(adminMock).not.toHaveBeenCalled()
  })

  it('returns null when the claim is not a UUID (e.g. a raw Clerk id)', async () => {
    signedIn({ internal_user_id: 'user_clerk123' })
    stubAdmin()
    expect(await resolveTenant()).toBeNull()
    expect(adminMock).not.toHaveBeenCalled()
  })

  it('returns null when the user has no memberships', async () => {
    signedIn({ internal_user_id: UUID })
    stubAdmin({ memberships: [] })
    expect(await resolveTenant()).toBeNull()
  })

  it('resolves the tenant with the internal UUID as userId', async () => {
    signedIn({ internal_user_id: UUID })
    stubAdmin({ memberships: [{ organization_id: 'org-1', role: 'owner' }] })

    const tenant = await resolveTenant()

    expect(tenant).not.toBeNull()
    expect(tenant!.userId).toBe(UUID)
    expect(tenant!.organizationId).toBe('org-1')
    expect(tenant!.orgRole).toBe('owner')
    expect(tenant!.db).toBeDefined()
  })

  it('prefers the active organization from user_settings when it matches a membership', async () => {
    signedIn({ internal_user_id: UUID })
    stubAdmin({
      settings: { active_organization_id: 'org-2' },
      memberships: [
        { organization_id: 'org-1', role: 'owner' },
        { organization_id: 'org-2', role: 'staff' },
      ],
    })

    const tenant = await resolveTenant()

    expect(tenant!.organizationId).toBe('org-2')
    expect(tenant!.orgRole).toBe('staff')
  })

  it('falls back to the first membership when active org does not match', async () => {
    signedIn({ internal_user_id: UUID })
    stubAdmin({
      settings: { active_organization_id: 'org-gone' },
      memberships: [{ organization_id: 'org-1', role: 'admin' }],
    })

    const tenant = await resolveTenant()

    expect(tenant!.organizationId).toBe('org-1')
  })

  it('returns null when the membership query errors', async () => {
    signedIn({ internal_user_id: UUID })
    stubAdmin({ membershipsError: { message: 'boom' } })
    expect(await resolveTenant()).toBeNull()
  })
})
