// Types for expense-related hooks

export interface ExpensePayment {
  id: string;
  expense_id: string;
  amount: number;
  date: string;
  payment_method: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExpenseNote {
  id: string;
  expense_id?: string; // For the new expense_notes table
  linked_item_type?: string; // For backward compatibility with the old notes table
  linked_item_id?: string; // For backward compatibility with the old notes table
  type: string;
  text: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RecurringExpenseOccurrence {
  id: string;
  parent_expense_id: string;
  occurrence_date: string;
  status: 'pending' | 'completed' | 'skipped';
  created_at?: string;
  updated_at?: string;
}

export interface Expense {
  id: string;
  category: 'fixed' | 'variable';
  item_name: string;
  quantity: number;
  unit_cost: number;
  responsible?: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  date: string;
  payment_status: 'unpaid' | 'partially_paid' | 'paid';
  vat?: number;
  is_recurring: boolean;
  recurrence_frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  recurrence_start_date?: string;
  recurrence_end_date?: string;
  next_occurrence_date?: string;
  reminder_days?: number;
  notes?: ExpenseNote[];
  created_by?: string | { id: string; full_name: string };
  created_at?: string;
  updated_at?: string;
  payments?: ExpensePayment[];
  // Keep description as optional for backward compatibility with existing data
  description?: string;
}

export interface ExpenseFilters {
  category?: string[];
  paymentStatus?: string[];
  is_recurring?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}
