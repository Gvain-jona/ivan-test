'use client';

/**
 * @deprecated This file is deprecated and will be removed in the future.
 * Please use the components in the table directory instead.
 */

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Eye, Edit, Trash2, PlusCircle, Search, Filter, CalendarRange } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Expense, useExpenses, ExpenseFilters } from '@/hooks/useExpenses';
import { ExpenseView } from './view';
import { ExpenseForm } from './form/ExpenseForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define categories (formerly expense types)
const CATEGORIES = [
  'All',
  'Fixed',
  'Variable',
];



// Define payment statuses
const PAYMENT_STATUSES = [
  'All',
  'Paid',
  'Partially Paid',
  'Unpaid',
];

// Define recurring options
const RECURRING_OPTIONS = [
  { value: 'all', label: 'All Expenses' },
  { value: 'recurring', label: 'Recurring Only' },
  { value: 'non-recurring', label: 'Non-Recurring Only' },
];

export function ExpensesTabContent() {
  const [viewExpense, setViewExpense] = useState<Expense | null>(null);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [showRecurring, setShowRecurring] = useState<boolean | undefined>(undefined);

  // Build filters
  const filters: ExpenseFilters = {
    search: searchQuery || undefined,
    startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    paymentStatus: selectedStatus !== 'All'
      ? [selectedStatus.toLowerCase().replace(' ', '_')]
      : undefined,
    category: selectedType !== 'All' ? [selectedType.toLowerCase()] : undefined,
    is_recurring: showRecurring,
  };

  // Fetch expenses
  const {
    expenses,
    isLoading,
    isEmpty,
    createExpense,
    updateExpense,
    deleteExpense,
    isSubmitting,
    mutate
  } = useExpenses(filters);

  // Handle view expense
  const handleViewExpense = (expense: Expense) => {
    setViewExpense(expense);
    setIsViewOpen(true);
  };

  // Handle edit expense
  const handleEditExpense = (expense: Expense) => {
    setEditExpense(expense);
    setIsEditOpen(true);
  };

  // Handle delete expense
  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteExpense(id);
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  // Handle add expense
  const handleAddExpense = async (values: any) => {
    try {
      // Validate category
      if (!values.category || !['fixed', 'variable'].includes(values.category)) {
        throw new Error('Invalid category value. Must be either "fixed" or "variable".');
      }

      // Calculate total amount if not already set
      if (values.quantity && values.unit_cost && !values.total_amount) {
        values.total_amount = values.quantity * values.unit_cost;
      }

      // Log the form values to debug
      console.log('Form values being submitted:', values);
      console.log('Category value in ExpensesTabContent:', values.category);

      // Force the category to be 'fixed' if that's what was selected
      // This is a critical step to ensure the category is properly set
      const category = values.category === 'fixed' ? 'fixed' : 'variable';
      console.log('Final category value being sent to API:', category);

      // Add additional validation to ensure the category is valid
      if (category !== 'fixed' && category !== 'variable') {
        console.error('Invalid category value:', category);
        throw new Error('Invalid category value. Must be either "fixed" or "variable".');
      }

      // Format recurrence pattern fields if present
      const recurrenceFields = values.is_recurring ? {
        recurrence_frequency: values.recurrence_frequency,
        recurrence_start_date: values.recurrence_start_date
          ? format(values.recurrence_start_date, 'yyyy-MM-dd')
          : undefined,
        recurrence_end_date: values.recurrence_end_date
          ? format(values.recurrence_end_date, 'yyyy-MM-dd')
          : undefined,
        reminder_days: values.reminder_days,
        recurrence_day_of_week: values.recurrence_day_of_week,
        recurrence_day_of_month: values.recurrence_day_of_month,
        recurrence_week_of_month: values.recurrence_week_of_month,
        recurrence_month_of_year: values.recurrence_month_of_year,
        recurrence_time: values.recurrence_time,
        monthly_recurrence_type: values.monthly_recurrence_type,
      } : {};

      // Create the expense with all necessary fields
      await createExpense(
        {
          // Ensure category is explicitly set to the selected value
          category,
          item_name: values.item_name,
          quantity: values.quantity,
          unit_cost: values.unit_cost,
          responsible: values.responsible,
          total_amount: values.total_amount,
          date: format(values.date, 'yyyy-MM-dd'),
          vat: values.vat || 0,
          is_recurring: values.is_recurring,
          ...recurrenceFields,
        },
        values.payments?.map((payment: any) => ({
          amount: payment.amount,
          date: format(payment.date, 'yyyy-MM-dd'),
          payment_method: payment.payment_method,
        })) || [],
        values.notes?.map((note: any) => ({
          type: note.type,
          text: note.text,
        })) || []
      );

      // The form will handle its own success message and reset
      return true;
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  };

  // Handle update expense
  const handleUpdateExpense = async (values: any) => {
    if (!editExpense) return;

    try {
      // Calculate total amount if not already set
      if (values.quantity && values.unit_cost && !values.total_amount) {
        values.total_amount = values.quantity * values.unit_cost;
      }

      // Log the form values to debug
      console.log('Update form values being submitted:', values);
      console.log('Category value in update ExpensesTabContent:', values.category);

      // Force the category to be 'fixed' if that's what was selected
      // This is a critical step to ensure the category is properly set
      const category = values.category === 'fixed' ? 'fixed' : 'variable';
      console.log('Final category value being sent to API for update:', category);

      // Add additional validation to ensure the category is valid
      if (category !== 'fixed' && category !== 'variable') {
        console.error('Invalid category value for update:', category);
        throw new Error('Invalid category value. Must be either "fixed" or "variable".');
      }

      // Format recurrence pattern fields if present
      const recurrenceFields = values.is_recurring ? {
        recurrence_frequency: values.recurrence_frequency,
        recurrence_start_date: values.recurrence_start_date
          ? format(values.recurrence_start_date, 'yyyy-MM-dd')
          : undefined,
        recurrence_end_date: values.recurrence_end_date
          ? format(values.recurrence_end_date, 'yyyy-MM-dd')
          : undefined,
        reminder_days: values.reminder_days,
        recurrence_day_of_week: values.recurrence_day_of_week,
        recurrence_day_of_month: values.recurrence_day_of_month,
        recurrence_week_of_month: values.recurrence_week_of_month,
        recurrence_month_of_year: values.recurrence_month_of_year,
        recurrence_time: values.recurrence_time,
        monthly_recurrence_type: values.monthly_recurrence_type,
      } : {};

      await updateExpense(editExpense.id, {
        // Ensure category is explicitly set to the selected value
        category,
        item_name: values.item_name,
        quantity: values.quantity,
        unit_cost: values.unit_cost,
        responsible: values.responsible,
        total_amount: values.total_amount,
        date: format(values.date, 'yyyy-MM-dd'),
        vat: values.vat || 0,
        is_recurring: values.is_recurring,
        ...recurrenceFields,
      });

      // The form will handle its own success message
      // We only close the edit form after successful update
      setIsEditOpen(false);
      return true;
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  };

  // Get payment status badge color
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'partially_paid':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'unpaid':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return '';
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setDateRange(undefined);
    setSelectedStatus('All');
    setSelectedType('All');
    setShowRecurring(undefined);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative w-full sm:w-auto flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search expenses..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            className="w-auto h-9"
            align="end"
          />

          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[110px] h-9">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>



          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={showRecurring === undefined ? 'all' : showRecurring ? 'recurring' : 'non-recurring'}
            onValueChange={(value) => {
              if (value === 'all') {
                setShowRecurring(undefined);
              } else if (value === 'recurring') {
                setShowRecurring(true);
              } else {
                setShowRecurring(false);
              }
            }}
          >
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue placeholder="Recurrence" />
            </SelectTrigger>
            <SelectContent>
              {RECURRING_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="ghost" size="sm" className="h-9" onClick={resetFilters}>
            Reset
          </Button>

          <Button size="sm" className="h-9" onClick={() => setIsAddingExpense(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New
          </Button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="rounded-xl border border-border/40 overflow-hidden">
        <Table className="w-full table-fixed">
          <TableHeader className="bg-muted/5">
            <TableRow>
              <TableHead className="w-[100px] py-3.5 px-4 font-medium">Date</TableHead>
              <TableHead className="w-[100px] py-3.5 px-4 font-medium">Type</TableHead>
              <TableHead className="w-[120px] py-3.5 px-4 font-medium">Category</TableHead>
              <TableHead className="py-3.5 px-4 font-medium">Item</TableHead>
              <TableHead className="w-[80px] py-3.5 px-4 text-right font-medium">Qty</TableHead>
              <TableHead className="w-[100px] py-3.5 px-4 text-right font-medium">Unit Cost</TableHead>
              <TableHead className="w-[120px] py-3.5 px-4 text-right font-medium whitespace-nowrap">Total Amount</TableHead>
              <TableHead className="w-[120px] py-3.5 px-4 text-right font-medium">Balance</TableHead>
              <TableHead className="w-[100px] py-3.5 px-4 font-medium">Status</TableHead>
              <TableHead className="w-[100px] py-3.5 px-4 text-right font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading state
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="py-3.5 px-4 align-middle"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="py-3.5 px-4 align-middle"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="py-3.5 px-4 align-middle"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="py-3.5 px-4 align-middle"><Skeleton className="h-4 w-full max-w-[200px]" /></TableCell>
                  <TableCell className="py-3.5 px-4 text-right align-middle"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                  <TableCell className="py-3.5 px-4 text-right align-middle"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell className="py-3.5 px-4 text-right align-middle"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                  <TableCell className="py-3.5 px-4 text-right align-middle"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                  <TableCell className="py-3.5 px-4 align-middle"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="py-3.5 px-4 text-right align-middle">
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
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-muted-foreground mb-2">No expenses found</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingExpense(true)}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Expense
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              // Data state
              expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="py-3.5 px-4 align-middle">{formatDate(expense.date)}</TableCell>
                  <TableCell className="py-3.5 px-4 align-middle">
                    <Badge variant={expense.category === 'fixed' ? 'secondary' : 'outline'} className="capitalize">
                      {expense.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3.5 px-4 font-medium align-middle">{expense.item_name ? expense.item_name.split(' ')[0] : 'General'}</TableCell>
                  <TableCell className="py-3.5 px-4 align-middle">
                    <div className="truncate">{expense.item_name || expense.description}</div>
                  </TableCell>
                  <TableCell className="py-3.5 px-4 text-right align-middle whitespace-nowrap">{expense.quantity || 1}</TableCell>
                  <TableCell className="py-3.5 px-4 text-right align-middle whitespace-nowrap">{formatCurrency(expense.unit_cost || 0)}</TableCell>
                  <TableCell className="py-3.5 px-4 text-right align-middle whitespace-nowrap">{formatCurrency(expense.total_amount)}</TableCell>
                  <TableCell className="py-3.5 px-4 text-right align-middle whitespace-nowrap">{formatCurrency(expense.balance)}</TableCell>
                  <TableCell className="py-3.5 px-4 align-middle">
                    <Badge variant="outline" className={getPaymentStatusColor(expense.payment_status)}>
                      {expense.payment_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                    {expense.is_recurring && (
                      <Badge variant="outline" className="ml-1 bg-blue-500/10 text-blue-500 border-blue-500/20">
                        Recurring
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-3.5 px-4 text-right align-middle">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleViewExpense(expense)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditExpense(expense)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the expense
                              and all associated payments and notes.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Expense */}
      {viewExpense && (
        <ExpenseView
          expense={viewExpense}
          open={isViewOpen}
          onOpenChange={setIsViewOpen}
          onEdit={handleEditExpense}
          onDelete={handleDeleteExpense}
        />
      )}

      {/* Edit Expense */}
      {editExpense && (
        <ExpenseForm
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSubmit={handleUpdateExpense}
          defaultValues={editExpense}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Add Expense */}
      <ExpenseForm
        open={isAddingExpense}
        onOpenChange={setIsAddingExpense}
        onSubmit={handleAddExpense}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
