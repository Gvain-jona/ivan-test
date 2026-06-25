import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Order, OrderItem, OrderNote, OrderPayment } from '@/types/orders';

interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Partial<Order>;
  partialItems: Record<number, Partial<OrderItem>>;
  partialPayments: Record<number, Partial<OrderPayment>>;
  partialNotes: Record<number, Partial<OrderNote>>;
  onContinueEditing: () => void;
  onDiscard: () => void;
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  order,
  partialItems,
  partialPayments,
  partialNotes,
  onContinueEditing,
  onDiscard,
}: UnsavedChangesDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        console.log('Confirmation dialog state changing:', isOpen);
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-md bg-card border border-border/40 text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Unsaved Changes
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            You have unsaved changes. Your data will be lost if you close this form.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 text-sm">
          <p className="font-medium mb-2">The following information will be lost:</p>
          <ul className="space-y-1 text-muted-foreground">
            {order.client_name && (
              <li className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                Client: {order.client_name}
              </li>
            )}

            {order.items && order.items.some(item =>
              item && (item.item_name || item.quantity || item.unit_price)
            ) && (
              <li className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                Order items: {order.items.filter(item =>
                  item && (item.item_name || item.quantity || item.unit_price)
                ).length}
              </li>
            )}

            {order.payments && order.payments.some(payment =>
              payment && (payment.amount > 0 || (payment.payment_method && payment.payment_method.trim() !== ''))
            ) && (
              <li className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                Payments: {order.payments.filter(payment =>
                  payment && (payment.amount > 0 || (payment.payment_method && payment.payment_method.trim() !== ''))
                ).length}
              </li>
            )}

            {order.notes && order.notes.some(note =>
              note && ((note.text && note.text.trim() !== '') || (note.type && note.type.trim() !== ''))
            ) && (
              <li className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                Notes: {order.notes.filter(note =>
                  note && ((note.text && note.text.trim() !== '') || (note.type && note.type.trim() !== ''))
                ).length}
              </li>
            )}

            {Object.values(partialItems).some(data =>
              data && ((data.item_name && data.item_name.trim() !== '') || data.quantity || data.unit_price)
            ) && (
              <li className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                Unsaved item data
              </li>
            )}

            {Object.values(partialPayments).some(data =>
              data && ((data.amount ?? 0) > 0 || (data.payment_method && data.payment_method.trim() !== ''))
            ) && (
              <li className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                Unsaved payment data
              </li>
            )}

            {Object.values(partialNotes).some(data =>
              data && ((data.text && data.text.trim() !== '') || (data.type && data.type.trim() !== ''))
            ) && (
              <li className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                Unsaved note data
              </li>
            )}
          </ul>
        </div>

        <DialogFooter className="sm:justify-between mt-4">
          <Button
            variant="outline"
            className="border-border/40 bg-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            onClick={() => {
              console.log('User chose to continue editing');
              onContinueEditing();
            }}
          >
            Continue Editing
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              console.log('User confirmed discarding changes');
              onDiscard();
            }}
          >
            Discard Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
