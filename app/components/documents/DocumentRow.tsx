'use client';

import { cn, formatDate } from '@/lib/utils';
import { useFormatCurrency } from '@/hooks/organization/useFormatCurrency';
import { documentClientName, type DocumentListRecord } from '@/hooks/documents/useDocuments';

/**
 * What a document's state is, in the reader's terms rather than the column's.
 *
 * `status` says where a document sits in its own lifecycle; someone scanning a
 * list wants to know whether it needs them. "Due 21 Aug" and "Overdue 6 days"
 * are both `status: 'issued'` — the difference is the date, so it can't come
 * from the column alone.
 */
export function describeState(document: DocumentListRecord, today: string) {
  const { status, due_date: dueDate, valid_until: validUntil } = document;
  const paid = document.amount_paid ?? 0;
  const total = Number(document.total ?? 0);

  if (status === 'void') return { label: 'Void', tone: 'muted' as const };
  if (status === 'declined') return { label: 'Declined', tone: 'danger' as const };
  if (status === 'expired') return { label: 'Expired', tone: 'muted' as const };
  if (status === 'accepted') return { label: 'Accepted', tone: 'good' as const };
  if (status === 'draft') return { label: 'Draft', tone: 'muted' as const };

  if (total > 0 && paid >= total) return { label: 'Paid', tone: 'good' as const };

  if (dueDate && dueDate < today) {
    const days = Math.round((Date.parse(today) - Date.parse(dueDate)) / 86_400_000);
    return { label: `Overdue ${days} ${days === 1 ? 'day' : 'days'}`, tone: 'danger' as const };
  }
  if (dueDate) return { label: `Due ${formatDate(dueDate)}`, tone: 'muted' as const };
  if (validUntil) return { label: `Valid to ${formatDate(validUntil)}`, tone: 'muted' as const };

  return { label: status === 'sent' ? 'Sent' : 'Issued', tone: 'muted' as const };
}

const TONE = {
  muted: 'text-muted-foreground',
  good: 'text-success',
  danger: 'text-destructive',
} as const;

/**
 * One document row. The money slot carries the total and, when anything is
 * still owed, the outstanding amount after it — the balance is the number a
 * shop owner is actually scanning for.
 */
export default function DocumentRow({
  document,
  today,
  onOpen,
}: {
  document: DocumentListRecord;
  today: string;
  onOpen?: () => void;
}) {
  const fmt = useFormatCurrency();
  const state = describeState(document, today);
  const total = Number(document.total ?? 0);
  const outstanding = total - (document.amount_paid ?? 0);
  const showsBalance = outstanding > 0 && (document.amount_paid ?? 0) > 0;

  const body = (
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-foreground">
          {document.document_number}
        </span>
        <span className="flex flex-shrink-0 items-center gap-1.5">
          <span className="text-[13.5px] font-medium text-foreground">{fmt(total)}</span>
          {showsBalance && (
            <>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-[11.5px] font-semibold text-warning">{fmt(outstanding)}</span>
            </>
          )}
        </span>
      </div>
      <div className="mt-0.5 flex items-center justify-between gap-2">
        <span className="truncate text-[11px] text-muted-foreground">
          {[documentClientName(document), formatDate(document.issued_at ?? document.created_at)]
            .filter(Boolean)
            .join(' · ')}
        </span>
        <span className={cn('flex-shrink-0 text-[11px] font-medium', TONE[state.tone])}>
          {state.label}
        </span>
      </div>
    </div>
  );

  if (!onOpen) return <div className="flex px-3.5 py-[11px]">{body}</div>;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full px-3.5 py-[11px] text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      {body}
    </button>
  );
}
