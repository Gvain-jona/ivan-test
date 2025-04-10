// Define application types

// Order types
export interface Order {
  id: string;
  client_id: string;
  client_name?: string;
  date: string;
  status: 'pending' | 'in_progress' | 'paused' | 'completed' | 'delivered';
  total_amount: number;
  amount_paid: number;
  balance: number;
  created_at: string;
  updated_at: string;
}

// Expense types
export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  installment: boolean;
  vat: number;
  created_at: string;
  updated_at: string;
}

// Material purchase types
export interface MaterialPurchase {
  id: string;
  supplier_id: string;
  supplier_name?: string;
  date: string;
  description: string;
  quantity: number;
  unit: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  installment: boolean;
  created_at: string;
  updated_at: string;
}

// Task types
export interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  linked_item_type: 'order' | 'expense' | 'purchase' | 'none';
  linked_item_id: string | null;
  created_at: string;
  updated_at: string;
}

// User role type
export type UserRole = 'admin' | 'manager' | 'employee';

// Pending invoice type
export interface PendingInvoice {
  order_id: string;
  client_name: string;
  date: string;
  amount: number;
}

// Summary item type
export interface SummaryItem {
  id: string;
  title: string;
  description?: string;
  date: string;
  status?: string;
  amount?: number;
} 