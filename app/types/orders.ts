export type OrderStatus = 'pending' | 'in_progress' | 'paused' | 'completed' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid';
export type ClientType = 'regular' | 'contract';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'cheque' | 'mobile_payment';
export type NoteType = 'info' | 'client_follow_up' | 'urgent' | 'internal';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Client {
  id: string;
  name: string;
  address?: string;
  contact?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  name: string;
  category_id: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  category_id: string;
  category_name: string;
  item_name: string;
  size?: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface OrderPayment {
  id: string;
  order_id: string;
  amount: number;
  // Use date as the primary field to match the database schema
  date: string;
  payment_method: PaymentMethod;
  created_at: string;
  updated_at: string;
}

export interface OrderNote {
  id: string;
  type: NoteType;
  text: string;
  linked_item_type: string;
  linked_item_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  order_id: string;
  invoice_number: string;
  invoice_date: string;
  file_url: string;
  storage_path: string;
  is_proforma: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number?: string; // Added order_number field
  client_id: string;
  client_name: string; // Now required
  client_type: ClientType;
  date: string;
  delivery_date?: string; // Added delivery_date field
  is_delivered?: boolean; // Added is_delivered field
  status: OrderStatus;
  payment_status?: PaymentStatus;
  total_amount: number;
  amount_paid: number;
  balance: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  invoice_generated_at?: string;
  items: OrderItem[];
  notes?: OrderNote[];
  payments?: OrderPayment[];
  invoice?: Invoice;
  // payment_method has been removed as it's no longer in the orders table
}

export interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
  linked_item_type: string;
  linked_item_id: string;
  recurring: boolean;
  assigned_to: string;
  assigned_to_name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  linked_order_number?: string;
}

export interface OrdersTableFilters {
  status?: OrderStatus[];
  paymentStatus?: PaymentStatus[];
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface TasksFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignedTo?: string[];
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface OrdersResponse {
  orders: Order[];
  totalCount: number;
  pageCount: number;
}

export interface TasksResponse {
  tasks: Task[];
  totalCount: number;
  pageCount: number;
}