'use client';

import { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { useDocumentMutations, type DocumentListRecord } from '@/hooks/documents/useDocuments';

/**
 * The lifecycle actions a rendered document can take (B9's header menu).
 *
 * An issued document is otherwise a dead end: a mistaken invoice can't be
 * pulled and a quotation can't be marked accepted/declined. The transitions
 * offered are deliberately narrow and read from the live DB rules:
 *
 * - **Quotation** → accepted / declined. No money moves, so these are free.
 * - **Invoice** → void, and only while nothing has been paid against it.
 *   `v2.order_live_invoice` excludes `void`, so voiding is exactly what frees
 *   the order to be reissued. But no trigger releases `payment_allocations`
 *   when a document is voided, so voiding an invoice that already carries a
 *   payment would strand that money against a dead document — that is a
 *   credit-note flow the schema doesn't have yet, so the UI doesn't offer it.
 *
 * When neither applies (already terminal, or a paid invoice) the menu renders
 * nothing rather than a disabled stub.
 */
export default function DocumentActions({ document }: { document: DocumentListRecord }) {
  const { toast } = useToast();
  const { updateDocument } = useDocumentMutations();
  const [confirmVoid, setConfirmVoid] = useState(false);
  const [busy, setBusy] = useState(false);

  const terminal = ['void', 'declined', 'expired', 'accepted'].includes(document.status);
  const isInvoice = document.document_type === 'invoice';
  const isQuotation = document.document_type === 'quotation';
  const amountPaid = document.amount_paid ?? 0;

  const canVoid = isInvoice && !terminal && amountPaid === 0;
  const canDecideQuote = isQuotation && !terminal;

  const setStatus = async (status: 'accepted' | 'declined' | 'void', success: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await updateDocument(document.id, { status });
      toast({ title: success, description: document.document_number });
    } catch (error) {
      toast({
        title: 'Could not update the document',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
      setConfirmVoid(false);
    }
  };

  if (!canVoid && !canDecideQuote) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Document actions"
            className="rounded text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MoreVertical className="h-[20px] w-[20px]" strokeWidth={2} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canDecideQuote && (
            <>
              <DropdownMenuItem onSelect={() => setStatus('accepted', 'Quotation accepted')}>
                Mark accepted
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setStatus('declined', 'Quotation declined')}>
                Mark declined
              </DropdownMenuItem>
            </>
          )}
          {canVoid && (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={event => {
                event.preventDefault();
                setConfirmVoid(true);
              }}
            >
              Void invoice
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmVoid} onOpenChange={open => !busy && setConfirmVoid(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void {document.document_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              The invoice is kept for the record but marked void, and the order can be
              invoiced again. This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={event => {
                event.preventDefault();
                void setStatus('void', 'Invoice voided');
              }}
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy ? 'Voiding…' : 'Void invoice'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
