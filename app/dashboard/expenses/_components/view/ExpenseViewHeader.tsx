import React, { useState } from 'react';
import { X, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose
} from '@/components/ui/sheet';
import { Expense } from '@/hooks/expenses';
import { ExpenseDeleteConfirmation } from '../shared/ExpenseDeleteConfirmation';

interface ExpenseViewHeaderProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => Promise<void>;
  isDeleting: boolean;
  customHeader?: React.ReactNode;
}

/**
 * Header section of the expense view
 */
export function ExpenseViewHeader({
  expense,
  onEdit,
  onDelete,
  isDeleting,
  customHeader
}: ExpenseViewHeaderProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Handle delete expense
  const handleConfirmedDelete = async () => {
    try {
      await onDelete(expense.id);
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  return (
    <SheetHeader className="p-6 pb-0">
      {customHeader ? (
        <div className="mb-4">
          <div className="flex justify-between items-start">
            {customHeader}
            <div className="flex gap-2">
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 text-red-500" />
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <SheetTitle>Expense Details</SheetTitle>
            <div className="flex gap-2">
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 text-red-500" />
                )}
              </Button>
            </div>
          </div>
          <SheetDescription>
            View and manage expense details
          </SheetDescription>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ExpenseDeleteConfirmation
        expense={expense}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmedDelete}
        loading={isDeleting}
      />
    </SheetHeader>
  );
}
