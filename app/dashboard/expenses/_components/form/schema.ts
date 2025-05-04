import { z } from 'zod';

/**
 * Standardized expense form schema
 * This schema is used by all expense form components
 */
export const expenseFormSchema = z.object({
  // General Information
  category: z.enum(['fixed', 'variable'], {
    required_error: 'Category is required',
    invalid_type_error: 'Category must be either "fixed" or "variable"',
  }),
  item_name: z.string().min(1, 'Item name is required'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0').default(1),
  unit_cost: z.coerce.number().nonnegative('Unit cost must be 0 or greater').default(0),
  responsible: z.string().optional(),
  total_amount: z.coerce.number().min(0, 'Amount must be greater than 0'),
  date: z.date(),
  vat: z.coerce.number().min(0).optional(),

  // Toggle Settings
  is_recurring: z.boolean().default(false),
  has_installments: z.boolean().default(false),
  has_notes: z.boolean().default(false),

  // Recurrence Settings
  recurrence_frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  recurrence_start_date: z.date().optional(),
  recurrence_end_date: z.date().optional(),
  reminder_days: z.coerce.number().int().nonnegative().optional(),

  // Advanced recurrence pattern settings
  recurrence_day_of_month: z.coerce.number().int().min(1).max(31).optional(),
  recurrence_month_of_year: z.coerce.number().int().min(1).max(12).optional(),
  recurrence_day_of_week: z.coerce.number().int().min(0).max(6).optional(), // 0 = Sunday, 6 = Saturday
  recurrence_week_of_month: z.coerce.number().int().min(1).max(5).optional(), // 1 = first week, 5 = last week
  recurrence_time: z.string().optional(), // For daily recurrence at specific time
  monthly_recurrence_type: z.enum(['day_of_month', 'day_of_week']).optional(), // To distinguish between the two monthly recurrence options

  // Payments - truly optional with empty array default
  payments: z.array(
    z.object({
      // Allow empty string for initial state, but validate as number when submitting
      amount: z.union([
        z.string().transform(val => val === '' ? 0 : parseFloat(val)),
        z.number()
      ]).refine(val => val > 0, 'Amount must be greater than 0'),
      date: z.date(),
      payment_method: z.string().min(1, 'Payment method is required'),
    })
  ).default([]),

  // Notes
  notes: z.array(
    z.object({
      type: z.string().min(1, 'Note type is required'),
      text: z.string().min(1, 'Note text is required'),
    })
  ).optional(),
});

/**
 * Type definition for expense form values
 */
export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

/**
 * Constants used in expense forms
 */
export const CATEGORIES = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'variable', label: 'Variable' },
];

export const RECURRENCE_FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export const DAYS_OF_WEEK = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

export const WEEKS_OF_MONTH = [
  { value: '1', label: 'First week' },
  { value: '2', label: 'Second week' },
  { value: '3', label: 'Third week' },
  { value: '4', label: 'Fourth week' },
  { value: '5', label: 'Last week' },
];

export const MONTHS_OF_YEAR = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export const PAYMENT_METHODS = [
  'cash',
  'bank_transfer',
  'credit_card',
  'cheque',
  'mobile_payment',
];

export const NOTE_TYPES = [
  'info',
  'follow_up',
  'urgent',
  'internal',
];
