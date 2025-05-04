import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, Loader2 } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Expense, ExpensePayment, ExpenseNote, useExpenseDetails } from '@/hooks/expenses';
import { ExpenseViewHeader } from './ExpenseViewHeader';
import { ExpenseViewGeneral } from './ExpenseViewGeneral';
import { ExpenseViewPayments } from './ExpenseViewPayments';
import { ExpenseViewNotes } from './ExpenseViewNotes';
import { PaymentForm, NoteForm } from '../form';
import { StatusBadge, CategoryBadge } from '../shared';

interface ExpenseViewProps {
  expense: Expense;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => Promise<void>;
}

/**
 * Improved expense view component with better layout and styling
 */
export function ExpenseViewImproved({
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

  // Custom header with expense information
  const renderCustomHeader = () => {
    if (!expense) return null;

    return (
      <div className="flex items-start gap-4">
        {/* Avatar with first letter of expense category */}
        <Avatar className="h-10 w-10 bg-blue-100">
          <AvatarFallback className="bg-blue-100 text-blue-700">
            {expense.category.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Expense Details */}
        <div className="flex-1">
          {/* Item Name as Main Title */}
          <h2 className="text-xl font-semibold">{expense.item_name}</h2>

          {/* Date and Category as Subtitle */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(expense.date)}
            </span>
            <CategoryBadge category={expense.category} />
          </div>
        </div>
      </div>
    );
  };

  if (!expense) return null;

  // Ensure expense has payments and notes arrays
  if (!expense.payments) expense.payments = [];
  if (!expense.notes) expense.notes = [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
        {/* Header */}
        <ExpenseViewHeader
          expense={expense}
          onEdit={onEdit}
          onDelete={handleDelete}
          isDeleting={isDeleting}
          customHeader={renderCustomHeader()}
        />

        <div className="space-y-6 mt-6">
          {/* Financial Summary */}
          <div className="grid grid-cols-3 gap-4 p-4 border border-border/40 rounded-lg bg-muted/5">
            <div>
              <p className="text-xs text-muted-foreground">Total Amount</p>
              <p className="text-lg font-medium">{formatCurrency(expense.total_amount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Amount Paid</p>
              <p className="text-lg font-medium text-green-500">{formatCurrency(expense.amount_paid)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="text-lg font-medium text-orange-500">{formatCurrency(expense.balance)}</p>
            </div>
          </div>

          {/* General Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Expense Details
              <StatusBadge status={expense.payment_status} type="payment" />
            </h3>
            <ExpenseViewGeneral expense={expense} />
          </div>

          {/* Payments */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Payment History
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                {expense.payments?.length || 0} Payments
              </span>
            </h3>
            <ExpenseViewPayments
              expense={expense}
              onAddPayment={() => setIsAddingPayment(true)}
              onEditPayment={handleEditPayment}
              onDeletePayment={deletePayment}
              isSubmitting={isSubmitting}
            />
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Notes
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                {expense.notes?.length || 0} Notes
              </span>
            </h3>
            <ExpenseViewNotes
              expense={expense}
              onAddNote={() => setIsAddingNote(true)}
              onEditNote={handleEditNote}
              onDeleteNote={deleteNote}
              isSubmitting={isSubmitting}
            />
          </div>
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
