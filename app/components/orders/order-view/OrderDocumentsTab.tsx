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

const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'quotation', label: 'Quotation' },
  { value: 'proforma', label: 'Proforma' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'po', label: 'Purchase Order' },
];

/**
 * OrderDocumentsTab lists documents (polymorphic documents engine) and
 * creates new drafts. Every document created here is a 'draft' — the
 * DB-side issue_document() RPC that will assign a final number/snapshot
 * and move it to sent/issued doesn't exist yet (see
 * docs/v2-migration/orders-system-handoff.md §6/§12), so there's no
 * "Issue" action wired up yet, only creation and listing.
 */
const OrderDocumentsTab: React.FC<OrderDocumentsTabProps> = ({
  documents,
  onCreateDocument,
  isSubmitting,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>('invoice');

  const handleSubmit = async () => {
    await onCreateDocument(documentType);
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      {documents.length === 0 ? (
        <div className="border border-[#2B2B40] rounded-lg p-8 text-center text-muted-foreground">
          <FileText className="h-6 w-6 mx-auto mb-2 opacity-60" />
          <p className="text-sm">No documents on this order</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map(document => (
            <div
              key={document.id}
              className="border border-[#2B2B40] rounded-lg p-3 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-white">{document.document_number}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {document.document_type}
                  {document.valid_until
                    ? ` · valid until ${new Date(document.valid_until).toLocaleDateString()}`
                    : ''}
                </p>
              </div>
              <Badge variant="outline" className="capitalize">
                {document.status}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="border border-[#2B2B40] rounded-lg p-4 space-y-3">
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
              Create Draft
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
