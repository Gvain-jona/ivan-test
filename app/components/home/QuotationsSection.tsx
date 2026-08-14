'use client';

import Link from 'next/link';
import { ChevronRight, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useFormatCurrency } from '@/hooks/organization/useFormatCurrency';
import { useSheets } from '@/context/sheet-host';
import type { OrderSummary } from '@/hooks/orders/useOrders';

/**
 * Active quotations (H1) — orders still in the quotation stage, the ones a shop
 * owner chases to turn into work. Separated from the orders feed the way the
 * frame separates them; the split itself is data-driven (see homeMetrics).
 * Renders nothing when there are none — an empty section is noise on a feed.
 */
export default function QuotationsSection({ quotations }: { quotations: OrderSummary[] }) {
  const { openOrder } = useSheets();
  const fmt = useFormatCurrency();

  if (quotations.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Active quotations
        </h2>
        <Link
          href="/dashboard/orders?status=quotation"
          className="flex items-center gap-0.5 text-[12px] font-medium text-primary hover:underline"
        >
          See all
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {quotations.slice(0, 4).map(q => (
          <li key={q.id}>
            <button
              type="button"
              onClick={() => openOrder(q.id)}
              className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-muted/40"
            >
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-semibold text-foreground">
                  {q.clients?.name ?? 'Unknown client'}
                </p>
                <p className="truncate text-[11.5px] text-muted-foreground">
                  {formatDate(q.order_date)}
                </p>
              </div>
              <span className="flex-shrink-0 text-[13.5px] font-semibold text-foreground">
                {fmt(q.total_amount)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
