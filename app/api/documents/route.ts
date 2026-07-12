import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import {
  handleApiError,
  handleSupabaseError,
  handleUnexpectedError,
} from '@/lib/api/error-handler';
import { documentCreateSchema } from '@/lib/api/validators';
import type { Json } from '@/types/supabase-v2';

const DOCUMENT_COLUMNS =
  'id, entity_type, entity_id, document_type, document_number, snapshot, ' +
  'status, valid_until, created_by, created_at, updated_at';

/**
 * GET /api/documents?entity_type=order&entity_id=<uuid> — documents for
 * one record via the polymorphic documents engine (same shape as notes).
 */
export async function GET(request: NextRequest) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const entityType = request.nextUrl.searchParams.get('entity_type');
    const entityId = request.nextUrl.searchParams.get('entity_id');
    if (!entityType || !entityId) {
      return handleApiError('VALIDATION_ERROR', 'entity_type and entity_id are required');
    }

    const { data, error } = await tenant.db
      .from('documents')
      .select(DOCUMENT_COLUMNS)
      .eq('organization_id', tenant.organizationId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) return handleSupabaseError(error);

    return NextResponse.json({ documents: data });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

/**
 * POST /api/documents — create a draft document.
 *
 * INTERIM: v2.issue_document() (the RPC that will atomically assign the
 * number, freeze the snapshot, and set status) does not exist yet — see
 * docs/v2-migration/orders-system-handoff.md §6/§12. Until it lands, this
 * route calls v2.next_number() and inserts as two separate steps, same
 * "explicitly-labeled stand-in" treatment as create_order_as_org. Risk is
 * limited to a skipped document_number on a mid-request crash — no
 * orphaned financial data, since documents don't drive order totals.
 * Replace with a single issue_document() call when it ships.
 */
export async function POST(request: NextRequest) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const parsed = documentCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten());
    }

    const { data: documentNumber, error: numberError } = await tenant.db.rpc('next_number', {
      p_counter_key: `document:${parsed.data.document_type}`,
      p_org: tenant.organizationId,
    });
    if (numberError) return handleSupabaseError(numberError);

    const { data, error } = await tenant.db
      .from('documents')
      .insert({
        ...parsed.data,
        document_number: documentNumber,
        organization_id: tenant.organizationId,
        created_by: tenant.userId,
        status: 'draft',
        snapshot: (parsed.data.snapshot ?? {}) as Json,
      })
      .select(DOCUMENT_COLUMNS)
      .single();

    if (error) return handleSupabaseError(error);

    return NextResponse.json({ document: data }, { status: 201 });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
