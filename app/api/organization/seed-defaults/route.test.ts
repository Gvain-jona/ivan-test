import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import { createFakeTenant } from '@/test/helpers/fake-tenant';
import { resolveTenant } from '@/lib/auth/tenant';
import { createV2AdminClient } from '@/utils/supabase/server-v2';

vi.mock('@/lib/auth/tenant', () => ({ resolveTenant: vi.fn() }));
const resolveTenantMock = vi.mocked(resolveTenant);

vi.mock('@/utils/supabase/server-v2', () => ({ createV2AdminClient: vi.fn() }));
const adminMock = vi.mocked(createV2AdminClient);

/** An admin client whose field_definitions upsert resolves with `result`. */
function fakeAdmin(result: { error: unknown } = { error: null }) {
  const upsert = vi.fn().mockResolvedValue(result);
  const from = vi.fn().mockReturnValue({ upsert });
  adminMock.mockReturnValue({ from } as never);
  return { from, upsert };
}

beforeEach(() => {
  resolveTenantMock.mockReset();
  adminMock.mockReset();
});

describe('POST /api/organization/seed-defaults', () => {
  it('rejects unauthenticated callers with 401', async () => {
    resolveTenantMock.mockResolvedValue(null);
    expect((await POST()).status).toBe(401);
  });

  it('forbids staff (403) and writes nothing', async () => {
    const { tenant } = createFakeTenant({ orgRole: 'staff' });
    resolveTenantMock.mockResolvedValue(tenant);
    const admin = fakeAdmin();

    expect((await POST()).status).toBe(403);
    expect(admin.upsert).not.toHaveBeenCalled();
  });

  it('seeds the org, scoped to its id and idempotent on conflict', async () => {
    const { tenant } = createFakeTenant({ orgRole: 'owner', organizationId: 'org-seed-1' });
    resolveTenantMock.mockResolvedValue(tenant);
    const admin = fakeAdmin();

    const res = await POST();

    expect(res.status).toBe(200);
    expect(admin.from).toHaveBeenCalledWith('field_definitions');
    const [rows, options] = admin.upsert.mock.calls[0];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r: { organization_id: string }) => r.organization_id === 'org-seed-1')).toBe(
      true,
    );
    expect(options).toMatchObject({
      onConflict: 'organization_id,entity,field_name',
      ignoreDuplicates: true,
    });
  });

  it('surfaces a seed failure as 500', async () => {
    const { tenant } = createFakeTenant({ orgRole: 'owner' });
    resolveTenantMock.mockResolvedValue(tenant);
    fakeAdmin({ error: { message: 'boom' } });

    expect((await POST()).status).toBe(500);
  });
});
