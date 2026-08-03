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
  'status, currency, exchange_rate, amounts_include_tax, subtotal, ' +
  'discount_total, tax_total, total, valid_until, due_date, issued_at, ' +
  'related_document_id, created_by, created_at, updated_at';

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
      .maybeSingle();

    if (error) return handleSupabaseError(error);
    if (!data) return handleApiError('NOT_FOUND', 'Document not found');

    return NextResponse.json({ document: data });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

/**
 * PATCH /api/documents/[id] — status transitions and, on a draft, the
 * snapshot.
 *
 * Documents now arrive issued (POST calls v2.issue_document), so in practice
 * this moves status onward — sent, accepted, declined, void. The DB is the
 * backstop: v2.protect_issued_documents rejects any change to the snapshot,
 * the financial columns or the number once status is sent/accepted/issued,
 * whatever this route sends. Correcting an issued document means a credit
 * note, not an edit.
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
      .select(DOCUMENT_COLUMNS)
      .maybeSingle();

    if (error) return handleSupabaseError(error);
    if (!data) return handleApiError('NOT_FOUND', 'Document not found');

    return NextResponse.json({ document: data });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
