'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { describeDocumentState } from '@/lib/documents/document-state';
import { Card, Divided, ScreenFooter, Section } from '@/components/patterns/screen';
import { ChoiceChip, ListRow } from '@/components/patterns/controls';
import { SummaryPanel, SummaryRow, SummaryRule } from '@/components/patterns/summary';
import { ScreenFields } from '@/components/fields/ScreenFields';
import { EmptyLine, methodLabel, NoteCard } from '@/components/orders/new-order/parts';
import { useDeferredLoading } from '@/hooks/useDeferredLoading';
import { RecordSkeleton } from '@/components/skeletons';
import { RecordError } from '@/components/patterns/RecordError';
import { useOrderHub } from './useOrderHub';
import { HubHeader } from './HubHeader';
import { HubSheets, type OpenSheet } from './HubSheets';
import { documentLabel } from './document-label';
import { useFieldDefinitions } from '@/hooks/fields/useFieldDefinitions';
import { useOrderStatuses } from '@/hooks/orders/useOrderStatuses';
import { useFormatCurrency } from '@/hooks/organization/useFormatCurrency';
import { optionColorClasses } from '@/lib/fields/colors';
import { discountLabel, lineTotal, type DraftItem } from '@/lib/orders/draft';

/**
 * One order — B4 on the canvas.
 *
 * A single scrolling surface with sections, replacing `OrderViewSheet` and its
 * five tabs. The tabs were the thing worth removing: an order is one object,
 * and finding out whether it was paid should not mean remembering which tab
 * that lived behind.
 *
 * Every action writes immediately — there is no Save. `useOrderHub` refetches
 * after each one so the figures are the DB's, never this screen's arithmetic.
 */
