import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Expense, ExpensePayment, ExpenseNote, useExpenseDetails } from '@/hooks/expenses';
import { ExpenseViewHeader } from './ExpenseViewHeader';
import { ExpenseViewGeneral } from './ExpenseViewGeneral';
import { ExpenseViewPayments } from './ExpenseViewPayments';
import { ExpenseViewNotes } from './ExpenseViewNotes';
import { PaymentForm, NoteForm } from '../form';

interface ExpenseViewProps {
  expense: Expense;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => Promise<void>;
}

/**
 * Main expense view component
 */
export function ExpenseView({
  expense,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: ExpenseViewProps) {
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    addPayment,
    updatePayment,
    deletePayment,
    addNote,
    updateNote,
    deleteNote,
    isSubmitting
  } = useExpenseDetails(expense?.id);

  // Handle delete expense with loading state
  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await onDelete(id);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting expense:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle edit payment (placeholder for now)
  const handleEditPayment = (payment: ExpensePayment) => {
    // This would be implemented in a real application
    alert('Edit payment functionality would be implemented here');
  };

  // Handle edit note (placeholder for now)
  const handleEditNote = (note: ExpenseNote) => {
    // This would be implemented in a real application
    alert('Edit note functionality would be implemented here');
  };

  if (!expense) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
        {/* Header */}
        <ExpenseViewHeader
          expense={expense}
          onEdit={onEdit}
          onDelete={handleDelete}
          isDeleting={isDeleting}
        />

        <div className="space-y-6">
          {/* General Information */}
          <ExpenseViewGeneral expense={expense} />

          {/* Payments */}
          <ExpenseViewPayments
            expense={expense}
            onAddPayment={() => setIsAddingPayment(true)}
            onEditPayment={handleEditPayment}
            onDeletePayment={deletePayment}
            isSubmitting={isSubmitting}
          />

          {/* Notes */}
          <ExpenseViewNotes
            expense={expense}
            onAddNote={() => setIsAddingNote(true)}
            onEditNote={handleEditNote}
            onDeleteNote={deleteNote}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Payment Form */}
        <PaymentForm
          open={isAddingPayment}
          onOpenChange={setIsAddingPayment}
          onSubmit={async (values) => {
            await addPayment(values);
            setIsAddingPayment(false);
          }}
          isSubmitting={isSubmitting}
        />

        {/* Note Form */}
        <NoteForm
          open={isAddingNote}
          onOpenChange={setIsAddingNote}
          onSubmit={async (values) => {
            await addNote(values);
            setIsAddingNote(false);
          }}
          isSubmitting={isSubmitting}
        />
      </SheetContent>
    </Sheet>
  );
}
