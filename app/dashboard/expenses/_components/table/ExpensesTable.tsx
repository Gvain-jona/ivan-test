import React from 'react';
import { FileX, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Expense } from '@/hooks/expenses';
import { StatusBadge, CategoryBadge } from '../shared';
import { ExpenseActions } from './ExpenseActions';

interface ExpensesTableProps {
  expenses: Expense[];
  isLoading: boolean;
  isEmpty: boolean;
  onViewExpense: (expense: Expense) => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => Promise<void>;
  onAddExpense: () => void;
}

/**
 * Table component for displaying expenses
 */
export function ExpensesTable({
  expenses,
  isLoading,
  isEmpty,
  onViewExpense,
  onEditExpense,
  onDeleteExpense,
  onAddExpense,
}: ExpensesTableProps) {
  return (
    <div className="rounded-xl border border-border/40 overflow-hidden">
      <Table className="w-full table-auto">
        <TableHeader className="bg-muted/20">
          <TableRow className="border-b border-border/60">
            {/* Date column - increased fixed width */}
            <TableHead className="w-[130px] py-3.5 px-4 font-medium text-foreground whitespace-nowrap">Date</TableHead>

            {/* Item column - limited max width */}
            <TableHead className="py-3.5 px-4 font-medium text-foreground max-w-[250px]">Item</TableHead>

            {/* Type column - fixed width */}
            <TableHead className="w-[90px] py-3.5 px-4 font-medium text-foreground">Type</TableHead>

            {/* Quantity column - fixed width */}
            <TableHead className="w-[70px] py-3.5 px-4 text-right font-medium text-foreground">Qty</TableHead>

            {/* Unit Cost column - fixed width */}
            <TableHead className="w-[110px] py-3.5 px-4 text-right font-medium text-foreground">Unit Cost</TableHead>

            {/* Total Amount column - fixed width */}
            <TableHead className="w-[130px] py-3.5 px-4 text-right font-medium text-foreground whitespace-nowrap">Total Amount</TableHead>

            {/* Balance column - fixed width */}
            <TableHead className="w-[130px] py-3.5 px-4 text-right font-medium text-foreground">Balance</TableHead>

            {/* Status column - fixed width */}
            <TableHead className="w-[120px] py-3.5 px-4 font-medium text-foreground">Status</TableHead>

            {/* Actions column - fixed width */}
            <TableHead className="w-[110px] py-3.5 px-4 text-right font-medium text-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            // Loading state
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow
                key={index}
                className={`hover:bg-muted/10 ${index % 2 === 0 ? 'bg-muted/5' : ''} border-b border-border/30`}
              >
                <TableCell className="py-3.5 px-4 align-middle border-r border-border/10"><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="py-3.5 px-4 align-middle"><Skeleton className="h-4 w-full max-w-[200px]" /></TableCell>
                <TableCell className="py-3.5 px-4 align-middle border-l border-border/10"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                <TableCell className="py-3.5 px-4 text-right align-middle border-l border-border/10"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                <TableCell className="py-3.5 px-4 text-right align-middle border-l border-border/10"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                <TableCell className="py-3.5 px-4 text-right align-middle border-l border-border/10"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                <TableCell className="py-3.5 px-4 text-right align-middle border-l border-border/10"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                <TableCell className="py-3.5 px-4 align-middle border-l border-border/10"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                <TableCell className="py-3.5 px-4 text-right align-middle border-l border-border/10">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : isEmpty ? (
            // Empty state
            <TableRow className="border-b border-border/30">
              <TableCell colSpan={9} className="h-32 text-center">
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="rounded-full bg-muted/10 p-3 mb-3">
                    <FileX className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-3">No expenses found</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onAddExpense}
                    className="border-border/60 hover:bg-muted/10"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            // Data state
            expenses.map((expense, index) => (
              <TableRow
                key={expense.id}
                className={`hover:bg-muted/10 ${index % 2 === 0 ? 'bg-muted/5' : ''} border-b border-border/30`}
              >
                {/* Date */}
                <TableCell className="py-3.5 px-4 align-middle font-medium border-r border-border/10 whitespace-nowrap">
                  {formatDate(expense.date)}
                </TableCell>

                {/* Item - Main information */}
                <TableCell className="py-3.5 px-4 align-middle max-w-[250px]">
                  <div className="flex flex-col">
                    <span className="font-medium truncate">{expense.item_name}</span>
                  </div>
                </TableCell>

                {/* Type */}
                <TableCell className="py-3.5 px-4 align-middle border-l border-border/10">
                  <CategoryBadge category={expense.category} />
                </TableCell>

                {/* Quantity */}
                <TableCell className="py-3.5 px-4 text-right align-middle whitespace-nowrap border-l border-border/10">
                  {expense.quantity || 1}
                </TableCell>

                {/* Unit Cost */}
                <TableCell className="py-3.5 px-4 text-right align-middle whitespace-nowrap border-l border-border/10">
                  {formatCurrency(expense.unit_cost || 0)}
                </TableCell>

                {/* Total Amount */}
                <TableCell className="py-3.5 px-4 text-right align-middle whitespace-nowrap font-medium border-l border-border/10">
                  {formatCurrency(expense.total_amount)}
                </TableCell>

                {/* Balance */}
                <TableCell className="py-3.5 px-4 text-right align-middle whitespace-nowrap border-l border-border/10">
                  {expense.balance < 0 ? (
                    <span className="text-green-500 font-medium">
                      {formatCurrency(Math.abs(expense.balance))} (Overpaid)
                    </span>
                  ) : (
                    formatCurrency(expense.balance)
                  )}
                </TableCell>

                {/* Status */}
                <TableCell className="py-3.5 px-4 align-middle border-l border-border/10">
                  <div className="flex flex-col gap-1">
                    <StatusBadge status={expense.payment_status} type="payment" />
                    {expense.is_recurring && (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                        Recurring
                      </Badge>
                    )}
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell className="py-3.5 px-4 text-right align-middle border-l border-border/10">
                  <ExpenseActions
                    expense={expense}
                    onView={onViewExpense}
                    onEdit={onEditExpense}
                    onDelete={onDeleteExpense}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
