import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import {
  handleApiError,
  handleSupabaseError,
  handleUnexpectedError,
} from '@/lib/api/error-handler';
import { documentIssueSchema } from '@/lib/api/validators';

const DOCUMENT_COLUMNS =
  'id, entity_type, entity_id, document_type, document_number, snapshot, ' +
  'status, currency, exchange_rate, amounts_include_tax, subtotal, ' +
  'discount_total, tax_total, total, valid_until, due_date, issued_at, ' +
  'related_document_id, created_by, created_at, updated_at';

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
 * POST /api/documents — issue a document from an order.
 *
 * One RPC does the whole thing: v2.issue_document() allocates the number,
 * resolves org settings, computes tax, freezes the snapshot and writes the
 * financials atomically. It replaces the old next_number()-then-insert
 * stand-in, which could no longer work anyway — documents.currency became
 * NOT NULL with no default, and computing the totals route-side would have
 * meant a second, drifting implementation of the ledger.
 *
 * It goes through the issue_document_as_org shim because the service-role
 * connection carries no JWT claims for current_org_id() to read; the org
 * comes from resolveTenant(), not the caller. Same arrangement as
 * create_order_as_org, and both retire together in Phase 2.
 *
 * The result is an ISSUED document, not a draft: numbered, immutable, and
 * for invoices subject to the one-live-invoice-per-order rule (void before
 * reissuing). PDF rendering is a separate concern by design — a slow render
 * can't fail an issue, and a template change can't alter an issued document.
 */
export async function POST(request: NextRequest) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const parsed = documentIssueSchema.safeParse(await request.json());
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten());
    }

    const { terms_days, validity_days } = parsed.data;
    const options: Record<string, number> = {};
    if (terms_days !== undefined) options.terms_days = terms_days;
    if (validity_days !== undefined) options.validity_days = validity_days;

    const { data: documentId, error: issueError } = await tenant.db.rpc(
      'issue_document_as_org',
      {
        p_org: tenant.organizationId,
        p_user: tenant.userId,
        p_order_id: parsed.data.entity_id,
        p_document_type: parsed.data.document_type,
        p_options: options,
      },
    );
    if (issueError) return handleSupabaseError(issueError);

    const { data, error } = await tenant.db
      .from('documents')
      .select(DOCUMENT_COLUMNS)
      .eq('id', documentId)
      .single();

    if (error) return handleSupabaseError(error);

    return NextResponse.json({ document: data }, { status: 201 });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
