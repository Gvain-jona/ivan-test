// This file is now a re-export from the expenses directory
// For backward compatibility, we're keeping the same exports
// but they now come from the modularized files

import {
  Expense,
  ExpenseFilters,
  ExpenseNote,
  ExpensePayment,
  RecurringExpenseOccurrence,
  useExpensesList as useExpenses,
  useExpenseDetails as useExpense,
  useExpenseCategories,
  useExpenseStats,
  useRecurringExpenses
} from './expenses';

// Re-export all types and hooks
export type {
  Expense,
  ExpenseFilters,
  ExpenseNote,
  ExpensePayment,
  RecurringExpenseOccurrence
};

export {
  useExpenses,
  useExpense,
  useExpenseCategories,
  useExpenseStats,
  useRecurringExpenses
};
