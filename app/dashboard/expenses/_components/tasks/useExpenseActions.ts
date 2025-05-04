import { useState } from 'react';
import { toast } from 'sonner';
import { Expense } from '@/hooks/expenses';
import { OccurrenceStatus, RecurringExpenseOccurrence } from './types';

interface UseExpenseActionsProps {
  refreshData: () => Promise<void>;
  updateOccurrenceStatus: (occurrenceId: string, status: OccurrenceStatus) => Promise<void>;
}

interface UseExpenseActionsResult {
  editingExpenseId: string | null;
  viewExpense: Expense | null;
  isViewOpen: boolean;
  setIsViewOpen: (isOpen: boolean) => void;
  handleStatusUpdate: (occurrenceId: string, status: OccurrenceStatus) => Promise<void>;
  handleEditExpense: (occurrence: RecurringExpenseOccurrence) => Promise<void>;
  handleExpenseUpdate: (updatedExpense: Expense) => Promise<any>;
  handleExpenseDelete: (expenseId: string) => Promise<void>;
}

export function useExpenseActions({
  refreshData,
  updateOccurrenceStatus
}: UseExpenseActionsProps): UseExpenseActionsResult {
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [viewExpense, setViewExpense] = useState<Expense | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // Handle status update
  const handleStatusUpdate = async (occurrenceId: string, status: OccurrenceStatus) => {
    try {
      // Use the context function for all status updates
      const result = await updateOccurrenceStatus(occurrenceId, status);

      // Show appropriate success message based on the response
      if (result && result.message) {
        toast.success(result.message);

        // If a regular expense was created, show additional info
        if (status === 'completed' && result.expense) {
          // Show a simple toast notification without the view option
          toast.success(`Regular expense created and payment recorded.`, {
            duration: 3000
          });
        }
      } else {
        const message = status === 'completed'
          ? 'Expense completed successfully'
          : status === 'skipped'
            ? 'Expense skipped successfully'
            : 'Expense status reset successfully';
        toast.success(message);
      }

      // Refresh the data to reflect the changes
      await refreshData();
    } catch (error) {
      console.error('Error updating occurrence status:', error);
      toast.error('Failed to update expense status');
    }
  };

  // Handle edit expense
  const handleEditExpense = async (occurrence: RecurringExpenseOccurrence) => {
    try {
      setEditingExpenseId(occurrence.id);

      // Get the parent expense from the occurrence
      if (!occurrence.expense || !occurrence.parent_expense_id) {
        toast.error("Cannot edit this expense: Missing parent expense information");
        setEditingExpenseId(null);
        return;
      }

      // Set the parent expense as the viewExpense to open in the ExpenseViewSheet
      const parentExpense = occurrence.expense;

      // Ensure the expense has payments and notes arrays and convert to Expense type
      const expenseWithArrays = {
        ...parentExpense,
        payments: Array.isArray(parentExpense.payments) ? parentExpense.payments : [],
        notes: Array.isArray(parentExpense.notes) ? parentExpense.notes : [],
        // Add required Expense properties with default values if they don't exist
        quantity: parentExpense.quantity || 1,
        unit_cost: parentExpense.unit_cost || parentExpense.amount || 0,
        amount_paid: parentExpense.amount_paid || 0,
        balance: parentExpense.balance || parentExpense.total_amount || 0,
        payment_status: parentExpense.payment_status || 'unpaid'
      } as Expense;

      setViewExpense(expenseWithArrays);
      setIsViewOpen(true);
      setEditingExpenseId(null);
    } catch (error) {
      console.error('Error preparing expense for edit:', error);
      toast.error('Failed to open expense for editing');
      setEditingExpenseId(null);
    }
  };

  // Handle expense update
  const handleExpenseUpdate = async (updatedExpense: Expense) => {
    try {
      // Make API call to update the expense
      const response = await fetch(`/api/expenses/${updatedExpense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedExpense),
      });

      if (!response.ok) {
        throw new Error(`Failed to update expense: ${response.status}`);
      }

      const data = await response.json();
      toast.success('Expense updated successfully');

      // Refresh the occurrences to reflect the changes
      await refreshData();

      return data;
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Failed to update expense');
      throw error;
    }
  };

  // Handle expense deletion
  const handleExpenseDelete = async (expenseId: string) => {
    try {
      // Make API call to delete the expense
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete expense: ${response.status}`);
      }

      toast.success('Expense deleted successfully');

      // Refresh the occurrences to reflect the changes
      await refreshData();

      // Close the view sheet
      setIsViewOpen(false);
      setViewExpense(null);
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  return {
    editingExpenseId,
    viewExpense,
    isViewOpen,
    setIsViewOpen,
    handleStatusUpdate,
    handleEditExpense,
    handleExpenseUpdate,
    handleExpenseDelete
  };
}
