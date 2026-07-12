import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import OrderSheet from '@/components/ui/sheets/OrderSheet';
import { useToast } from '@/components/ui/use-toast';
import { useOrder, useOrderMutations } from '@/hooks/orders/useOrders';
import { useNotes } from '@/hooks/notes/useNotes';
import { useDocuments } from '@/hooks/documents/useDocuments';
import type { DocumentType } from '@/hooks/documents/useDocuments';
import type { OrderViewSheetProps } from './types';

import OrderDetailsTab from './OrderDetailsTab';
import OrderItemsTab from './OrderItemsTab';
import OrderPaymentsTab from './OrderPaymentsTab';
import OrderNotesTab from './OrderNotesTab';
import OrderDocumentsTab from './OrderDocumentsTab';

type TabKey = 'details' | 'items' | 'payments' | 'notes' | 'documents';

/**
 * OrderViewSheet displays an order in a side panel: details, items,
 * payments, and notes, all fetched live from the v2 API while open.
 */
const OrderViewSheet: React.FC<OrderViewSheetProps> = ({
  open,
  onOpenChange,
  order: summary,
  onClose,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const orderId = open ? summary?.id ?? null : null;
  const { order, payments, isLoading, mutate: refreshOrder } = useOrder(orderId);
  const { notes, addNote } = useNotes('order', orderId);
  const { documents, createDocument } = useDocuments('order', orderId);
  const { addPayment } = useOrderMutations();

  const clientName = order?.clients?.name ?? summary?.clients?.name ?? 'Unknown';

  const handleAddPayment = async (input: {
    amount: number;
    payment_method?: 'cash' | 'mobile_money' | 'bank' | 'credit';
    payment_date?: string;
  }) => {
    if (!summary) return;
    setIsSubmitting(true);
    try {
      await addPayment(summary.id, input);
      await refreshOrder();
      toast({ title: 'Payment recorded' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to record payment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNote = async (content: string) => {
    setIsSubmitting(true);
    try {
      await addNote(content);
      toast({ title: 'Note added' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add note',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateDocument = async (documentType: DocumentType) => {
    setIsSubmitting(true);
    try {
      await createDocument({ document_type: documentType });
      toast({ title: 'Document created', description: 'Saved as a draft' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create document',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'details', label: 'Details' },
    { key: 'items', label: 'Items', count: order?.order_items?.length },
    { key: 'payments', label: 'Payments', count: payments.length },
    { key: 'notes', label: 'Notes', count: notes.length },
    { key: 'documents', label: 'Documents', count: documents.length },
  ];

  return (
    <OrderSheet
      open={open}
      onOpenChange={(next: boolean) => {
        onOpenChange(next);
        if (!next) onClose();
      }}
      title={summary?.order_number ?? 'Order'}
    >
      <div className="p-4 space-y-4">
        {/* Client header */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary/40 bg-primary/10">
            <AvatarFallback className="text-sm font-medium">
              {getInitials(clientName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-white">{clientName}</p>
            <p className="text-xs text-muted-foreground">
              {summary?.order_date
                ? new Date(summary.order_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : ''}
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-[#2B2B40]">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={
                activeTab === tab.key
                  ? 'px-3 py-2 text-sm font-medium text-white border-b-2 border-orange-500'
                  : 'px-3 py-2 text-sm text-muted-foreground hover:text-white'
              }
            >
              {tab.label}
              {tab.count != null && tab.count > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">({tab.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {isLoading || !order ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading order…
          </div>
        ) : (
          <>
            {activeTab === 'details' && <OrderDetailsTab order={order} />}
            {activeTab === 'items' && <OrderItemsTab order={order} />}
            {activeTab === 'payments' && (
              <OrderPaymentsTab
                order={order}
                payments={payments}
                onAddPayment={handleAddPayment}
                isSubmitting={isSubmitting}
              />
            )}
            {activeTab === 'notes' && (
              <OrderNotesTab notes={notes} onAddNote={handleAddNote} isSubmitting={isSubmitting} />
            )}
            {activeTab === 'documents' && (
              <OrderDocumentsTab
                documents={documents}
                onCreateDocument={handleCreateDocument}
                isSubmitting={isSubmitting}
              />
            )}
          </>
        )}
      </div>
    </OrderSheet>
  );
};

export default OrderViewSheet;
