// Re-export from the modularized expenses hooks for backward compatibility
import type {
  Expense,
  ExpenseFilters,
  ExpenseNote,
  ExpensePayment,
  RecurringExpenseOccurrence} from './expenses';
import {
  useExpensesList as useExpenses,
  useExpenseDetails as useExpense,
  useRecurringExpenses
} from './expenses';

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
  useRecurringExpenses
};
