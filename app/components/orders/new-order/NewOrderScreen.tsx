'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Divided,
  ScreenFooter,
  ScreenHeader,
  Section,
  SectionLabel,
} from '@/components/patterns/screen';
import { ChoiceChip, ListRow } from '@/components/patterns/controls';
import { SummaryPanel, SummaryRow, SummaryRule } from '@/components/patterns/summary';
import { ScreenFields } from '@/components/fields/ScreenFields';
import ClientField from './ClientField';
import { EmptyLine, methodLabel, NoteCard } from './parts';
import { useOrderDraft } from './useOrderDraft';
import AddItemSheet from '@/components/orders/sheets/AddItemSheet';
import AddPaymentSheet from '@/components/orders/sheets/AddPaymentSheet';
import AddNoteSheet from '@/components/orders/sheets/AddNoteSheet';
import DiscountSheet from '@/components/orders/sheets/DiscountSheet';
import { useFieldDefinitions } from '@/hooks/fields/useFieldDefinitions';
import { useOrderStatuses } from '@/hooks/orders/useOrderStatuses';
import { useFormatCurrency } from '@/hooks/organization/useFormatCurrency';
import { useSheets } from '@/context/sheet-host';
import { optionColorClasses } from '@/lib/fields/colors';
import { discountLabel, lineTotal } from '@/lib/orders/draft';

type OpenSheet = 'item' | 'payment' | 'note' | 'discount' | null;

/**
 * Compose a new order — B2 on the canvas.
 *
 * A **screen**, not a sheet, per the carve-out in CLAUDE.md: this is a record
 * built up over minutes across seven sections, and its own add-item / payment /
 * note / discount sheets need something to stack on. What it replaces
 * (`OrderFormSheet`) was a sheet of 3-column grids and dropdowns.
 *
 * Only the client, the status and the order date are columns. "DUE DATE" and
 * "DELIVERY" in the frame are the `due_date` and `delivery_method` starter
 * fields — `ScreenFields` renders whatever the org actually configured, so the
 * screen matches the frame for the shipped starter set without hardcoding it.
 */
