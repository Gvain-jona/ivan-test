import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Package, DollarSign, Tag, User, RefreshCw } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { calculateNextOccurrence } from '@/lib/utils/date-utils';
import { toast } from 'sonner';
import { Expense, ExpensePayment, ExpenseNote } from '@/hooks/expenses';
import { ExpenseViewHeader } from './ExpenseViewHeader';
import { StatusBadge, CategoryBadge } from '../shared';

// Import bottom overlay components
import BottomOverlayForm from './BottomOverlayForm';
import AddExpensePaymentModal from './AddExpensePaymentModal';
import EditExpensePaymentModal from './EditExpensePaymentModal';
import AddExpenseNoteModal from './AddExpenseNoteModal';
import EditExpenseNoteModal from './EditExpenseNoteModal';
import EditExpenseDetailsForm from './EditExpenseDetailsForm';
import EditRecurringExpenseForm from './EditRecurringExpenseForm';
import { RecurringExpenseDetails } from './RecurringExpenseDetails';

// Import custom hooks
import { useExpenseUpdates } from './hooks/useExpenseUpdates';
import { useModalWithItem } from './hooks/useModalWithItem';

// Import section components
import { PaymentsSection } from './sections/PaymentsSection';
import { NotesSection } from './sections/NotesSection';
import { SectionHeader } from './SectionHeader';

interface ExpenseViewSheetProps {
  expense: Expense;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => Promise<void>;
  refreshExpense?: () => Promise<void>;
}

/**
 * Enhanced expense view component with better layout and styling
 * Matches the style of the order view UI
 */
