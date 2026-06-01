import { z } from 'zod';

export const OrderStatusSchema = z.enum([
  'pending',
  'in_progress',
  'paused',
  'completed',
  'delivered',
  'cancelled',
]);

export const PaymentStatusSchema = z.enum(['unpaid', 'partially_paid', 'paid']);

export const PaymentMethodSchema = z.enum([
  'cash',
  'bank_transfer',
  'credit_card',
  'cheque',
  'mobile_payment',
]);

export const NoteTypeSchema = z.enum(['info', 'client_follow_up', 'urgent', 'internal']);

export const ClientTypeSchema = z.enum(['regular', 'contract']);

export const OrderItemInputSchema = z.object({
  item_name: z.string().min(1, 'Item name is required'),
  category_name: z.string().min(1, 'Category name is required'),
  size: z.string().optional(),
  quantity: z.number().positive('Quantity must be positive'),
  unit_price: z.number().nonnegative('Unit price cannot be negative'),
  item_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
});

export const OrderPaymentInputSchema = z.object({
  amount: z.number().positive('Payment amount must be positive'),
  date: z.string().min(1, 'Payment date is required'),
  payment_method: PaymentMethodSchema,
});

export const OrderNoteInputSchema = z.object({
  type: NoteTypeSchema,
  text: z.string().min(1, 'Note text is required'),
});

export const CreateOrderSchema = z.object({
  clientId: z.string().uuid().optional(),
  clientName: z.string().min(1, 'Client name is required'),
  date: z.string().min(1, 'Order date is required'),
  deliveryDate: z.string().optional().nullable(),
  isDelivered: z.boolean().optional().default(false),
  status: OrderStatusSchema,
  clientType: ClientTypeSchema.optional().default('regular'),
  items: z.array(OrderItemInputSchema).min(1, 'At least one item is required'),
  payments: z.array(OrderPaymentInputSchema).optional().default([]),
  notes: z.array(OrderNoteInputSchema).optional().default([]),
});

export const UpdateOrderStatusSchema = z.object({
  status: OrderStatusSchema,
});

export const AddOrderItemSchema = z.object({
  item: OrderItemInputSchema,
});

export const UpdateOrderItemSchema = z.object({
  item: OrderItemInputSchema.extend({
    item_name_original: z.string().optional(),
    category_name_original: z.string().optional(),
  }),
});

export const AddOrderPaymentSchema = z.object({
  payment: OrderPaymentInputSchema,
});

export const AddOrderNoteSchema = z.object({
  note: OrderNoteInputSchema,
});

export const InlineEditSchema = z.object({
  items: z
    .array(
      OrderItemInputSchema.extend({
        id: z.string().uuid().optional(),
        item_name_original: z.string().optional(),
        category_name_original: z.string().optional(),
      }),
    )
    .optional(),
  payments: z
    .array(
      OrderPaymentInputSchema.extend({
        id: z.string().uuid().optional(),
      }),
    )
    .optional(),
  notes: z
    .array(
      OrderNoteInputSchema.extend({
        id: z.string().uuid().optional(),
        created_by: z.string().uuid().optional(),
      }),
    )
    .optional(),
});
