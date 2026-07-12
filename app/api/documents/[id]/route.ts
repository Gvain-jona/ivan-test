import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import {
  handleApiError,
  handleSupabaseError,
  handleUnexpectedError,
} from '@/lib/api/error-handler';
import { documentUpdateSchema } from '@/lib/api/validators';

const DOCUMENT_COLUMNS =
  'id, entity_type, entity_id, document_type, document_number, snapshot, ' +
  'status, valid_until, created_by, created_at, updated_at';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { id } = await params;

    const { data, error } = await tenant.db
      .from('documents')
      .select(DOCUMENT_COLUMNS)
      .eq('id', id)
      .eq('organization_id', tenant.organizationId)
      .maybeSingle();

    if (error) return handleSupabaseError(error);
    if (!data) return handleApiError('NOT_FOUND', 'Document not found');

    return NextResponse.json({ document: data });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

/**
 * PATCH /api/documents/[id] — draft-only in practice: once status leaves
 * 'draft' (sent/accepted/issued), v2.protect_issued_documents rejects any
 * snapshot write regardless of what this route sends. Status transitions
 * beyond draft are otherwise unrestricted here pending the real
 * issue_document() orchestration (numbering is already final by then).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { id } = await params;

    const parsed = documentUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten());
    }

    const { data, error } = await tenant.db
      .from('documents')
      .update(parsed.data)
      .eq('id', id)
      .eq('organization_id', tenant.organizationId)
      .select(DOCUMENT_COLUMNS)
      .maybeSingle();

    if (error) return handleSupabaseError(error);
    if (!data) return handleApiError('NOT_FOUND', 'Document not found');

    return NextResponse.json({ document: data });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