export function ExpenseViewSheet({
  expense,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  refreshExpense
}: ExpenseViewSheetProps) {
  // Use custom hooks for modal state management
  const paymentModal = useModalWithItem<ExpensePayment>();
  const noteModal = useModalWithItem<ExpenseNote>();

  // State for modal visibility
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [showEditRecurringModal, setShowEditRecurringModal] = useState(false);

  // Loading states
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isEditingRecurring, setIsEditingRecurring] = useState(false);

  // Use our custom hook for expense updates with optimistic updates
  const {
    loadingStates,
    handleAddPayment,
    handleEditPayment,
    handleDeletePayment,
    handleAddNote,
    handleEditNote,
    handleDeleteNote
  } = useExpenseUpdates({
    expense,
    onEdit: async (updatedExpense) => {
      try {
        const response = await onEdit(updatedExpense);
        return response;
      } catch (error) {
        console.error('Error in onEdit:', error);
        throw error;
      }
    },
    refreshExpense
  });

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

  // Custom header with expense information
  const renderCustomHeader = () => {
    if (!expense) return null;

    // Get initials from item name
    const getInitials = (name: string) => {
      if (!name) return 'E';
      return name.split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
    };

    // Get avatar color based on category
    const getAvatarColor = (category: string) => {
      const categories: Record<string, string> = {
        'materials': 'bg-blue-500/10 text-blue-500 border-blue-500/30',
        'equipment': 'bg-purple-500/10 text-purple-500 border-purple-500/30',
        'services': 'bg-green-500/10 text-green-500 border-green-500/30',
        'utilities': 'bg-orange-500/10 text-orange-500 border-orange-500/30',
        'rent': 'bg-red-500/10 text-red-500 border-red-500/30',
        'salaries': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
        'marketing': 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30',
        'other': 'bg-gray-500/10 text-gray-500 border-gray-500/30'
      };

      return categories[category?.toLowerCase()] || 'bg-primary/10 text-primary border-primary/30';
    };

    return (
      <div className="flex items-start gap-4 mt-2">
        {/* Avatar with initials of item name */}
        <Avatar className={`h-14 w-14 border-2 ${getAvatarColor(expense.category)}`}>
          <AvatarFallback className="text-lg">
            {getInitials(expense.item_name)}
          </AvatarFallback>
        </Avatar>

        {/* Expense Details */}
        <div className="flex-1">
          {/* Item Name as Main Title */}
          <h2 className="text-2xl font-semibold">{expense.item_name}</h2>

          {/* Date and Category as Subtitle */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(expense.date)}
            </span>
            <CategoryBadge category={expense.category} />
            <StatusBadge status={expense.payment_status} type="payment" />
          </div>
        </div>
      </div>
    );
  };

  if (!expense) return null;

  // Ensure expense has payments and notes arrays
  const payments = Array.isArray(expense.payments) ? expense.payments : [];
  const notes = Array.isArray(expense.notes) ? expense.notes : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full p-0 overflow-y-auto" hideCloseButton={true}>
        {/* Header */}
        <ExpenseViewHeader
          expense={expense}
          onEdit={onEdit}
          onDelete={handleDelete}
          isDeleting={isDeleting}
          customHeader={renderCustomHeader()}
        />

        <div className="px-6 pt-2 pb-6 space-y-8">
          {/* Expense Details Section */}
          <div className="space-y-4">
            <SectionHeader
              title="Expense Details"
              icon={<Package className="h-5 w-5" />}
              actions={
                <button
                  className="text-sm text-blue-500 hover:underline"
                  onClick={() => setShowEditDetailsModal(true)}
                  disabled={isEditingDetails}
                >
                  Edit Details
                </button>
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
              </div>

              {/* Created by information */}
              <div className="mt-4 pt-4 border-t border-border/40 flex items-center text-xs text-muted-foreground">
                <User className="h-3.5 w-3.5 mr-1.5" />
                <span>Created {formatDate(expense.created_at || '')}</span>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="space-y-4">
            <SectionHeader
              title="Financial Summary"
              icon={<DollarSign className="h-5 w-5" />}
            />
            <div className="border border-border/40 rounded-lg p-4 bg-muted/5">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="text-lg font-medium">{formatCurrency(expense.total_amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount Paid</p>
                  <p className="text-lg font-medium text-green-500">{formatCurrency(expense.amount_paid || 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="text-lg font-medium text-orange-500">{formatCurrency(expense.balance || (expense.total_amount - (expense.amount_paid || 0)))}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recurring Expense Section */}
          <div className="space-y-4">
            <SectionHeader
              title="Recurrence"
              icon={<RefreshCw className="h-5 w-5" />}
              actions={
                <button
                  className="text-sm text-blue-500 hover:underline"
                  onClick={() => setShowEditRecurringModal(true)}
                  disabled={isEditingRecurring}
                >
                  {expense.is_recurring ? 'Edit Recurrence' : 'Make Recurring'}
                </button>
              }
            />

            {expense.is_recurring ? (
              <RecurringExpenseDetails expense={expense} />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-muted/10">
                <p className="text-muted-foreground mb-2">Not a recurring expense</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Convert this to a recurring expense if it happens regularly
                </p>
              </div>
            )}
          </div>

          {/* Payments Section */}
          <PaymentsSection
            expense={expense}
            payments={payments}
            loadingStates={{
              addPayment: loadingStates?.addPayment || false,
              editPayment: loadingStates?.editPayment,
              deletePayment: loadingStates?.deletePayment
            }}
            onAddPayment={() => setShowAddPaymentModal(true)}
            onEditPayment={(payment) => {
              paymentModal.openModal(payment);
            }}
            onDeletePayment={handleDeletePayment}
          />

          {/* Notes Section */}
          <NotesSection
            expense={expense}
            notes={notes}
            loadingStates={{
              addNote: loadingStates?.addNote || false,
              editNote: loadingStates?.editNote,
              deleteNote: loadingStates?.deleteNote
            }}
            onAddNote={() => setShowAddNoteModal(true)}
            onEditNote={(note) => {
              noteModal.openModal(note);
            }}
            onDeleteNote={handleDeleteNote}
          />
        </div>

        {/* Add Payment Modal */}
        <AddExpensePaymentModal
          isOpen={showAddPaymentModal}
          onClose={() => setShowAddPaymentModal(false)}
          expenseId={expense.id}
          onSuccess={(payment) => {
            try {
              handleAddPayment(payment);
              setShowAddPaymentModal(false);
            } catch (error) {
              console.error('Error handling payment success:', error);
              toast.error('Failed to process payment');
            }
          }}
        />

        {/* Add Note Modal */}
        <AddExpenseNoteModal
          isOpen={showAddNoteModal}
          onClose={() => setShowAddNoteModal(false)}
          expenseId={expense.id}
          onSuccess={(note) => {
            try {
              handleAddNote(note);
              setShowAddNoteModal(false);
            } catch (error) {
              console.error('Error handling note success:', error);
              toast.error('Failed to process note');
            }
          }}
        />

        {/* Edit Payment Modal */}
        {paymentModal.selectedItem && (
          <EditExpensePaymentModal
            isOpen={paymentModal.isOpen}
            onClose={paymentModal.closeModal}
            expenseId={expense.id}
            payment={paymentModal.selectedItem}
            onSuccess={(payment) => {
              try {
                handleEditPayment(payment);
                paymentModal.closeModal();
              } catch (error) {
                console.error('Error handling payment update:', error);
                toast.error('Failed to update payment');
              }
            }}
          />
        )}

        {/* Edit Note Modal */}
        {noteModal.selectedItem && (
          <EditExpenseNoteModal
            isOpen={noteModal.isOpen}
            onClose={noteModal.closeModal}
            expenseId={expense.id}
            note={noteModal.selectedItem}
            onSuccess={(note) => {
              try {
                handleEditNote(note);
                noteModal.closeModal();
              } catch (error) {
                console.error('Error handling note update:', error);
                toast.error('Failed to update note');
              }
            }}
          />
        )}

        {/* Edit Expense Details Modal */}
        <BottomOverlayForm
          isOpen={showEditDetailsModal}
          onClose={() => setShowEditDetailsModal(false)}
          title="Edit Expense Details"
        >
          <EditExpenseDetailsForm
            expense={expense}
            onSubmit={async (updatedExpense) => {
              try {
                setIsEditingDetails(true);
                const mergedExpense = {
                  ...expense,
                  ...updatedExpense
                };
                await onEdit(mergedExpense);
                setShowEditDetailsModal(false);
                toast.success('Expense details updated successfully');
              } catch (error) {
                console.error('Error updating expense details:', error);
                toast.error('Failed to update expense details');
              } finally {
                setIsEditingDetails(false);
              }
            }}
            onCancel={() => setShowEditDetailsModal(false)}
            isSubmitting={isEditingDetails}
          />
        </BottomOverlayForm>

        {/* Edit Recurring Expense Modal */}
        <BottomOverlayForm
          isOpen={showEditRecurringModal}
          onClose={() => setShowEditRecurringModal(false)}
          title={expense.is_recurring ? "Edit Recurring Settings" : "Make Expense Recurring"}
        >
          <EditRecurringExpenseForm
            expense={expense}
            onSubmit={async (updatedExpense) => {
              try {
                setIsEditingRecurring(true);
                const mergedExpense = {
                  ...expense,
                  ...updatedExpense
                };

                // If turning on recurring for the first time, set default values
                if (updatedExpense.is_recurring && !expense.is_recurring) {
                  if (!mergedExpense.recurrence_start_date) {
                    mergedExpense.recurrence_start_date = new Date().toISOString();
                  }

                  // Calculate the next occurrence date
                  const startDate = new Date(mergedExpense.recurrence_start_date);
                  const nextOccurrence = calculateNextOccurrence(
                    startDate,
                    mergedExpense.recurrence_frequency || 'monthly',
                    {
                      dayOfMonth: mergedExpense.recurrence_day_of_month,
                      dayOfWeek: mergedExpense.recurrence_day_of_week,
                      weekOfMonth: mergedExpense.recurrence_week_of_month,
                      monthOfYear: mergedExpense.recurrence_month_of_year,
                      monthlyRecurrenceType: mergedExpense.monthly_recurrence_type as 'day_of_month' | 'day_of_week'
                    }
                  );

                  mergedExpense.next_occurrence_date = nextOccurrence.toISOString();
                }

                await onEdit(mergedExpense);
                setShowEditRecurringModal(false);

                // Show appropriate success message
                if (updatedExpense.is_recurring && !expense.is_recurring) {
                  toast.success('Expense converted to recurring successfully');
                } else if (!updatedExpense.is_recurring && expense.is_recurring) {
                  toast.success('Expense is no longer recurring');
                } else {
                  toast.success('Recurring settings updated successfully');
                }
              } catch (error) {
                console.error('Error updating recurring settings:', error);
                toast.error('Failed to update recurring settings');
              } finally {
                setIsEditingRecurring(false);
              }
            }}
            onCancel={() => setShowEditRecurringModal(false)}
            isSubmitting={isEditingRecurring}
          />
        </BottomOverlayForm>
      </SheetContent>
    </Sheet>
  );
}


