'use client';

import { useEffect, useRef, useState } from 'react';
import AppSheet from '@/components/ui/sheets/AppSheet';
import { FooterBar, SectionLabel } from '@/components/patterns/screen';
import { ChoiceChip } from '@/components/patterns/controls';
import { useFormatCurrency } from '@/hooks/organization/useFormatCurrency';
import { useOrganization } from '@/hooks/organization/useOrganization';
import { todayISO } from '@/lib/orders/dates';
import type { DraftPayment } from '@/lib/orders/draft';

/** The methods `v2.payments.payment_method` accepts — a fixed enum, not org config. */
const METHODS: { value: DraftPayment['payment_method']; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'bank', label: 'Bank' },
  { value: 'credit', label: 'Credit' },
];

interface AddPaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What is still owed before this payment — drives the prefill and the footer. */
  balance: number;
  /**
   * Record the payment. Synchronous (the create-order draft, which just appends
   * a local row) or async (the hub, which writes to the DB and returns whether
   * it succeeded). The sheet closes on anything but an explicit `false`, so a
   * failed DB write keeps the form — and the money the user typed — on screen.
   */
  onAdd: (payment: Omit<DraftPayment, 'key'>) => void | boolean | Promise<void | boolean>;
}

/**
 * Record money against an order — B2b.
 *
 * One sheet in both contexts. It used to need a branch: inline payments ride
 * inside `create_order` rather than `record_payment`, and the handoff doc
 * implied that path silently dropped `reference`. Reading the function settled
 * it — `reference` was always kept and A4 added `notes` — so the same fields
 * are offered whether this opens from the create screen or the order hub.
 *
 * The amount prefills to the outstanding balance because settling in full is
 * the common case, and it is a prefill rather than a lock: part payments are
 * ordinary and a deposit is usually the first thing a shop takes.
 */
export default function AddPaymentSheet({
  open,
  onOpenChange,
  balance,
  onAdd,
}: AddPaymentSheetProps) {
  const fmt = useFormatCurrency();
  const { currency } = useOrganization();

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<DraftPayment['payment_method']>('cash');
  const [date, setDate] = useState(todayISO);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Synchronous latch: keep a second tap from firing a second payment in the
  // window before `submitting` re-renders the button disabled.
  const submittingRef = useRef(false);

  useEffect(() => {
    if (open) {
      setAmount(balance > 0 ? String(balance) : '');
      setMethod('cash');
      setDate(todayISO());
      setReference('');
      setNotes('');
    }
  }, [open, balance]);

  const amountValue = Number(amount) || 0;
  const valid = amountValue > 0;
  const after = balance - amountValue;

  const submit = async () => {
    if (!valid || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const result = await onAdd({
        amount: amountValue,
        payment_method: method,
        payment_date: date,
        ...(reference.trim() ? { reference: reference.trim() } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      // undefined (draft) or true (hub success) closes; false keeps it open so
      // the DB's message applies to a form the user can still see.
      if (result !== false) onOpenChange(false);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const box =
    'flex h-10 w-full items-center rounded-lg border border-border bg-background px-3 ' +
    'text-sm font-medium text-foreground outline-none placeholder:font-normal ' +
    'placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Add payment"
      size="default"
      footer={
        <FooterBar
          figureLabel="BALANCE AFTER"
          // Settled and overpaid are different facts and the person recording
          // the money is the one who needs to know which happened.
          figureValue={after === 0 ? 'Settled' : after < 0 ? `${fmt(-after)} over` : fmt(after)}
          actionLabel="Add payment"
          onAction={submit}
          disabled={!valid || submitting}
          busy={submitting}
        />
      }
    >
      <div className="flex flex-col gap-[22px] px-4 py-4">
        <div className="flex w-full flex-col gap-1.5">
          <SectionLabel>AMOUNT</SectionLabel>
          <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-border bg-background px-3">
            {currency && (
              <span className="flex-shrink-0 text-[13px] font-medium text-muted-foreground">
                {currency}
              </span>
            )}
            <input
              autoFocus
              type="number"
              inputMode="decimal"
              min={0}
              value={amount}
              onChange={event => setAmount(event.target.value)}
              aria-label="Amount"
              className="min-w-0 flex-1 bg-transparent text-base font-semibold text-foreground outline-none"
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-1.5">
          <SectionLabel>METHOD</SectionLabel>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Payment method">
            {METHODS.map(option => (
              <ChoiceChip
                key={option.value}
                label={option.label}
                selected={method === option.value}
                onSelect={() => setMethod(option.value)}
              />
            ))}
          </div>
        </div>

        <div className="flex w-full items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <SectionLabel>DATE</SectionLabel>
            <input
              type="date"
              className={box}
              value={date}
              onChange={event => setDate(event.target.value)}
              aria-label="Payment date"
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-1.5">
          <SectionLabel>REFERENCE</SectionLabel>
          <input
            className={box}
            value={reference}
            onChange={event => setReference(event.target.value)}
            placeholder="MTN ref, cheque no…"
            aria-label="Reference"
          />
        </div>

        <div className="flex w-full flex-col gap-1.5">
          <SectionLabel>NOTE</SectionLabel>
          <input
            className={box}
            value={notes}
            onChange={event => setNotes(event.target.value)}
            placeholder="Deposit, balance on collection…"
            aria-label="Payment note"
          />
        </div>
      </div>
    </AppSheet>
  );
}
