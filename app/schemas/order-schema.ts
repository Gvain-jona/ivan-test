import { z } from 'zod';
import { OrderStatus, PaymentMethod, NoteType, ClientType } from '@/types/orders';

// Order Item Schema
export const orderItemSchema = z.object({
  id: z.string().optional(),
  order_id: z.string().optional(),
  item_id: z.string(),
  category_id: z.string(),
  category_name: z.string().min(1, "Category is required"),
  item_name: z.string().min(1, "Item name is required"),
  size: z.string().min(1, "Size is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unit_price: z.number().min(0, "Unit price cannot be negative"),
  total_amount: z.number().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Order Payment Schema
export const orderPaymentSchema = z.object({
  id: z.string().optional(),
  order_id: z.string().optional(),
  amount: z.number().min(0.01, "Payment amount must be greater than 0"),
  payment_date: z.string().min(1, "Payment date is required"),
  payment_method: z.enum(["cash", "bank_transfer", "credit_card", "cheque", "mobile_payment"] as const, {
    errorMap: () => ({ message: "Please select a valid payment method" }),
  }),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Order Note Schema
export const orderNoteSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["info", "client_follow_up", "urgent", "internal"] as const, {
    errorMap: () => ({ message: "Please select a valid note type" }),
  }),
  text: z.string().min(1, "Note text is required"),
  linked_item_type: z.string().optional(),
  linked_item_id: z.string().optional(),
  created_by: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Complete Order Schema
export const orderSchema = z.object({
  id: z.string().optional(),
  client_id: z.string().min(1, "Client is required"),
  client_name: z.string().optional(),
  client_type: z.enum(["regular", "contract"] as const, {
    errorMap: () => ({ message: "Please select a valid client type" }),
  }),
  date: z.string().min(1, "Order date is required"),
  status: z.enum(["pending", "in_progress", "paused", "completed", "delivered", "cancelled"] as const, {
    errorMap: () => ({ message: "Please select a valid order status" }),
  }),
  payment_status: z.enum(["unpaid", "partially_paid", "paid"] as const).optional(),
  total_amount: z.number().min(0).optional(),
  amount_paid: z.number().min(0).optional(),
  balance: z.number().optional(),
  created_by: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  payments: z.array(orderPaymentSchema).optional(),
  notes: z.array(orderNoteSchema).optional(),
});

export type OrderFormValues = z.infer<typeof orderSchema>;
export type OrderItemFormValues = z.infer<typeof orderItemSchema>;
export type OrderPaymentFormValues = z.infer<typeof orderPaymentSchema>;
export type OrderNoteFormValues = z.infer<typeof orderNoteSchema>;
