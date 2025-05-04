import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  DollarSign,
  Tag,
  User,
  Clock,
  FileText,
  Package,
  Loader2
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Expense, ExpensePayment, ExpenseNote, useExpenseDetails } from '@/hooks/expenses';
import { ExpenseViewHeader } from './ExpenseViewHeader';
import { PaymentForm, NoteForm } from '../form';
import { StatusBadge, CategoryBadge, PaymentCard, NoteCard, EmptyState } from '../shared';

interface SectionHeaderProps {
  title: string;
  count?: number;
  actions?: React.ReactNode;
}

/**
 * Section header component for consistent styling
 */
function SectionHeader({ title, count, actions }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {count !== undefined && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
            {count}
          </span>
        )}
      </div>
      {actions}
    </div>
  );
}

interface ExpenseViewProps {
  expense: Expense;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => Promise<void>;
}

/**
 * Enhanced expense view component with better layout and styling
 * Matches the style of the order view UI
 */
export function ExpenseViewEnhanced({
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

        <div className="p-6 space-y-8">
          {/* Financial Summary */}
          <div className="border border-border/40 rounded-lg p-4 bg-muted/5">
            <div className="grid grid-cols-3 gap-4">
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
          </div>

          {/* Expense Details Section */}
          <div className="space-y-4">
            <SectionHeader
              title="Expense Details"
              actions={
                <StatusBadge status={expense.payment_status} type="payment" />
              }
            />

            <div className="border border-border/40 rounded-lg p-4 bg-muted/5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Item</p>
                    <p className="text-sm font-medium">{expense.item_name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Category</p>
                    <p className="text-sm font-medium capitalize">{expense.category}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-sm font-medium">{formatDate(expense.date)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Unit Cost</p>
                    <p className="text-sm font-medium">{formatCurrency(expense.unit_cost || 0)}</p>
                  </div>
                </div>

                {expense.responsible && (
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Responsible</p>
                      <p className="text-sm font-medium">{expense.responsible}</p>
                    </div>
                  </div>
                )}

                {expense.is_recurring && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Recurring</p>
                      <p className="text-sm font-medium">Yes</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Created by information */}
              <div className="mt-4 pt-4 border-t border-border/40 flex items-center text-xs text-muted-foreground">
                <User className="h-3.5 w-3.5 mr-1.5" />
                <span>Created {formatDate(expense.created_at || '')}</span>
              </div>
            </div>
          </div>

          {/* Payments Section */}
          <div className="space-y-4">
            <SectionHeader
              title="Payment History"
              count={expense.payments.length}
              actions={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingPayment(true)}
                  disabled={isSubmitting}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Add Payment
                </Button>
              }
            />

            {expense.payments.length > 0 ? (
              <div className="space-y-3">
                {expense.payments.map((payment: ExpensePayment) => (
                  <PaymentCard
                    key={payment.id}
                    payment={payment}
                    onEdit={onEditPayment}
                    onDelete={deletePayment}
                    isSubmitting={isSubmitting}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<DollarSign className="h-8 w-8" />}
                title="No payments yet"
                description="Add a payment to track the expense payment history"
                actionLabel="Add Payment"
                onAction={() => setIsAddingPayment(true)}
              />
            )}
          </div>

          {/* Notes Section */}
          <div className="space-y-4">
            <SectionHeader
              title="Notes"
              count={expense.notes.length}
              actions={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingNote(true)}
                  disabled={isSubmitting}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              }
            />

            {expense.notes.length > 0 ? (
              <div className="space-y-3">
                {expense.notes.map((note: ExpenseNote) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={onEditNote}
                    onDelete={deleteNote}
                    isSubmitting={isSubmitting}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<FileText className="h-8 w-8" />}
                title="No notes yet"
                description="Add a note to keep track of important information"
                actionLabel="Add Note"
                onAction={() => setIsAddingNote(true)}
              />
            )}
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
