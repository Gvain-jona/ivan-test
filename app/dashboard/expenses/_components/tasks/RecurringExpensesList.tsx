'use client';

import { useState } from 'react';
import { useRecurringExpenses } from '../../_context/RecurringExpensesContext';
import { useMediaQuery } from '@/hooks/use-media-query';
import { ExpenseViewSheet } from '../view/ExpenseViewSheet';
import { FilterSection } from './FilterSection';
import { DateGroup } from './DateGroup';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';
import { useRecurringExpensesData } from './useRecurringExpensesData';
import { useExpenseActions } from './useExpenseActions';
import { useDebouncedSearch } from './useDebouncedSearch';
import { FilterType } from './types';
import { Expense } from '@/hooks/expenses';
import { Button } from '@/components/ui/button';

export function RecurringExpensesList() {
  // Filter options
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Check if we're in dark mode - we'll use this for theming
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const isDarkMode = typeof document !== 'undefined'
    ? document.documentElement.classList.contains('dark')
    : prefersDarkMode;

  // Use the recurring expenses context
  const {
    occurrences,
    isLoading,
    isError,
    isEmpty,
    updateOccurrenceStatus,
    refreshData,
    useClientSideFiltering,
    setUseClientSideFiltering
  } = useRecurringExpenses();

  // Use the debounced search hook
  const debouncedSearchQuery = useDebouncedSearch(searchQuery);

  // Use the recurring expenses data hook
  const {
    filteredOccurrences,
    groupedOccurrences,
    sortedDates,
    filterCounts
  } = useRecurringExpensesData(occurrences, filter, debouncedSearchQuery, useClientSideFiltering);

  // Use the expense actions hook
  const {
    editingExpenseId,
    viewExpense,
    isViewOpen,
    setIsViewOpen,
    handleStatusUpdate,
    handleEditExpense,
    handleExpenseUpdate,
    handleExpenseDelete
  } = useExpenseActions({
    refreshData,
    updateOccurrenceStatus
  });

  // Render the filter section
  const renderFilters = () => (
    <FilterSection
      filter={filter}
      setFilter={setFilter}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      filterCounts={filterCounts}
      isDarkMode={isDarkMode}
    />
  );

  // Loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Error state
  if (isError) {
    return <ErrorState renderFilters={renderFilters} />;
  }

  // Empty state
  if (isEmpty || sortedDates.length === 0) {
    return (
      <EmptyState
        renderFilters={renderFilters}
        isDarkMode={isDarkMode}
        searchQuery={debouncedSearchQuery}
        filter={filter}
      />
    );
  }

  // Main content
  return (
    <div className="space-y-4">
      {renderFilters()}

      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-muted-foreground">
          Showing {filteredOccurrences.length} of {occurrences.length} occurrences
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setUseClientSideFiltering(!useClientSideFiltering)}
          className="text-xs h-8"
        >
          {useClientSideFiltering ? "Use Server Filtering" : "Use Client Filtering"}
        </Button>
      </div>

      <div className="space-y-8">
        {sortedDates.map(dateKey => (
          <DateGroup
            key={dateKey}
            dateKey={dateKey}
            dateItems={groupedOccurrences[dateKey]}
            isDarkMode={isDarkMode}
            editingExpenseId={editingExpenseId}
            onStatusUpdate={handleStatusUpdate}
            onEdit={handleEditExpense}
          />
        ))}
      </div>

      {/* Expense View Sheet */}
      {viewExpense && (
        <ExpenseViewSheet
          expense={viewExpense}
          open={isViewOpen}
          onOpenChange={setIsViewOpen}
          onEdit={handleExpenseUpdate}
          onDelete={handleExpenseDelete}
          refreshExpense={refreshData}
        />
      )}
    </div>
  );
}
