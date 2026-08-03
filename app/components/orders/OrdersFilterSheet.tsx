'use client';

import React from 'react';
import type { DateRange } from 'react-day-picker';
import OrderSheet from '@/components/ui/sheets/OrderSheet';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/app/components/ui/date-range-picker';
import { cn } from '@/lib/utils';

interface OrdersFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderStatuses: string[];
  selectedStatus: string[];
  onStatusChange: (statuses: string[]) => void;
  selectedPaymentStatus: string[];
  onPaymentStatusChange: (statuses: string[]) => void;
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  /** Total orders matching the current filters — the live "Show N" count. */
  resultCount: number;
  onClearAll: () => void;
}

const PAYMENTS = ['paid', 'partial', 'unpaid'];

const label = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
        active
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border bg-card text-foreground hover:bg-muted',
      )}
    >
      {children}
    </button>
  );
}

/**
 * Mobile filter bottom sheet for the orders list — the reference "Filter"
 * pattern (grouped controls + a Clear all / Show N footer), on the shared
 * sheet primitive. Filters apply live as you toggle (the store refetches),
 * so "Show N" reflects the current match count and the button is just "done".
 */
export default function OrdersFilterSheet({
  open,
  onOpenChange,
  orderStatuses,
  selectedStatus,
  onStatusChange,
  selectedPaymentStatus,
  onPaymentStatusChange,
  dateRange,
  onDateRangeChange,
  resultCount,
  onClearAll,
}: OrdersFilterSheetProps) {
  const activeCount =
    (selectedStatus.length > 0 ? 1 : 0) +
    (selectedPaymentStatus.length > 0 ? 1 : 0) +
    (dateRange ? 1 : 0);

  const toggle = (arr: string[], val: string, onChange: (next: string[]) => void) =>
    onChange(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);

  return (
    <OrderSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filter"
      footer={
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClearAll}
            disabled={activeCount === 0}
          >
            Clear all{activeCount > 0 ? ` (${activeCount})` : ''}
          </Button>
          <Button className="flex-1" onClick={() => onOpenChange(false)}>
            Show {resultCount} result{resultCount === 1 ? '' : 's'}
          </Button>
        </div>
      }
    >
      <div className="space-y-6 p-4">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Status</h3>
          <div className="flex flex-wrap gap-2">
            <Chip active={selectedStatus.length === 0} onClick={() => onStatusChange([])}>
              All
            </Chip>
            {orderStatuses.map((s) => (
              <Chip
                key={s}
                active={selectedStatus.includes(s)}
                onClick={() => toggle(selectedStatus, s, onStatusChange)}
              >
                {label(s)}
              </Chip>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Payment</h3>
          <div className="flex flex-wrap gap-2">
            <Chip
              active={selectedPaymentStatus.length === 0}
              onClick={() => onPaymentStatusChange([])}
            >
              All
            </Chip>
            {PAYMENTS.map((p) => (
              <Chip
                key={p}
                active={selectedPaymentStatus.includes(p)}
                onClick={() => toggle(selectedPaymentStatus, p, onPaymentStatusChange)}
              >
                {label(p)}
              </Chip>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Date range</h3>
          <DateRangePicker dateRange={dateRange} onDateRangeChange={onDateRangeChange} />
        </section>
      </div>
    </OrderSheet>
  );
}
