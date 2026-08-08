'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { useSheets } from '@/context/sheet-host';
import { Card, Divided, Section } from '@/components/patterns/screen';
import { useDocumentCounts, useDocumentList } from '@/hooks/documents/useDocuments';
import DocumentRow from '@/components/documents/DocumentRow';

/**
 * Filter chips. `document_type` is org-defined — a `doc:{type}` counter is what
 * makes one legal — so these are the common shortcuts, not the whole set. An
 * org with a proforma counter still finds its proformas under All.
 */
const TABS = [
  { key: 'all', label: 'All', type: undefined },
  { key: 'quotation', label: 'Quotations', type: 'quotation' },
  { key: 'invoice', label: 'Invoices', type: 'invoice' },
  { key: 'receipt', label: 'Receipts', type: 'receipt' },
] as const;

/**
 * Documents (F1 on the Pencil canvas) — every quotation, invoice and receipt
 * the org has issued.
 *
 * The counterpart to the per-order documents list: an order answers "what has
 * this job produced", this answers "what is outstanding". Same polymorphic
 * engine, different question.
 *
 * Two deviations from the frame, both deliberate and both tracked in
 * APP_REDESIGN.md:
 *
 *   The summary's left figure is a **count**, where the frame shows a money
 *   total. Summing every live invoice means a bounded client-side fetch, which
 *   is the approximation Home already regrets; the exact figure waits for the
 *   metrics read layer.
 *
 *   There is no **New invoice** action. It opens F2, consolidating several
 *   orders into one invoice, which the schema cannot express until A3 lands.
 *   A signifier that isn't wired shouldn't be drawn, so the real create path —
 *   New order — carries the slot instead. Documents are issued *from* orders.
 */
export default function DocumentsPage() {
  const router = useRouter();
  const { openCreateOrder } = useSheets();
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const activeTab = TABS.find(t => t.key === tab) ?? TABS[0];

  const { documents, total, isLoading } = useDocumentList({
    document_type: activeTab.type,
    search: debouncedSearch || undefined,
    paid: '1',
  });
  const { unpaidCount, overdueCount } = useDocumentCounts();

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-5">
      <h1 className="text-[22px] font-semibold text-foreground">Documents</h1>

      <div className="mt-3.5 flex items-center rounded-2xl border border-border bg-card px-1 py-3.5">
        <Figure value={String(unpaidCount)} label="Unpaid invoices" tone="warning" />
        <div className="h-[38px] w-px bg-border" />
        <Figure
          value={String(overdueCount)}
          label="Overdue"
          tone={overdueCount > 0 ? 'danger' : 'plain'}
        />
      </div>

      <div className="mt-4 flex gap-[7px]">
        <button
          type="button"
          onClick={openCreateOrder}
          className="flex items-center gap-[7px] rounded-full bg-primary px-[11px] py-2.5 text-[13px] font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          New order
        </button>
      </div>

      <div className="mt-4 flex h-10 items-center gap-[9px] rounded-[10px] bg-muted px-3">
        <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <input
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Search document number"
          aria-label="Search document number"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="mt-3 flex gap-[7px] overflow-x-auto pb-1">
        {TABS.map(option => (
          <button
            key={option.key}
            type="button"
            onClick={() => setTab(option.key)}
            aria-pressed={tab === option.key}
            className={cn(
              'flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              tab === option.key
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-3.5">
        {isLoading && documents.length === 0 ? (
          <div className="space-y-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-16 animate-pulse rounded-2xl border border-border bg-card" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <EmptyState searching={debouncedSearch.length > 0} />
        ) : (
          <>
            <Card>
              <Divided>
                {documents.map(document => (
                  <DocumentRow
                    key={document.id}
                    document={document}
                    today={today}
                    onOpen={() => router.push(`/dashboard/documents/${document.id}`)}
                  />
                ))}
              </Divided>
            </Card>
            {total > documents.length && (
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Showing {documents.length} of {total}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Figure({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone: 'warning' | 'danger' | 'plain';
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-[3px]">
      <span
        className={cn(
          'text-[15.5px] font-bold',
          tone === 'warning' && 'text-warning',
          tone === 'danger' && 'text-destructive',
          tone === 'plain' && 'text-foreground',
        )}
      >
        {value}
      </span>
      <span className="text-[10.5px] font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

function EmptyState({ searching }: { searching: boolean }) {
  return (
    <Section label="">
      <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center">
        <FileText className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium text-foreground">
          {searching ? 'No documents match that number' : 'No documents yet'}
        </p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {searching
            ? 'Try a different number, or clear the search.'
            : 'Quotations and invoices appear here once you issue them from an order.'}
        </p>
      </div>
    </Section>
  );
}
