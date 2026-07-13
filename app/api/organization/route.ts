import { NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import {
  handleApiError,
  handleSupabaseError,
  handleUnexpectedError,
} from '@/lib/api/error-handler';

/**
 * GET /api/organization — the caller's active org: name, slug, and
 * settings (order_statuses, currency, locale, document formats). The
 * UI reads order_statuses from here instead of a hardcoded enum —
 * statuses are org-configurable in v2.
 */
export async function GET() {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { data, error } = await tenant.db
      .organization()
      .select('id, name, slug, status, settings')
      .single();

    if (error) return handleSupabaseError(error);

    return NextResponse.json({ organization: data, orgRole: tenant.orgRole });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