export default function NewOrderScreen() {
  const router = useRouter();
  const fmt = useFormatCurrency();
  const draft = useOrderDraft();
  const { openCreateClient } = useSheets();
  const { statuses } = useOrderStatuses();
  const { fieldDefinitions: orderFields } = useFieldDefinitions('order');
  const { fieldDefinitions: noteFields } = useFieldDefinitions('note');
  const [sheet, setSheet] = useState<OpenSheet>(null);

  const { totals, discount, items, payments, notes } = draft;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-background">
      <ScreenHeader title="New order" onBack={() => router.back()} />

      <div className="flex flex-1 flex-col gap-[22px] px-4 py-4">
        <ClientField
          clientId={draft.client.id}
          clientName={draft.client.name}
          onSelect={client => draft.setClient(client)}
          onClear={() => draft.setClient(null)}
          // The frame offers `New client "kamp"` inline. Creation is a sheet
          // the host owns; we hand it the typed name to prefill, and select the
          // saved client straight back onto the draft so the order continues
          // without a second search — the create-and-return flow.
          onCreate={name =>
            openCreateClient(name, saved =>
              draft.setClient({ id: saved.id, name: saved.name }),
            )
          }
        />

        {statuses.length > 0 && (
          <Section label="STATUS">
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Status">
              {statuses.map(option => (
                <ChoiceChip
                  key={option.value}
                  label={option.label}
                  selected={draft.status === option.value}
                  onSelect={() => draft.setStatus(option.value)}
                  chipClass={option.color ? optionColorClasses(option.color).chip : undefined}
                />
              ))}
            </div>
          </Section>
        )}

        <ScreenFields
          fields={orderFields}
          value={draft.customData}
          onChange={draft.setCustomData}
          leading={
            <div className="flex w-full min-w-0 flex-col gap-1.5">
              <SectionLabel>ORDER DATE</SectionLabel>
              <input
                type="date"
                value={draft.orderDate}
                onChange={event => draft.setOrderDate(event.target.value)}
                aria-label="Order date"
                className="flex h-10 w-full items-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          }
        />

        <Section label="ITEMS" actionLabel="+ Add item" onAction={() => setSheet('item')}>
          {items.length === 0 ? (
            <EmptyLine>No items yet — an order needs at least one.</EmptyLine>
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
                    onRemove={() => draft.removeItem(item.key)}
                  />
                ))}
              </Divided>
            </Card>
          )}
        </Section>

        {items.length > 0 && (
          <button
            type="button"
            onClick={() => setSheet('discount')}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3.5 py-2.5 text-left"
          >
            <span className="text-sm font-medium text-foreground">Discount</span>
            <span className="text-[13px] font-medium text-muted-foreground">
              {discount.type === null ? 'None' : `− ${fmt(totals.discountAmount)}`}
              {discount.type === 'percent' && ` (${discount.value}%)`}
            </span>
          </button>
        )}

        <Section label="PAYMENTS" actionLabel="+ Add payment" onAction={() => setSheet('payment')}>
          {payments.length === 0 ? (
            <EmptyLine>Nothing paid yet.</EmptyLine>
          ) : (
            <Card>
              <Divided>
                {payments.map(payment => (
                  <ListRow
                    key={payment.key}
                    name={methodLabel(payment.payment_method)}
                    amount={fmt(payment.amount)}
                    meta={payment.payment_date}
                    trailing={payment.notes ?? payment.reference}
                    onRemove={() => draft.removePayment(payment.key)}
                  />
                ))}
              </Divided>
            </Card>
          )}
        </Section>

        <Section label="NOTES" actionLabel="+ Add note" onAction={() => setSheet('note')}>
          {notes.length === 0 ? (
            <EmptyLine>No notes on this order.</EmptyLine>
          ) : (
            <div className="flex flex-col gap-2">
              {notes.map(note => (
                <NoteCard
                  key={note.key}
                  note={note}
                  fields={noteFields}
                  onRemove={() => draft.removeNote(note.key)}
                />
              ))}
            </div>
          )}
        </Section>

        {items.length > 0 && (
          <SummaryPanel>
            <SummaryRow label="Subtotal" value={fmt(totals.subtotal)} />
            {totals.discountAmount > 0 && (
              <SummaryRow
                label={discountLabel(discount)}
                value={`− ${fmt(totals.discountAmount)}`}
              />
            )}
            <SummaryRule />
            <SummaryRow label="Total" value={fmt(totals.total)} emphasis />
            {totals.paid > 0 && (
              <>
                <SummaryRow label="Paid" value={`− ${fmt(totals.paid)}`} />
                <SummaryRow
                  label="Balance"
                  value={fmt(totals.balance)}
                  tone={totals.balance > 0 ? 'warning' : undefined}
                />
              </>
            )}
          </SummaryPanel>
        )}
      </div>

      <ScreenFooter
        figureLabel="TOTAL"
        figureValue={fmt(totals.total)}
        actionLabel="Save order"
        onAction={draft.save}
        disabled={!draft.canSave}
        busy={draft.saving}
      />

      <AddItemSheet
        open={sheet === 'item'}
        onOpenChange={open => setSheet(open ? 'item' : null)}
        onAdd={draft.addItem}
      />
      <AddPaymentSheet
        open={sheet === 'payment'}
        onOpenChange={open => setSheet(open ? 'payment' : null)}
        balance={totals.balance}
        onAdd={draft.addPayment}
      />
      <AddNoteSheet
        open={sheet === 'note'}
        onOpenChange={open => setSheet(open ? 'note' : null)}
        onAdd={draft.addNote}
      />
      <DiscountSheet
        open={sheet === 'discount'}
        onOpenChange={open => setSheet(open ? 'discount' : null)}
        subtotal={totals.subtotal}
        discount={discount}
        onApply={draft.setDiscount}
      />
    </div>
  );
}
