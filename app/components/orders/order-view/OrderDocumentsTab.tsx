import React, { useState } from 'react';
import { FileText, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DocumentType } from '@/hooks/documents/useDocuments';
import type { OrderDocumentsTabProps } from './types';

/**
 * Only the types every org is provisioned with. document_type is org-defined
 * — the DB accepts exactly those with a matching `doc:{type}` counter — so
 * proforma/receipt/po stay out of the picker until the counters are readable
 * and this list can be built from them. Offering an option that always fails
 * is worse than not offering it.
 */
const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'quotation', label: 'Quotation' },
  { value: 'invoice', label: 'Invoice' },
];

/**
 * OrderDocumentsTab lists an order's documents and issues new ones.
 *
 * Issuing is final, not a draft step: v2.issue_document() numbers the
 * document, freezes a snapshot of the order and org settings, and writes the
 * financials in one go. An issued document can't be edited afterwards — a
 * mistake is corrected with a credit note. Invoices additionally allow only
 * one live document per order; reissuing means voiding the old one first.
 */
const OrderDocumentsTab: React.FC<OrderDocumentsTabProps> = ({
  documents,
  onIssueDocument,
  isSubmitting,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>('invoice');

  const handleSubmit = async () => {
    await onIssueDocument(documentType);
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      {documents.length === 0 ? (
        <div className="border border-border/40 rounded-lg p-8 text-center text-muted-foreground">
          <FileText className="h-6 w-6 mx-auto mb-2 opacity-60" />
          <p className="text-sm">No documents on this order</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map(document => (
            <div
              key={document.id}
              className="border border-border/40 rounded-lg p-3 flex items-center justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{document.document_number}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {document.document_type}
                  {document.due_date
                    ? ` · due ${new Date(document.due_date).toLocaleDateString()}`
                    : ''}
                  {document.valid_until
                    ? ` · valid until ${new Date(document.valid_until).toLocaleDateString()}`
                    : ''}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                {/* Frozen at issue — the document's own currency, not the org's current one. */}
                <span className="text-sm font-medium text-foreground">
                  {document.currency} {Number(document.total ?? 0).toLocaleString()}
                </span>
                <Badge variant="outline" className="capitalize">
                  {document.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="border border-border/40 rounded-lg p-4 space-y-3">
          <Select value={documentType} onValueChange={v => setDocumentType(v as DocumentType)}>
            <SelectTrigger>
              <SelectValue placeholder="Document type" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Issue
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="w-full">
          <Plus className="h-4 w-4 mr-1.5" />
          New Document
        </Button>
      )}
    </div>
  );
};

export default OrderDocumentsTab;
