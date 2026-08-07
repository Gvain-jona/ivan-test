import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import type { TenantDb } from '@/lib/auth/tenant';
import {
  handleApiError,
  handleSupabaseError,
  handleUnexpectedError,
} from '@/lib/api/error-handler';
import { documentIssueSchema, listQuerySchema } from '@/lib/api/validators';

const DOCUMENT_COLUMNS =
  'id, entity_type, entity_id, document_type, document_number, snapshot, ' +
  'status, currency, exchange_rate, amounts_include_tax, subtotal, ' +
  'discount_total, tax_total, total, valid_until, due_date, issued_at, ' +
  'related_document_id, created_by, created_at, updated_at';

/**
 * GET /api/documents — the org's documents, newest first.
 *
 * Two shapes, one route:
 *   ?entity_type=order&entity_id=<uuid>  one record's documents (the
 *                                        polymorphic read, same as notes)
 *   ?document_type=invoice&status=issued the org-wide ledger
 *
 * The entity pair was mandatory until 2026-08-07, which meant there was no
 * way to ask "what has this org issued" at all — a documents surface needs
 * exactly that. Both parts of the pair are still required *together*: an
 * entity_id without its type is not a narrower query, it's an ambiguous one.
 *
 * document_type and status take comma-separated lists (multi-select filters),
 * matching /api/orders. Neither is validated against a fixed set on purpose —
 * legal document types are org-defined (a `doc:{type}` counter is what makes
 * one legal), so an unknown value should return nothing, not 400.
 *
 * `search` matches document_number only. The design also offers search by
 * client, which can't be served from here: entity_id is polymorphic with no
 * FK to join through, and the client name lives inside the frozen `snapshot`
 * whose shape is DB-owned and unverified. Resolving that belongs with the
 * documents surface, once the snapshot shape is confirmed.
 */
type DocumentQuery = ReturnType<ReturnType<TenantDb['from']>['select']>;

/** Narrows a documents query by whatever the caller asked for. */
function applyDocumentFilters(query: DocumentQuery, params: URLSearchParams): DocumentQuery {
  const entityType = params.get('entity_type');
  const entityId = params.get('entity_id');
  const documentType = params.get('document_type');
  const status = params.get('status');
  const search = params.get('search');

  let next = query;
  if (entityType && entityId) next = next.eq('entity_type', entityType).eq('entity_id', entityId);
  if (documentType) next = next.in('document_type', documentType.split(','));
  if (status) next = next.in('status', status.split(','));
  if (search) next = next.ilike('document_number', `%${search}%`);
  return next;
}

export async function GET(request: NextRequest) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const params = request.nextUrl.searchParams;
    if (Boolean(params.get('entity_type')) !== Boolean(params.get('entity_id'))) {
      return handleApiError(
        'VALIDATION_ERROR',
        'entity_type and entity_id must be given together',
      );
    }

    const paging = listQuerySchema.parse({
      limit: params.get('limit') ?? undefined,
      offset: params.get('offset') ?? undefined,
    });

    const { data, error, count } = await applyDocumentFilters(
      tenant.db
        .from('documents')
        .select(DOCUMENT_COLUMNS, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(paging.offset, paging.offset + paging.limit - 1),
      params,
    );

    if (error) return handleSupabaseError(error);

    return NextResponse.json({ documents: data, total: count ?? 0 });
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
