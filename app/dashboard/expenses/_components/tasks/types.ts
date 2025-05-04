// Define types for recurring expenses
export interface RecurringExpense {
  id: string;
  item_name?: string;
  amount?: number;
  category?: string;
  date?: string;
  is_recurring?: boolean;
  recurrence_frequency?: string;
  next_occurrence_date?: string;
  total_amount?: number;
  [key: string]: any;
}

export interface RecurringExpenseOccurrence {
  id: string;
  parent_expense_id: string;
  occurrence_date: string;
  status: OccurrenceStatus;
  expense?: RecurringExpense;
  linked_expense_id?: string;
  completed_date?: string;
  [key: string]: any;
}

export type OccurrenceStatus = 'pending' | 'completed' | 'skipped';

export type FilterType = 'all' | 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek' | 'thisMonth' | 'upcoming' | 'overdue' | 'completed';

// Constants
export const FILTER_LABELS: Record<string, string> = {
  all: 'All',
  today: 'Today',
  tomorrow: 'Tomorrow',
  thisWeek: 'This Week',
  nextWeek: 'Next Week',
  thisMonth: 'This Month',
  upcoming: 'Upcoming',
  overdue: 'Overdue',
  completed: 'Completed'
};
