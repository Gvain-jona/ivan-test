'use client';

import { useEffect, useState } from 'react';
import OrderSheet from '@/components/ui/sheets/OrderSheet';
import { FooterBar, SectionLabel } from '@/components/patterns/screen';
import { ChoiceChip } from '@/components/patterns/controls';
import { SummaryPanel, SummaryRow, SummaryRule } from '@/components/patterns/summary';
import { useFormatCurrency } from '@/hooks/organization/useFormatCurrency';
import { useOrganization } from '@/hooks/organization/useOrganization';
import type { DocumentType } from '@/hooks/documents/useDocuments';

/**
 * Quotation and Invoice only.
 *
 * The frame draws a Receipt chip too, and `documents.entity_type` does permit
 * `'payment'` — but nothing DB-side can issue one: A3c was postponed to the
 * payments cutover because a receipt shares none of the lines/tax/receivable
 * machinery, and its snapshot shape is the payments module's to define. An
 * affordance that can't be wired doesn't get drawn.
 *
 * Proforma and PO are absent for a different reason: a document type is only
 * legal when the org has a `doc:{type}` counter, and offering an option that
 * always fails is worse than not offering it.
 */
const TYPES: { value: DocumentType; label: string }[] = [
  { value: 'quotation', label: 'Quotation' },
  { value: 'invoice', label: 'Invoice' },
];

/** The terms the frame offers. `0` is "on receipt", which is a real answer. */
const TERMS: { days: number; label: string }[] = [
  { days: 0, label: 'On receipt' },
  { days: 7, label: '7 days' },
  { days: 14, label: '14 days' },
  { days: 30, label: '30 days' },
];

interface IssueDocumentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtotal: number;
  discountAmount: number;
  total: number;
  busy?: boolean;
  onIssue: (input: {
    document_type: DocumentType;
    terms_days?: number;
    validity_days?: number;
  }) => void;
}

/**
 * Issue a document from an order — B7.
 *
 * Issuing is final, not a draft step: `v2.issue_document()` numbers it, freezes
 * a snapshot of the order and the org's settings, and writes the financials in
 * one transaction. Nothing here computes money — the totals shown are the
 * order's own, for confirmation, and the document's figures come from the DB.
 */
export default function IssueDocumentSheet({
  open,
  onOpenChange,
  subtotal,
  discountAmount,
  total,
  busy,
  onIssue,
}: IssueDocumentSheetProps) {
  const fmt = useFormatCurrency();
  const { settings } = useOrganization();

  const [documentType, setDocumentType] = useState<DocumentType>('invoice');
  const [termsDays, setTermsDays] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setDocumentType('invoice');
      // null means "whatever the org already decided" — the sheet only sends
      // an override when someone actually picks a different one.
      setTermsDays(null);
    }
  }, [open]);

  const orgTerms = settings.documents?.terms_days;
  const effectiveTerms = termsDays ?? orgTerms;
  const tax = settings.tax;

  return (
    <OrderSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Issue document"
      size="default"
      footer={
        <FooterBar
          figureLabel="TOTAL"
          figureValue={fmt(total)}
          actionLabel={`Issue ${documentType === 'invoice' ? 'invoice' : 'quotation'}`}
          busy={busy}
          onAction={() =>
            onIssue({
              document_type: documentType,
              ...(documentType === 'invoice' && termsDays !== null
                ? { terms_days: termsDays }
                : {}),
            })
          }
        />
      }
    >
      <div className="flex flex-col gap-[22px] px-4 py-4">
        <div className="flex w-full flex-col gap-1.5">
          <SectionLabel>TYPE</SectionLabel>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Document type">
            {TYPES.map(option => (
              <ChoiceChip
                key={option.value}
                label={option.label}
                size="wide"
                selected={documentType === option.value}
                onSelect={() => setDocumentType(option.value)}
              />
            ))}
          </div>
        </div>

        {/* Terms are an invoice's promise about when money is due; a quotation
            carries a validity period instead, which the org already sets. */}
        {documentType === 'invoice' && (
          <div className="flex w-full flex-col gap-1.5">
            <SectionLabel>PAYMENT TERMS</SectionLabel>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Payment terms">
              {TERMS.map(option => (
                <ChoiceChip
                  key={option.days}
                  label={option.label}
                  selected={effectiveTerms === option.days}
                  onSelect={() => setTermsDays(option.days)}
                />
              ))}
            </div>
          </div>
        )}

        <SummaryPanel>
          <SummaryRow label="Subtotal" value={fmt(subtotal)} />
          {discountAmount > 0 && (
            <SummaryRow label="Discount" value={`− ${fmt(discountAmount)}`} />
          )}
          <SummaryRule />
          <SummaryRow label="Total" value={fmt(total)} emphasis />
          {tax?.registered && (
            // Stated, not calculated: issue_document() resolves the tax from
            // the org's settings and the mode it is configured for, and a
            // second computation here could disagree with the paper.
            <p className="text-[11px] text-muted-foreground">
              {tax.inclusive ? 'Includes' : 'Plus'} {tax.label ?? 'tax'} {tax.rate ?? 0}%
            </p>
          )}
        </SummaryPanel>

        <p className="text-[11px] text-muted-foreground">
          Issuing numbers the document and freezes what it says. It can&rsquo;t be edited
          afterwards — a mistake is corrected by voiding it and issuing another.
        </p>
      </div>
    </OrderSheet>
  );
}
