// Re-export from the modularized expenses hooks for backward compatibility
import {
  Expense,
  ExpenseFilters,
  ExpenseNote,
  ExpensePayment,
  RecurringExpenseOccurrence,
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
