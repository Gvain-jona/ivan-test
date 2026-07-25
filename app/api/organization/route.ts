import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import {
  handleApiError,
  handleSupabaseError,
  handleUnexpectedError,
} from '@/lib/api/error-handler';
import { organizationSettingsPatchSchema } from '@/lib/api/validators';
import type { Json } from '@/types/supabase-v2';

const ORG_COLUMNS = 'id, name, slug, status, settings';

/**
 * GET /api/organization — the caller's active org: name, slug, and
 * settings (currency, locale, document formats). Org-level scalar
 * config lives in settings; order status values live in
 * field_definitions, not here.
 */
export async function GET() {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { data, error } = await tenant.db
      .organization()
      .select(ORG_COLUMNS)
      .single();

    if (error) return handleSupabaseError(error);

    return NextResponse.json({ organization: data, orgRole: tenant.orgRole });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

/**
 * PATCH /api/organization — update org-level scalar settings (currency,
 * locale). Owner only: these are org-wide config. The patch is MERGED
 * into the existing settings jsonb so updating one key never drops the
 * others. Owner-edited + low-concurrency, so a read-modify-write is
 * acceptable here (no atomic jsonb merge needed).
 */
export async function PATCH(request: NextRequest) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');
    if (tenant.orgRole === 'staff') {
      return handleApiError('FORBIDDEN', 'Only owners can change organization settings');
    }

    const parsed = organizationSettingsPatchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten());
    }

    const { data: current, error: readError } = await tenant.db
      .organization()
      .select('settings')
      .single();
    if (readError) return handleSupabaseError(readError);

    const merged = {
      ...((current?.settings as Record<string, unknown> | null) ?? {}),
      ...parsed.data,
    };

    const { data, error } = await tenant.db
      .organization()
      .update({ settings: merged as Json })
      .select(ORG_COLUMNS)
      .single();

    if (error) return handleSupabaseError(error);

    return NextResponse.json({ organization: data });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
