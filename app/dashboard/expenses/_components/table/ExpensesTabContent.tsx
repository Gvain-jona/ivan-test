import React, { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Expense, useExpenses, ExpenseFilters } from '@/hooks/useExpenses';
import { ExpenseViewSheet } from '../view/ExpenseViewSheet';
import { ExpenseForm } from '../form';
import { ExpenseFilters as ExpenseFiltersComponent } from './ExpenseFilters';
import { ExpensesTable } from './ExpensesTable';
import { ExpensesPagination } from './ExpensesPagination';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/**
 * Main component for the expenses tab
 */
interface ExpensesTabContentProps {
  onRegisterHandleAddExpense?: (handleAddExpense: (values: any) => Promise<any>) => void;
}

export function ExpensesTabContent({ onRegisterHandleAddExpense }: ExpensesTabContentProps = {}) {
  const [viewExpense, setViewExpense] = useState<Expense | null>(null);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [showRecurring, setShowRecurring] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Number of items to display per page

  // Use debounced search to prevent excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Always use client-side filtering
  const useClientSideFiltering = true;
  const useServerSideFiltering = false;

  // Build filters - use debounced search query
  const filters: ExpenseFilters = useMemo(() => {
    // If using server-side filtering, include all filters
    if (useServerSideFiltering) {
      return {
        search: debouncedSearchQuery || undefined,
        startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
        paymentStatus: selectedStatus !== 'All'
          ? [selectedStatus.toLowerCase().replace(' ', '_')]
          : undefined,
        expense_type: selectedType !== 'All' ? [selectedType.toLowerCase()] : undefined,
        is_recurring: showRecurring,
      };
    }

    // Otherwise, only include minimal filters to fetch all data
    return {};
  }, [debouncedSearchQuery, dateRange, selectedStatus, selectedType, showRecurring, useServerSideFiltering]);

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

  // Listen for refresh events from the parent component
  useEffect(() => {
    const handleRefresh = () => {
      console.log('Refreshing expenses data...');
      mutate(); // Refresh the data
    };

    // Add event listener
    window.addEventListener('refresh-expenses', handleRefresh);

    // Clean up
    return () => {
      window.removeEventListener('refresh-expenses', handleRefresh);
    };
  }, [mutate]);

  // Only log in development mode to avoid performance impact in production
  if (process.env.NODE_ENV === 'development') {
    // Use more concise logging to reduce console clutter
    console.log('ExpensesTabContent - stats:', {
      count: Array.isArray(expenses) ? expenses.length : 0,
      isLoading,
      isEmpty
    });
  }

  // Ensure expenses is an array
  const safeExpenses = Array.isArray(expenses) ? expenses : [];

  // Apply client-side filtering if we're not using server-side filtering
  const filteredExpenses = useMemo(() => {
    // If using server-side filtering, just use the expenses as-is
    if (!useClientSideFiltering) {
      return safeExpenses;
    }

    // Otherwise, apply client-side filtering
    return safeExpenses.filter(expense => {
      // Filter by search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const itemName = (expense.item_name || '').toLowerCase();
        const category = (expense.category || '').toLowerCase();
        const description = (expense.description || '').toLowerCase();

        // Check if any of the fields contain the search query
        if (!itemName.includes(searchLower) &&
            !category.includes(searchLower) &&
            !description.includes(searchLower)) {
          return false;
        }
      }

      // Filter by date range
      if (dateRange && (dateRange.from || dateRange.to)) {
        const expenseDate = new Date(expense.date);

        // If from date is provided, filter out expenses before that date
        if (dateRange.from && expenseDate < dateRange.from) {
          return false;
        }

        // If to date is provided, filter out expenses after that date
        if (dateRange.to) {
          const toDateEnd = new Date(dateRange.to);
          toDateEnd.setHours(23, 59, 59, 999); // End of the day
          if (expenseDate > toDateEnd) {
            return false;
          }
        }
      }

      // Filter by payment status
      if (selectedStatus !== 'All') {
        const statusFilter = selectedStatus.toLowerCase().replace(' ', '_');
        if (expense.payment_status !== statusFilter) {
          return false;
        }
      }

      // Filter by expense type
      if (selectedType !== 'All') {
        const typeFilter = selectedType.toLowerCase();
        if (expense.category !== typeFilter) {
          return false;
        }
      }

      // Filter by recurring status
      if (showRecurring !== undefined) {
        if (expense.is_recurring !== showRecurring) {
          return false;
        }
      }

      // Include this expense
      return true;
    });
  }, [safeExpenses, searchQuery, dateRange, selectedStatus, selectedType, showRecurring, useClientSideFiltering]);

  // Calculate pagination
  const totalItems = filteredExpenses.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Get paginated expenses
  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredExpenses.slice(startIndex, endIndex);
  }, [filteredExpenses, currentPage, itemsPerPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of the table
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle view expense
  const handleViewExpense = (expense: Expense) => {
    // Log the expense structure for debugging
    console.log('Viewing expense with structure:', {
      id: expense.id,
      hasPayments: !!expense.payments,
      paymentsCount: Array.isArray(expense.payments) ? expense.payments.length : 0,
      hasNotes: !!expense.notes,
      notesCount: Array.isArray(expense.notes) ? expense.notes.length : 0
    });

    // Ensure expense has payments and notes arrays
    const expenseWithArrays = {
      ...expense,
      payments: Array.isArray(expense.payments) ? expense.payments : [],
      notes: Array.isArray(expense.notes) ? expense.notes : []
    };

    setViewExpense(expenseWithArrays);
    setIsViewOpen(true);
  };

  // Handle edit expense - now always goes through the view sheet
  const handleEditExpense = async (expense: Expense) => {
    // Log the expense structure for debugging
    console.log('Editing expense with structure:', {
      id: expense.id,
      hasPayments: !!expense.payments,
      paymentsCount: Array.isArray(expense.payments) ? expense.payments.length : 0,
      hasNotes: !!expense.notes,
      notesCount: Array.isArray(expense.notes) ? expense.notes.length : 0
    });

    // Ensure expense has payments and notes arrays
    const expenseWithArrays = {
      ...expense,
      payments: Array.isArray(expense.payments) ? expense.payments : [],
      notes: Array.isArray(expense.notes) ? expense.notes : []
    };

    // Check if this is an update from the view sheet
    if (viewExpense && viewExpense.id === expense.id) {
      try {
        console.log('Updating expense from view sheet:', expense);

        // Update the view expense with the updated data
        setViewExpense(expenseWithArrays);

        // Call the updateExpense function to persist the changes to the server
        // Only update the basic expense data, not payments or notes
        // as those are handled by separate API calls
        const result = await updateExpense(expense.id, {
          category: expense.category,
          item_name: expense.item_name,
          quantity: expense.quantity,
          unit_cost: expense.unit_cost,
          responsible: expense.responsible,
          total_amount: expense.total_amount,
          date: expense.date,
          vat: expense.vat || 0,
          is_recurring: expense.is_recurring,
          recurrence_frequency: expense.recurrence_frequency,
          recurrence_start_date: expense.recurrence_start_date,
          recurrence_end_date: expense.recurrence_end_date,
          reminder_days: expense.reminder_days,
          recurrence_day_of_week: expense.recurrence_day_of_week,
          recurrence_day_of_month: expense.recurrence_day_of_month,
          recurrence_week_of_month: expense.recurrence_week_of_month,
          recurrence_month_of_year: expense.recurrence_month_of_year,
          recurrence_time: expense.recurrence_time,
          monthly_recurrence_type: expense.monthly_recurrence_type,
        });

        // Return the updated expense
        return expenseWithArrays;
      } catch (error) {
        console.error('Error updating expense:', error);
        toast.error('Failed to update expense');
        throw error;
      }
    } else {
      // This is a new view request, just set the view expense and open the view sheet
      setViewExpense(expenseWithArrays);
      setIsViewOpen(true);
      return expenseWithArrays;
    }
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
      console.log('Starting expense creation process in ExpensesTabContent...');

      // Validate category
      if (!values.category || !['fixed', 'variable'].includes(values.category)) {
        throw new Error('Invalid category value. Must be either "fixed" or "variable".');
      }

      // Calculate total amount if not already set
      if (values.quantity && values.unit_cost && !values.total_amount) {
        values.total_amount = values.quantity * values.unit_cost;
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

      // Log that we're about to call createExpense
      console.log('Calling createExpense from ExpensesTabContent...');

      // Make the API call - this will set isSubmitting to true internally in the hook
      const result = await createExpense(
        {
          category: values.category, // Use the correct field name
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

      console.log('Expense created successfully in ExpensesTabContent:', result);

      // The toast notification is now handled in the useExpensesList hook
      // to avoid duplicate notifications

      // Return the result to indicate success to the form
      return result;
    } catch (error) {
      console.error('Error adding expense in ExpensesTabContent:', error);

      // Improved error handling
      let errorMessage = 'Failed to add expense';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        try {
          errorMessage = JSON.stringify(error);
        } catch (e) {
          console.error('Error stringifying error object:', e);
        }
      }

      // Re-throw with better error message
      // The form component will catch this and display it
      throw new Error(errorMessage);
    }
  };

  // Handle update expense
  const handleUpdateExpense = async (values: any) => {
    if (!editExpense) return;

    try {
      console.log('Starting expense update process in ExpensesTabContent...');

      // Validate category
      if (!values.category || !['fixed', 'variable'].includes(values.category)) {
        throw new Error('Invalid category value. Must be either "fixed" or "variable".');
      }

      // Calculate total amount if not already set
      if (values.quantity && values.unit_cost && !values.total_amount) {
        values.total_amount = values.quantity * values.unit_cost;
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

      // Log that we're about to call updateExpense
      console.log('Calling updateExpense from ExpensesTabContent...');

      // Make the API call - this will set isSubmitting to true internally in the hook
      const result = await updateExpense(editExpense.id, {
        category: values.category, // Use the correct field name
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

      console.log('Expense updated successfully in ExpensesTabContent:', result);

      // The toast notification is now handled in the useExpensesList hook
      // to avoid duplicate notifications

      // Close the edit form after successful update
      setIsEditOpen(false);

      // Return the result to indicate success to the form
      return result;
    } catch (error) {
      console.error('Error updating expense in ExpensesTabContent:', error);

      // Improved error handling
      let errorMessage = 'Failed to update expense';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        try {
          errorMessage = JSON.stringify(error);
        } catch (e) {
          console.error('Error stringifying error object:', e);
        }
      }

      // Re-throw with better error message
      // The form component will catch this and display it
      throw new Error(errorMessage);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setDateRange(undefined);
    setSelectedStatus('All');
    setSelectedType('All');
    setShowRecurring(undefined);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, dateRange, selectedStatus, selectedType, showRecurring]);

  // Register the handleAddExpense function with the parent component
  useEffect(() => {
    if (onRegisterHandleAddExpense) {
      console.log('Registering handleAddExpense function with parent component');
      onRegisterHandleAddExpense(handleAddExpense);
    }
  }, [onRegisterHandleAddExpense, handleAddExpense]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <ExpenseFiltersComponent
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dateRange={dateRange}
        setDateRange={setDateRange}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        showRecurring={showRecurring}
        setShowRecurring={setShowRecurring}
        resetFilters={resetFilters}
      />

      {/* Expenses Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-muted-foreground">
            <span>Showing {filteredExpenses.length} of {safeExpenses.length} expenses</span>
          </div>
        </div>
        <ExpensesTable
          expenses={paginatedExpenses}
          isLoading={isLoading && safeExpenses.length === 0} // Only show loading when we have no data
          isEmpty={!isLoading && (isEmpty || filteredExpenses.length === 0)}
          onViewExpense={handleViewExpense}
          onEditExpense={handleEditExpense}
          onDeleteExpense={handleDeleteExpense}
          onAddExpense={() => setIsAddingExpense(true)}
        />

        {/* Pagination - only show if we have data and more than one page */}
        {!isLoading && !isEmpty && safeExpenses.length > 0 && totalPages > 1 && (
          <ExpensesPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            className="mt-4"
          />
        )}
      </div>

      {/* View Expense */}
      {viewExpense && (
        <ExpenseViewSheet
          expense={viewExpense}
          open={isViewOpen}
          onOpenChange={setIsViewOpen}
          onEdit={handleEditExpense}
          onDelete={handleDeleteExpense}
          refreshExpense={() => mutate()}
        />
      )}

      {/* Edit Expense - Now handled through the ExpenseViewSheet */}

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
