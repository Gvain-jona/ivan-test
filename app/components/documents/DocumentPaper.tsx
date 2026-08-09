'use client';

import { formatDate } from '@/lib/utils';
import {
  issuerInitials,
  type DocumentSnapshot,
  type SnapshotLine,
} from '@/lib/documents/snapshot';

/**
 * The document itself (B9 on the Pencil canvas), rendered from its frozen
 * snapshot.
 *
 * **Deliberately not theme-tokenized.** Paper is always white — this is the
 * documented exception in CLAUDE.md's colour rules, alongside PDF and print
 * stylesheets. An invoice looks the same to the customer who receives it
 * whatever the sender's OS theme is, and inverting it in dark mode would make
 * the on-screen copy disagree with the printed one. The hexes below are the
 * frame's own and are meant to stay literal.
 *
 * Everything comes from the snapshot, never from the live order: the order has
 * moved on, and the document is what was agreed. That's what
 * `protect_issued_documents` exists to guarantee.
 */

const INK = '#111827';
const DIM = '#6B7280';
const RULE = '#E5E7EB';

export default function DocumentPaper({
  snapshot,
  amountPaid,
  formatMoney,
}: {
  snapshot: DocumentSnapshot;
  amountPaid: number;
  /** Currency formatter bound to the snapshot's frozen currency. */
  formatMoney: (value: number) => string;
}) {
  const s = snapshot;
  const balance = s.total - amountPaid;
  const showsPayment = amountPaid > 0;

  return (
    <article
      className="w-full rounded-[14px] border p-5"
      style={{ background: '#FFFFFF', borderColor: RULE }}
    >
      <header className="flex items-center gap-[11px]">
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[9px] text-[13px] font-bold"
          style={{ background: INK, color: '#FFFFFF' }}
        >
          {issuerInitials(s.issuerName)}
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[15px] font-bold" style={{ color: INK }}>
            {s.issuerName ?? 'Your business'}
          </span>
          {s.issuerContact.length > 0 && (
            <span className="truncate text-[10.5px]" style={{ color: DIM }}>
              {s.issuerContact.join(' · ')}
            </span>
          )}
        </div>
      </header>

      <Rule className="my-4" />

      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[19px] font-bold uppercase" style={{ color: INK }}>
          {s.documentType}
        </h2>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-xs font-semibold" style={{ color: INK }}>
            {s.documentNumber}
          </span>
          {s.issuedAt && (
            <span className="text-[10.5px]" style={{ color: DIM }}>
              Issued {formatDate(s.issuedAt)}
            </span>
          )}
          {s.dueDate && (
            <span className="text-[10.5px] font-semibold" style={{ color: INK }}>
              Due {formatDate(s.dueDate)}
            </span>
          )}
          {!s.dueDate && s.validUntil && (
            <span className="text-[10.5px] font-semibold" style={{ color: INK }}>
              Valid to {formatDate(s.validUntil)}
            </span>
          )}
        </div>
      </div>

      <p className="mt-[18px] text-[9.5px] font-semibold" style={{ color: DIM }}>
        BILL TO
      </p>
      <p className="mt-1.5 text-[13px] font-semibold" style={{ color: INK }}>
        {s.recipientName ?? '—'}
      </p>
      {s.recipientDetails.length > 0 && (
        <p className="mt-[3px] text-[10.5px] leading-[15px]" style={{ color: DIM }}>
          {s.recipientDetails.join(' · ')}
        </p>
      )}

      {s.orderFields.length > 0 && (
        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          {s.orderFields.map(([label, value]) => (
            <span key={label} className="text-[10.5px]" style={{ color: DIM }}>
              {label} · {value}
            </span>
          ))}
        </div>
      )}

      <Rule className="my-[18px]" />

      {/*
        A consolidated invoice covers several jobs, and an undifferentiated
        list of lines is unreadable — the client cannot tell which job they are
        being charged for. Group under each order, and keep the flat list when
        there is only one (the ordinary case), where a heading would be noise.
      */}
      {s.orders.length > 1 ? (
        <div className="flex flex-col gap-[18px]">
          {s.orders.map(order => (
            <div key={order.orderId ?? order.orderNumber} className="flex flex-col gap-[11px]">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[10.5px] font-semibold" style={{ color: INK }}>
                  {order.orderNumber ?? '—'}
                  {order.orderDate && (
                    <span className="font-normal" style={{ color: DIM }}>
                      {' · '}
                      {formatDate(order.orderDate)}
                    </span>
                  )}
                </span>
                <span className="flex-shrink-0 text-[10.5px] font-semibold" style={{ color: INK }}>
                  {formatMoney(order.total)}
                </span>
              </div>
              {order.fields.length > 0 && (
                <span className="-mt-[7px] text-[10.5px]" style={{ color: DIM }}>
                  {order.fields.map(([label, value]) => `${label} · ${value}`).join('   ')}
                </span>
              )}
              {s.lines
                .filter(line => line.orderNumber === order.orderNumber)
                .map((line, index) => (
                  <LineRow key={index} line={line} formatMoney={formatMoney} />
                ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-[11px]">
          {s.lines.map((line, index) => (
            <LineRow key={index} line={line} formatMoney={formatMoney} />
          ))}
        </div>
      )}

      <Rule className="my-3.5" />

      <div className="flex flex-col gap-2">
        <Row label="Subtotal" value={formatMoney(s.subtotal)} />
        {s.discountTotal > 0 && (
          <Row
            // The rate is what was agreed; the amount is what it came to. A
            // percentage discount that prints only the amount makes the reader
            // do the division to check it.
            label={
              s.discountType === 'percent' ? `Discount (${s.discountValue}%)` : 'Discount'
            }
            value={`− ${formatMoney(s.discountTotal)}`}
          />
        )}

        <Rule />

        <Row label="Total" value={formatMoney(s.total)} strong />
        {s.taxRegistered && s.taxTotal > 0 && (
          <p className="text-[10.5px]" style={{ color: DIM }}>
            {s.amountsIncludeTax ? 'Includes' : 'Plus'} {s.taxLabel} {s.taxRate}% ·{' '}
            {formatMoney(s.taxTotal)}
          </p>
        )}

        {showsPayment && (
          <>
            <Rule />
            <Row label="Paid" value={`− ${formatMoney(amountPaid)}`} />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-bold" style={{ color: INK }}>
                Balance due
              </span>
              <span className="text-base font-bold" style={{ color: INK }}>
                {formatMoney(balance)}
              </span>
            </div>
          </>
        )}
      </div>

      {(s.bankDetails || s.footer) && (
        <>
          <Rule className="my-[18px]" />
          {s.bankDetails && (
            <p className="text-[10.5px] leading-[15px]" style={{ color: DIM }}>
              {s.bankDetails}
            </p>
          )}
          {s.footer && (
            <p className="mt-1.5 text-[10.5px] leading-[15px]" style={{ color: DIM }}>
              {s.footer}
            </p>
          )}
        </>
      )}
    </article>
  );
}

function Rule({ className }: { className?: string }) {
  return <div className={className} style={{ height: 1, background: RULE }} />;
}

function LineRow({
  line,
  formatMoney,
}: {
  line: SnapshotLine;
  formatMoney: (value: number) => string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[12.5px] font-semibold" style={{ color: INK }}>
          {line.description}
        </span>
        <span className="flex-shrink-0 text-[12.5px] font-semibold" style={{ color: INK }}>
          {formatMoney(line.total)}
        </span>
      </div>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10.5px]" style={{ color: DIM }}>
          {Object.values(line.fields).join(' · ')}
        </span>
        <span className="flex-shrink-0 text-[10.5px]" style={{ color: DIM }}>
          {line.quantity} × {formatMoney(line.unitPrice)}
        </span>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span
        className={strong ? 'text-xs font-semibold' : 'text-[11.5px]'}
        style={{ color: DIM }}
      >
        {label}
      </span>
      <span
        className={strong ? 'text-[13px] font-semibold' : 'text-[11.5px] font-semibold'}
        style={{ color: INK }}
      >
        {value}
      </span>
    </div>
  );
}