export default function OrderHubScreen({ id }: { id: string }) {
  const router = useRouter();
  const fmt = useFormatCurrency();
  const hub = useOrderHub(id);
  const { statuses } = useOrderStatuses();
  const { fieldDefinitions: orderFields } = useFieldDefinitions('order');
  const { fieldDefinitions: noteFields } = useFieldDefinitions('note');

  const [sheet, setSheet] = useState<OpenSheet>(null);
  const [editingItem, setEditingItem] = useState<DraftItem | null>(null);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Direct condition (not an alias) so TS narrows `hub.order` to non-null below.
  // Nothing for the first ~200ms (warm cache resolves inside it), then the
  // record-shaped skeleton if the wait is real.
  const showSkeleton = useDeferredLoading(hub.isLoading || !hub.order);
  if (hub.error && !hub.order) {
    return (
      <RecordError
        noun="order"
        error={hub.error}
        onBack={() => router.back()}
        onRetry={() => hub.refresh()}
      />
    );
  }
  if (hub.isLoading || !hub.order) {
    return showSkeleton ? <RecordSkeleton /> : null;
  }

  const { order, items, payments, notes, documents, discount } = hub;

  const openItem = (item: DraftItem | null) => {
    setEditingItem(item);
    setSheet('item');
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-background">
      <HubHeader order={order} onBack={() => router.back()} fields={orderFields} />

      <div className="flex flex-1 flex-col gap-[22px] px-4 py-4">
        {statuses.length > 0 && (
          <Section label="STATUS">
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Status">
              {statuses.map(option => (
                <ChoiceChip
                  key={option.value}
                  label={option.label}
                  selected={order.status === option.value}
                  onSelect={() => hub.setStatus(option.value)}
                  chipClass={option.color ? optionColorClasses(option.color).chip : undefined}
                  // A status change is a direct write; block the other chips
                  // while it's in flight so a second tap can't be silently
                  // dropped by the hub's re-entrancy latch.
                  disabled={hub.busy}
                />
              ))}
            </div>
          </Section>
        )}

        <ScreenFields
          fields={orderFields}
          value={(order.custom_data ?? {}) as Record<string, unknown>}
          onChange={hub.setCustomData}
          disabled={hub.busy}
        />

        <Section label="ITEMS" actionLabel="+ Add item" onAction={() => openItem(null)} actionDisabled={hub.busy}>
          {items.length === 0 ? (
            <EmptyLine>No items on this order.</EmptyLine>
          ) : (
            <Card>
              <Divided>
                {items.map(item => (
                  <ListRow
                    key={item.key}
                    name={item.name}
                    amount={fmt(lineTotal(item))}
                    meta={item.meta}
                    trailing={`${item.quantity} × ${fmt(item.unit_price)}`}
                    onClick={() => openItem(item)}
                  />
                ))}
              </Divided>
            </Card>
          )}
        </Section>

        <button
          type="button"
          onClick={() => setSheet('discount')}
          disabled={hub.busy}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3.5 py-2.5 text-left disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="text-sm font-medium text-foreground">Discount</span>
          <span className="text-[13px] font-medium text-muted-foreground">
            {discount.type === null ? 'None' : `− ${fmt(hub.discountAmount)}`}
            {discount.type === 'percent' && ` (${discount.value}%)`}
          </span>
        </button>

        <Section label="PAYMENTS" actionLabel="+ Record" onAction={() => setSheet('payment')} actionDisabled={hub.busy}>
          {payments.length === 0 ? (
            <EmptyLine>Nothing paid yet.</EmptyLine>
          ) : (
            <Card>
              <Divided>
                {payments.map(payment => (
                  <ListRow
                    key={payment.id}
                    name={methodLabel(payment.payment_method as 'cash')}
                    amount={fmt(Number(payment.amount))}
                    meta={[payment.payment_date, payment.notes].filter(Boolean).join(' · ')}
                    trailing={payment.reference}
                  />
                ))}
              </Divided>
            </Card>
          )}
        </Section>

        <Section label="NOTES" actionLabel="+ Add note" onAction={() => setSheet('note')} actionDisabled={hub.busy}>
          {notes.length === 0 ? (
            <EmptyLine>No notes on this order.</EmptyLine>
          ) : (
            <div className="flex flex-col gap-2">
              {notes.map(note => (
                <NoteCard
                  key={note.id}
                  note={{
                    key: note.id,
                    content: note.content,
                    custom_data: (note.custom_data ?? {}) as Record<string, unknown>,
                  }}
                  fields={noteFields}
                  // Notes are append-only for now: there is no PATCH/DELETE on
                  // /api/notes, so a remove button here would open nothing.
                  onRemove={undefined}
                />
              ))}
            </div>
          )}
        </Section>

        <Section label="DOCUMENTS" actionLabel="+ Issue" onAction={() => setSheet('issue')} actionDisabled={hub.busy}>
          {documents.length === 0 ? (
            <EmptyLine>Nothing issued from this order yet.</EmptyLine>
          ) : (
            <Card>
              <Divided>
                {documents.map(document => {
                  // The reader's word for where it stands ("Paid", "Overdue 6
                  // days", "Due 21 Aug"), not the raw `status` machine key —
                  // the same ladder the documents list and detail page use.
                  const state = describeDocumentState(document, today);
                  const stateLabel = state.date
                    ? `${state.label} ${formatDate(state.date)}`
                    : state.label;
                  return (
                    <Link key={document.id} href={`/dashboard/documents/${document.id}`}>
                      <ListRow
                        name={documentLabel(document.document_type)}
                        amount={fmt(Number(document.total ?? 0))}
                        meta={[document.document_number, document.issued_at?.slice(0, 10)]
                          .filter(Boolean)
                          .join(' · ')}
                        trailing={stateLabel}
                      />
                    </Link>
                  );
                })}
              </Divided>
            </Card>
          )}
        </Section>

        <SummaryPanel>
          <SummaryRow label="Subtotal" value={fmt(hub.subtotal)} />
          {hub.discountAmount > 0 && (
            <SummaryRow label={discountLabel(discount)} value={`− ${fmt(hub.discountAmount)}`} />
          )}
          <SummaryRule />
          <SummaryRow label="Total" value={fmt(hub.total)} emphasis />
          {hub.paid > 0 && <SummaryRow label="Paid" value={`− ${fmt(hub.paid)}`} />}
          <SummaryRow
            label="Balance"
            value={fmt(hub.balance)}
            tone={hub.balance > 0 ? 'warning' : undefined}
          />
        </SummaryPanel>
      </div>

      <ScreenFooter
        figureLabel="BALANCE"
        figureValue={fmt(hub.balance)}
        actionLabel="Record payment"
        onAction={() => setSheet('payment')}
        disabled={hub.busy}
      />

      <HubSheets sheet={sheet} setSheet={setSheet} hub={hub} editingItem={editingItem} />
    </div>
  );
}

