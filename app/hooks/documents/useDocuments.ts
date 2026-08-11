'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import { SWR_CACHE_TIMES } from '@/lib/swr-config';
import { PLATFORM_API, buildKey, apiFetcher, apiRequest, keysUnder } from '@/lib/api/client';
import { mutate as globalMutate } from 'swr';
import type { DatabaseV2 } from '@/types/supabase-v2';

type DocumentRow = DatabaseV2['v2']['Tables']['documents']['Row'];

export type DocumentRecord = Omit<DocumentRow, 'organization_id'>;

export type DocumentEntityType = 'order' | 'expense' | 'client';
export type DocumentType = 'quotation' | 'proforma' | 'invoice' | 'receipt' | 'po';
export type DocumentStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'issued'
  | 'void';

export interface DocumentIssueInput {
  entity_type: 'order';
  /**
   * The orders the document covers — an array since A3a/A3b, because one
   * invoice may cover several. The DB decides the document's own
   * `entity_type` from the count: one order files under `'order'`, several
   * under `'client'` with the covered orders frozen in the snapshot.
   */
  entity_ids: string[];
  document_type: DocumentType;
  /** Overrides settings.documents.terms_days for this invoice only. */
  terms_days?: number;
  /** Overrides settings.documents.quote_validity_days for this quotation. */
  validity_days?: number;
}

/**
 * Documents for one record via the polymorphic documents engine. Pass
 * null ids to pause fetching (e.g. while a sheet is closed).
 *
 * Reading is polymorphic; issuing is not. `issueDocument` is only present
 * for orders, because v2.issue_document() only knows how to freeze an
 * order — receipts arrive with the payments cutover.
 */
export function useDocuments(entityType: DocumentEntityType, entityId: string | null | undefined) {
  const key = entityId
    ? buildKey(PLATFORM_API.DOCUMENTS, { entity_type: entityType, entity_id: entityId })
    : null;

  const { data, error, isLoading, mutate } = useSWR<{ documents: DocumentRecord[] }>(
    key,
    apiFetcher,
    { dedupingInterval: SWR_CACHE_TIMES.DETAIL_DEDUPE },
  );

  /**
   * Issue a document covering this one order.
   *
   * Sends `entity_ids: [id]`. It sent `entity_id` (singular) until 2026-08-10,
   * which `documentIssueSchema` stopped accepting when A3a/A3b made an invoice
   * able to cover several orders — zod stripped the unknown key, the required
   * one was then missing, and every issue attempt 400'd. The route's own tests
   * post `entity_ids` directly, so nothing between hook and schema caught it.
   * `issueDocuments` below is the same call for the multi-order case (F2).
   */
  const issueDocument = useCallback(
    async (input: Omit<DocumentIssueInput, 'entity_type' | 'entity_ids'>) => {
      if (!entityId) throw new Error('Cannot issue a document without an entity id');
      if (entityType !== 'order') {
        throw new Error(`Documents can only be issued from orders, not ${entityType}`);
      }
      const { document } = await apiRequest<{ document: DocumentRecord }>(
        PLATFORM_API.DOCUMENTS,
        'POST',
        { ...input, entity_type: 'order', entity_ids: [entityId] },
      );
      await mutate();
      return document;
    },
    [entityType, entityId, mutate],
  );

  return { documents: data?.documents ?? [], isLoading, error, issueDocument, mutate };
}

/**
 * A document as a list shows it. `client` comes from the frozen snapshot;
 * `amount_paid` cannot — the snapshot is taken at issue, before any money
 * arrives — so the route derives it from payment_allocations.
 */
export type DocumentListRecord = DocumentRecord & {
  amount_paid?: number;
};

/** The client the document was issued to, as frozen into its snapshot. */
export function documentClientName(document: DocumentRecord): string | null {
  const snapshot = document.snapshot as { recipient?: { name?: unknown } } | null;
  const name = snapshot?.recipient?.name;
  return typeof name === 'string' && name !== '' ? name : null;
}

// A type alias, not an interface, so it satisfies buildKey's index-signature
// parameter — same reason OrderListParams is declared this way.
export type DocumentListParams = {
  /** Single value or comma-separated list (multi-select filters). */
  document_type?: string;
  status?: string;
  /** Matches document_number only — see the route for why not client. */
  search?: string;
  /** YYYY-MM-DD. Past their terms, i.e. overdue. */
  due_before?: string;
  /** '1' attaches amount_paid per document. */
  paid?: string;
  limit?: number;
  offset?: number;
};

/**
 * The org's documents, across every record — what a documents surface lists,
 * as opposed to `useDocuments`, which answers "what has *this* order got".
 */
export function useDocumentList(params: DocumentListParams = {}) {
  const key = buildKey(PLATFORM_API.DOCUMENTS, params);
  const { data, error, isLoading, mutate } = useSWR<{
    documents: DocumentListRecord[];
    total: number;
  }>(key, apiFetcher, { dedupingInterval: SWR_CACHE_TIMES.LIST_DEDUPE });

  return {
    documents: data?.documents ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}

/**
 * The two figures the documents header shows.
 *
 * Counts, not sums. `count: 'exact'` is a real answer to "how many"; a money
 * total would mean summing every live invoice client-side, which is the
 * bounded-fetch approximation Home already regrets (see STATE.md). The money
 * figure the frame shows waits for the metrics read layer.
 */
export function useDocumentCounts() {
  const today = new Date().toISOString().slice(0, 10);
  const live = 'issued,sent';

  const unpaid = useDocumentList({ document_type: 'invoice', status: live, limit: 1 });
  const overdue = useDocumentList({
    document_type: 'invoice',
    status: live,
    due_before: today,
    limit: 1,
  });

  return {
    unpaidCount: unpaid.total,
    overdueCount: overdue.total,
    isLoading: unpaid.isLoading || overdue.isLoading,
  };
}

export function useDocumentMutations() {
  const updateDocument = useCallback(
    async (id: string, input: Partial<Pick<DocumentRecord, 'status' | 'snapshot' | 'valid_until'>>) => {
      const { document } = await apiRequest<{ document: DocumentRecord }>(
        `${PLATFORM_API.DOCUMENTS}/${id}`,
        'PATCH',
        input,
      );
      await globalMutate(keysUnder(PLATFORM_API.DOCUMENTS));
      return document;
    },
    [],
  );

  return { updateDocument };
}
