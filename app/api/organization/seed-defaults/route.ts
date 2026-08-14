import { NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import { handleApiError, handleUnexpectedError } from '@/lib/api/error-handler';
import { createV2AdminClient } from '@/utils/supabase/server-v2';
import { seedOrgDefaults } from '@/lib/onboarding/seed-defaults';

/**
 * POST /api/organization/seed-defaults — ensure the org's starter
 * field_definitions exist (owner only).
 *
 * The baseline is normally seeded at provisioning (the Clerk webhook). This is
 * the safety net the wizard calls on A1 completion, for the org whose
 * organization.created event arrived out of order, was retried, or predates the
 * webhook seed entirely. Idempotent — seedOrgDefaults ignores conflicts — so
 * calling it on every A1 save costs at most one no-op upsert.
 */
export async function POST() {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');
    if (tenant.orgRole === 'staff') {
      return handleApiError('FORBIDDEN', 'Only owners can set up the organization');
    }

    await seedOrgDefaults(createV2AdminClient(), tenant.organizationId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
