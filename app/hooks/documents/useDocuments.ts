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
  entity_id: string;
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

  const issueDocument = useCallback(
    async (input: Omit<DocumentIssueInput, 'entity_type' | 'entity_id'>) => {
      if (!entityId) throw new Error('Cannot issue a document without an entity id');
      if (entityType !== 'order') {
        throw new Error(`Documents can only be issued from orders, not ${entityType}`);
      }
      const { document } = await apiRequest<{ document: DocumentRecord }>(
        PLATFORM_API.DOCUMENTS,
        'POST',
        { ...input, entity_type: 'order', entity_id: entityId },
      );
      await mutate();
      return document;
    },
    [entityType, entityId, mutate],
  );

  return { documents: data?.documents ?? [], isLoading, error, issueDocument, mutate };
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
