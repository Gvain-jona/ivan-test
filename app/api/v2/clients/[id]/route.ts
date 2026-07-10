import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import {
  handleApiError,
  handleSupabaseError,
  handleUnexpectedError,
} from '@/lib/api/error-handler';
import { clientUpdateSchema } from '@/lib/api/validators';

const CLIENT_COLUMNS = 'id, name, status, custom_data, created_at, updated_at';

/**
 * GET /api/v2/clients/[id]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { id } = await params;

    const { data, error } = await tenant.db
      .from('clients')
      .select(CLIENT_COLUMNS)
      .eq('id', id)
      .eq('organization_id', tenant.organizationId)
      .maybeSingle();

    if (error) return handleSupabaseError(error);
    if (!data) return handleApiError('NOT_FOUND', 'Client not found');

    return NextResponse.json({ client: data });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

/**
 * PATCH /api/v2/clients/[id] — update name/status/custom_data.
 * Archiving IS the delete path (status: 'archived'); no DELETE handler
 * by design — v2 never hard-deletes business records.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { id } = await params;

    const parsed = clientUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten());
    }

    const { data, error } = await tenant.db
      .from('clients')
      .update(parsed.data)
      .eq('id', id)
      .eq('organization_id', tenant.organizationId)
      .select(CLIENT_COLUMNS)
      .maybeSingle();

    if (error) return handleSupabaseError(error);
    if (!data) return handleApiError('NOT_FOUND', 'Client not found');

    return NextResponse.json({ client: data });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
