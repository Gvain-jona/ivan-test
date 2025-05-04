/**
 * Material Purchases Types
 * This file centralizes all types related to material purchases
 */

/**
 * Material Purchase type
 * Represents a purchase of materials from a supplier
 * Aligned with the database schema
 */
export interface MaterialPurchase {
  id: string;
  supplier_id?: string;
  supplier_name: string;
  material_name: string;
  date: string;
  quantity: number;
  unit?: string; // Unit of measurement (e.g., kg, liters, pieces)
  unit_price?: number; // Price per unit
  total_amount: number;
  amount_paid: number;
  balance: number; // Calculated field (total_amount - amount_paid)
  payment_status: 'unpaid' | 'partially_paid' | 'paid';
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Installment payment fields
  installment_plan: boolean;
  total_installments?: number;
  installments_paid?: number;
  next_payment_date?: string;
  payment_frequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  reminder_days?: number;
  // Related data (not in database schema, but used in UI)
  // Making these non-optional with default empty arrays to ensure consistency
  payments: MaterialPayment[];
  installments: MaterialInstallment[];
  purchase_notes: MaterialNote[];
}

/**
 * Material Payment type
 * Represents a payment made for a material purchase
 * Aligned with the database schema
 */
export interface MaterialPayment {
  id: string;
  purchase_id: string;
  amount: number;
  date: string;
  payment_method: string; // In database schema as 'payment_method'
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Material Installment type
 * Represents an installment payment plan for a material purchase
 * Aligned with the database schema
 */
export interface MaterialInstallment {
  id: string;
  purchase_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  payment_id?: string; // Foreign key to material_payments table (if paid)
  created_at: string;
  updated_at: string;
}

/**
 * Material Note type
 * Represents a note attached to a material purchase
 * Aligned with the database schema
 */
export interface MaterialNote {
  id: string;
  purchase_id: string;
  type: string; // Type of note (default: 'note')
  text: string; // Content of the note
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * API Response Types
 */
export interface MaterialPurchasesResponse {
  purchases: MaterialPurchase[];
  total: number;
  page: number;
  limit: number;
}

export interface MaterialPurchaseResponse {
  purchase: MaterialPurchase;
}

export interface MaterialPaymentsResponse {
  payments: MaterialPayment[];
}

export interface MaterialInstallmentsResponse {
  installments: MaterialInstallment[];
}

export interface MaterialPurchaseNotesResponse {
  notes: MaterialNote[];
}

/**
 * Filter and Pagination Types
 */
export interface MaterialPurchaseFilters {
  supplier?: string;
  startDate?: string;
  endDate?: string;
  paymentStatus?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Form Data Types
 * These types are used for form inputs and may include calculated fields not in the database
 */
export interface MaterialPurchaseFormData {
  supplier_name: string;
  material_name: string;
  date: string;
  quantity: number;
  unit?: string; // Unit of measurement (e.g., kg, liters, pieces)
  unit_price: number; // Price per unit
  total_amount: number;
  amount_paid?: number;
  notes?: string;
  installment_plan?: boolean;
  total_installments?: number;
  payment_frequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  next_payment_date?: string;
  reminder_days?: number;
}

export interface MaterialPaymentFormData {
  amount: number;
  date: string;
  payment_method: string;
  notes?: string;
}

export interface MaterialInstallmentFormData {
  total_installments: number;
  payment_frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  first_payment_date: string;
  reminder_days?: number;
}

export interface MaterialNoteFormData {
  type: string;
  text: string;
}
