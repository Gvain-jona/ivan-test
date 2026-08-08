/**
 * What a document's state is, in the reader's terms rather than the column's.
 *
 * `status` says where a document sits in its own lifecycle. Someone scanning a
 * list wants to know whether it needs them, and that isn't the same question:
 * "Due 21 Aug" and "Overdue 6 days" are both `status: 'issued'`, and "Paid" is
 * too. The difference is the date and the money, so no single column answers
 * it.
 *
 * Extracted from the row so the ladder can be tested directly — an off-by-one
 * on the overdue count or a paid invoice still showing a due date is exactly
 * the kind of thing that looks fine until a customer reads it.
 */

export type DocumentTone = 'muted' | 'good' | 'danger';

export interface DocumentStateInput {
  status: string;
  due_date?: string | null;
  valid_until?: string | null;
  total?: number | null;
  amount_paid?: number | null;
}

export interface DocumentState {
  tone: DocumentTone;
  /** Complete on its own unless `date` is set, in which case it's the prefix. */
  label: string;
  /** ISO date the caller formats and appends — date formatting is a rendering
   *  concern and keeping it out is what makes this testable without a locale. */
  date?: string;
}

/** `today` is passed in rather than read, so the ladder stays pure. */
export function describeDocumentState(
  document: DocumentStateInput,
  today: string,
): DocumentState {
  // Terminal states first: none of them care about dates or money.
  switch (document.status) {
    case 'void':
      return { label: 'Void', tone: 'muted' };
    case 'declined':
      return { label: 'Declined', tone: 'danger' };
    case 'expired':
      return { label: 'Expired', tone: 'muted' };
    case 'accepted':
      return { label: 'Accepted', tone: 'good' };
    case 'draft':
      return { label: 'Draft', tone: 'muted' };
    default:
      break;
  }

  // Settled outranks the due date: a paid invoice is not "due" anything.
  const total = Number(document.total ?? 0);
  const paid = Number(document.amount_paid ?? 0);
  if (total > 0 && paid >= total) return { label: 'Paid', tone: 'good' };

  const dueDate = document.due_date;
  if (dueDate && dueDate < today) {
    const days = Math.round((Date.parse(today) - Date.parse(dueDate)) / 86_400_000);
    return { label: `Overdue ${days} ${days === 1 ? 'day' : 'days'}`, tone: 'danger' };
  }
  if (dueDate) return { label: 'Due', tone: 'muted', date: dueDate };

  // Quotations carry a validity instead of terms.
  if (document.valid_until) {
    return { label: 'Valid to', tone: 'muted', date: document.valid_until };
  }

  return { label: document.status === 'sent' ? 'Sent' : 'Issued', tone: 'muted' };
}
