/**
 * Database Schema Validation
 *
 * This file contains Zod schemas for database entities to ensure
 * type safety between the database and frontend application.
 */

import { z } from 'zod';

// Base schema with common fields for most entities
const baseEntitySchema = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
});

// Profile schema (extends Supabase Auth users)
export const profileSchema = baseEntitySchema.extend({
  full_name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'staff']),
  status: z.enum(['active', 'inactive', 'locked']),
  pin: z.string().nullable().optional(), // Bcrypt-hashed 4-digit PIN
  verification_code: z.string().nullable().optional(),
  code_expiry: z.string().datetime().nullable().optional(),
  is_verified: z.boolean().default(false).optional(),
  failed_attempts: z.number().default(0).optional(),
  devices: z.array(z.any()).default([]).optional(),
});

export type Profile = z.infer<typeof profileSchema>;

// For backward compatibility
export const userSchema = profileSchema;
export type User = Profile;

// Client schema
export const clientSchema = baseEntitySchema.extend({
  name: z.string().min(1),
});

export type Client = z.infer<typeof clientSchema>;

// Category schema
export const categorySchema = baseEntitySchema.extend({
  name: z.string().min(1),
});

export type Category = z.infer<typeof categorySchema>;

// Item schema
export const itemSchema = baseEntitySchema.extend({
  name: z.string().min(1),
  description: z.string().optional(),
  category_id: z.string().uuid(),
});

export type Item = z.infer<typeof itemSchema>;

// Order schema
export const orderSchema = baseEntitySchema.extend({
  client_id: z.string().uuid(),
  created_by: z.string().uuid(),
  date: z.string().or(z.date()),
  total_amount: z.number().nonnegative(),
  amount_paid: z.number().nonnegative(),
  balance: z.number().nonnegative(),
  status: z.enum(['pending', 'completed', 'canceled']),
  payment_status: z.enum(['unpaid', 'partially_paid', 'paid']),
  // Virtual fields for frontend
  client_name: z.string().optional(),
  items: z.array(z.any()).optional(),
  payments: z.array(z.any()).optional(),
  notes: z.array(z.any()).optional(),
});

export type Order = z.infer<typeof orderSchema>;

// Order Item schema
export const orderItemSchema = baseEntitySchema.extend({
  order_id: z.string().uuid(),
  item_id: z.string().uuid(),
  category_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  unit_price: z.number().nonnegative(),
  total_amount: z.number().nonnegative(),
  // Virtual fields for frontend
  item_name: z.string().optional(),
  category_name: z.string().optional(),
});

export type OrderItem = z.infer<typeof orderItemSchema>;

// Order Payment schema
export const orderPaymentSchema = baseEntitySchema.extend({
  order_id: z.string().uuid(),
  amount: z.number().positive(),
  payment_date: z.string().or(z.date()),
  payment_type: z.enum(['cash', 'bank_transfer', 'mobile_payment', 'cheque']),
});

export type OrderPayment = z.infer<typeof orderPaymentSchema>;

