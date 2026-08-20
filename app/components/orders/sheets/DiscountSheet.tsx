'use client';

import { useEffect, useRef, useState } from 'react';
import AppSheet from '@/components/ui/sheets/AppSheet';
import { FooterBar, SectionLabel } from '@/components/patterns/screen';
import { ChoiceChip } from '@/components/patterns/controls';
import { SummaryPanel, SummaryRow, SummaryRule } from '@/components/patterns/summary';
import { useFormatCurrency } from '@/hooks/organization/useFormatCurrency';
import { useOrganization } from '@/hooks/organization/useOrganization';
import { discountAmount, type DraftDiscount } from '@/lib/orders/draft';

interface DiscountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What the lines come to — what a percentage applies to. */
  subtotal: number;
  discount: DraftDiscount;
  /**
   * Synchronous (draft) or async (hub write, returning success). Closes on
   * anything but an explicit `false`, so a rejected write keeps the sheet open.
   */
  onApply: (discount: DraftDiscount) => void | boolean | Promise<void | boolean>;
}

/**
 * A trade discount off the whole order — B8.
 *
 * What is stored is the figure the person typed (`orders.discount_type` /
 * `discount_value`), never the money. `v2.order_discount_amount()` derives the
 * amount, and `recompute_order_totals()` and `issue_document()` share that one
 * resolver — so an order and the invoice that freezes it cannot disagree, and
 * "10% off" survives a line being added afterwards.
 *
 * Clearing sets the type to null, which is what the API reads as "remove it";
 * omitting the key would leave the old discount in place.
 */
export default function DiscountSheet({
  open,
  onOpenChange,
  subtotal,
  discount,
  onApply,
}: DiscountSheetProps) {
  const fmt = useFormatCurrency();
  const { currency } = useOrganization();

  const [type, setType] = useState<'amount' | 'percent'>(discount.type ?? 'amount');
  const [value, setValue] = useState(discount.value ? String(discount.value) : '');
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (open) {
      setType(discount.type ?? 'amount');
      setValue(discount.value ? String(discount.value) : '');
    }
  }, [open, discount.type, discount.value]);

  const numeric = Number(value) || 0;
  const next: DraftDiscount = numeric > 0 ? { type, value: numeric } : { type: null, value: 0 };
  const amount = discountAmount(subtotal, next);
  const overPercent = type === 'percent' && numeric > 100;

  const submit = async () => {
    if (overPercent || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const result = await onApply(next);
      if (result !== false) onOpenChange(false);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Discount"
      description="Applies to the whole order, after the lines."
      size="default"
      footer={
        <FooterBar
          figureLabel="NEW TOTAL"
          figureValue={fmt(subtotal - amount)}
          actionLabel="Apply"
          onAction={submit}
          disabled={overPercent || submitting}
          busy={submitting}
        />
      }
    >
      <div className="flex flex-col gap-[22px] px-4 py-4">
        <div className="flex w-full flex-col gap-1.5">
          <SectionLabel>HOW</SectionLabel>
          <div className="flex gap-2" role="radiogroup" aria-label="Discount type">
            <ChoiceChip
              label="Amount"
              size="wide"
              selected={type === 'amount'}
              onSelect={() => setType('amount')}
            />
            <ChoiceChip
              label="Percent"
              size="wide"
              selected={type === 'percent'}
              onSelect={() => setType('percent')}
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-1.5">
          <SectionLabel>DISCOUNT</SectionLabel>
          <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-border bg-background px-3">
            <input
              autoFocus
              type="number"
              inputMode="decimal"
              min={0}
              max={type === 'percent' ? 100 : undefined}
              value={value}
              onChange={event => setValue(event.target.value)}
              aria-label="Discount value"
              className="min-w-0 flex-1 bg-transparent text-base font-semibold text-foreground outline-none"
            />
            <span className="flex-shrink-0 text-[13px] font-medium text-muted-foreground">
              {type === 'percent' ? '%' : (currency ?? '')}
            </span>
          </div>
          {overPercent && (
            // Surfaced here rather than as a 400 from a DB CHECK named
            // orders_discount_percent_range.
            <p className="text-[11px] text-destructive">A percentage discount cannot exceed 100.</p>
          )}
        </div>

        <SummaryPanel>
          <SummaryRow label="Subtotal" value={fmt(subtotal)} />
          <SummaryRow label="Discount" value={amount > 0 ? `− ${fmt(amount)}` : fmt(0)} />
          <SummaryRule />
          <SummaryRow label="New total" value={fmt(subtotal - amount)} emphasis />
        </SummaryPanel>
      </div>
    </AppSheet>
  );
}
