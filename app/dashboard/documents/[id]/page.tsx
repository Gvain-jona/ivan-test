'use client';

import { use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { PLATFORM_API, apiFetcher } from '@/lib/api/client';
import { SWR_CACHE_TIMES } from '@/lib/swr-config';
import { ScreenHeader, ScreenFooter } from '@/components/patterns/screen';
import DocumentPaper from '@/components/documents/DocumentPaper';
import DocumentActions from '@/components/documents/DocumentActions';
import { readSnapshot } from '@/lib/documents/snapshot';
import { describeDocumentState } from '@/lib/documents/document-state';
import { useDeferredLoading } from '@/hooks/useDeferredLoading';
import type { DocumentListRecord } from '@/hooks/documents/useDocuments';

/**
 * One document, as the customer would see it (B9 on the Pencil canvas).
 *
 * Rendered entirely from the frozen snapshot — see lib/documents/snapshot. The
 * live order has moved on; this is what was agreed.
 *
 * **The footer action is Print, where the frame says "Send to client".** There
 * is no mail integration, and STATE.md is explicit that PDF rendering belongs
 * to a worker built from the snapshot, which doesn't exist — so the header's
 * download affordance is omitted too. A signifier that isn't wired shouldn't be
 * drawn. Print is a real capability the browser already gives us, and for a
 * paper document it's the closest honest equivalent; the print stylesheet drops
 * the app chrome so only the paper reaches the page.
 */
export default function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data, isLoading } = useSWR<{ document: DocumentListRecord }>(
    `${PLATFORM_API.DOCUMENTS}/${id}`,
    apiFetcher,
    { dedupingInterval: SWR_CACHE_TIMES.DETAIL_DEDUPE },
  );

  const document = data?.document;
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const snapshot = useMemo(
    () =>
      document
        ? readSnapshot(document.snapshot, {
            documentNumber: document.document_number,
            documentType: document.document_type,
          })
        : null,
    [document],
  );

  /**
   * Bound to the currency the document froze, not the org's current one — an
   * org that changes currency must not restate an old invoice in a new one.
   */
  const formatMoney = useMemo(() => {
    const currency = snapshot?.currency;
    const base = { minimumFractionDigits: 0, maximumFractionDigits: 0 } as const;
    const formatter = new Intl.NumberFormat(
      undefined,
      currency ? { style: 'currency', currency, ...base } : base,
    );
    return (value: number) => formatter.format(Number.isFinite(value) ? value : 0);
  }, [snapshot?.currency]);

  // A document is a single sheet of paper, so the tall block is already its
  // real shape; the deferred guard just keeps it from flashing on a warm cache.
  const loading = isLoading || !document || !snapshot;
  const showSkeleton = useDeferredLoading(loading);
  if (loading) {
    return showSkeleton ? (
      <div className="mx-auto w-full max-w-lg px-4 py-6">
        <div className="h-[520px] animate-pulse rounded-[14px] border border-border bg-card" />
      </div>
    ) : null;
  }

  const amountPaid = document.amount_paid ?? 0;
  const state = describeDocumentState(document, today);
  const balance = Number(document.total ?? 0) - amountPaid;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-background">
      <div className="print:hidden">
        <ScreenHeader
          title={snapshot.documentNumber}
          onBack={() => router.back()}
          action={<DocumentActions document={document} />}
        />
      </div>

      <div className="flex-1 p-4 print:p-0">
        <DocumentPaper
          snapshot={snapshot}
          amountPaid={amountPaid}
          formatMoney={formatMoney}
        />
      </div>

      <div className="print:hidden">
        <ScreenFooter
          figureLabel={state.label.toUpperCase()}
          figureValue={formatMoney(balance > 0 ? balance : Number(document.total ?? 0))}
          actionLabel="Print"
          onAction={() => window.print()}
        />
      </div>
    </div>
  );
}