// Supplier schema
export const supplierSchema = baseEntitySchema.extend({
  name: z.string().min(1),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export type Supplier = z.infer<typeof supplierSchema>;

// Expense schema
export const expenseSchema = baseEntitySchema.extend({
  category: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().nonnegative(),
  total_amount: z.number().nonnegative(),
  amount_paid: z.number().nonnegative(),
  balance: z.number().nonnegative(),
  date: z.string().or(z.date()),
  created_by: z.string().uuid(),
  // Virtual fields for frontend
  payments: z.array(z.any()).optional(),
  notes: z.array(z.any()).optional(),
});

export type Expense = z.infer<typeof expenseSchema>;

// Expense Payment schema
export const expensePaymentSchema = baseEntitySchema.extend({
  expense_id: z.string().uuid(),
  amount: z.number().positive(),
  payment_date: z.string().or(z.date()),
  payment_type: z.enum(['cash', 'bank_transfer', 'mobile_payment', 'cheque']),
});

export type ExpensePayment = z.infer<typeof expensePaymentSchema>;

// Material Purchase schema
export const materialPurchaseSchema = baseEntitySchema.extend({
  supplier_id: z.string().uuid(),
  date: z.string().or(z.date()),
  description: z.string().min(1),
  quantity: z.number().int().positive(),
  unit: z.string().optional(),
  total_amount: z.number().nonnegative(),
  amount_paid: z.number().nonnegative(),
  balance: z.number().nonnegative(),
  installment: z.boolean().default(false),
  created_by: z.string().uuid(),
  // Virtual fields for frontend
  supplier_name: z.string().optional(),
  payments: z.array(z.any()).optional(),
  notes: z.array(z.any()).optional(),
});

export type MaterialPurchase = z.infer<typeof materialPurchaseSchema>;

// Material Purchase Payment schema
export const materialPurchasePaymentSchema = baseEntitySchema.extend({
  material_purchase_id: z.string().uuid(),
  amount: z.number().positive(),
  payment_date: z.string().or(z.date()),
  payment_type: z.enum(['cash', 'bank_transfer', 'mobile_payment', 'cheque']),
});

export type MaterialPurchasePayment = z.infer<typeof materialPurchasePaymentSchema>;

// Task schema
export const taskSchema = baseEntitySchema.extend({
  title: z.string().min(1),
  description: z.string().optional(),
  due_date: z.string().or(z.date()).optional(),
  assigned_to: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['pending', 'in-progress', 'completed']),
  linked_item_type: z.string().optional(),
  linked_item_id: z.string().uuid().optional(),
  recurring: z.boolean().default(false),
  recurrence_frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  created_by: z.string().uuid(),
  // Virtual fields for frontend
  assigned_user_name: z.string().optional(),
  created_by_name: z.string().optional(),
});

export type Task = z.infer<typeof taskSchema>;

// Note schema
export const noteSchema = baseEntitySchema.extend({
  type: z.string().min(1),
  text: z.string().min(1),
  linked_item_type: z.string().optional(),
  linked_item_id: z.string().uuid().optional(),
  created_by: z.string().uuid(),
  // Virtual fields for frontend
  created_by_name: z.string().optional(),
});

export type Note = z.infer<typeof noteSchema>;

// Notification schema
export const notificationSchema = baseEntitySchema.extend({
  user_id: z.string().uuid(),
  type: z.string().min(1),
  message: z.string().min(1),
  push_message: z.string().optional(),
  data: z.string().optional(),
  status: z.enum(['unread', 'read']).default('unread'),
});

export type Notification = z.infer<typeof notificationSchema>;

// Settings schema
export const settingsSchema = baseEntitySchema.extend({
  key: z.string().min(1),
  value: z.any(),
});

export type Settings = z.infer<typeof settingsSchema>;

// Approval schema
export const approvalSchema = baseEntitySchema.extend({
  requester_id: z.string().uuid(),
  approver_id: z.string().uuid().optional(),
  action: z.string().min(1),
  item_type: z.string().min(1),
  item_id: z.string().uuid(),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  // Virtual fields for frontend
  requester_name: z.string().optional(),
  approver_name: z.string().optional(),
});

export type Approval = z.infer<typeof approvalSchema>;

// Session schema
export const sessionSchema = baseEntitySchema.extend({
  user_id: z.string().uuid(),
  expires_at: z.string().datetime(),
  device_id: z.string(),
});

export type Session = z.infer<typeof sessionSchema>;

// Validation functions for common database operations
export const validateOrder = (data: unknown) => orderSchema.parse(data);
export const validateOrderItem = (data: unknown) => orderItemSchema.parse(data);
export const validateOrderPayment = (data: unknown) => orderPaymentSchema.parse(data);
export const validateTask = (data: unknown) => taskSchema.parse(data);
export const validateClient = (data: unknown) => clientSchema.parse(data);
export const validateCategory = (data: unknown) => categorySchema.parse(data);
export const validateItem = (data: unknown) => itemSchema.parse(data);
export const validateSupplier = (data: unknown) => supplierSchema.parse(data);
export const validateExpense = (data: unknown) => expenseSchema.parse(data);
export const validateMaterialPurchase = (data: unknown) => materialPurchaseSchema.parse(data);
export const validateNote = (data: unknown) => noteSchema.parse(data);
export const validateNotification = (data: unknown) => notificationSchema.parse(data);
export const validateProfile = (data: unknown) => profileSchema.parse(data);
export const validateUser = (data: unknown) => profileSchema.parse(data); // For backward compatibility
export const validateSession = (data: unknown) => sessionSchema.parse(data);

// Partial validation for updates
export const validateOrderUpdate = (data: unknown) => orderSchema.partial().parse(data);
export const validateTaskUpdate = (data: unknown) => taskSchema.partial().parse(data);
export const validateExpenseUpdate = (data: unknown) => expenseSchema.partial().parse(data);
export const validateMaterialPurchaseUpdate = (data: unknown) => materialPurchaseSchema.partial().parse(data);
export const validateProfileUpdate = (data: unknown) => profileSchema.partial().parse(data);
export const validateUserUpdate = (data: unknown) => profileSchema.partial().parse(data); // For backward compatibility