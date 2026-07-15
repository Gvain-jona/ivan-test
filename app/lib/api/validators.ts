import { z } from 'zod';
import type { Json } from '@/types/supabase-v2';

/**
 * v2 API schemas — STRUCTURAL validation only. Field-level rules for
 * custom_data (types, required, select options, cross-tenant refs) are
 * enforced by the v2.validate_custom_data DB trigger with precise
 * messages; routes surface those via handleSupabaseError (P0001).
 * Convention from the DB handoff: omit absent keys, never send null
 * inside custom_data.
 */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
// Values come from request.json(), so they are JSON by construction;
// the assertion only reconciles zod's `unknown` with the DB `Json` type.
const customData = z.record(z.unknown()) as unknown as z.ZodType<Record<string, Json>>;

export const clientCreateSchema = z.object({
  name: z.string().trim().min(1),
  status: z.enum(['active', 'archived']).optional(),
  custom_data: customData.optional(),
});

export const clientUpdateSchema = clientCreateSchema.partial().refine(
  d => Object.keys(d).length > 0,
  { message: 'At least one field is required' },
);

export const productCreateSchema = z.object({
  name: z.string().trim().min(1),
  selling_price: z.number().nonnegative().nullable().optional(),
  status: z.enum(['active', 'archived', 'draft']).optional(),
  name_variants: z.array(z.string().trim().min(1)).optional(),
  custom_data: customData.optional(),
});

export const productUpdateSchema = productCreateSchema.partial().refine(
  d => Object.keys(d).length > 0,
  { message: 'At least one field is required' },
);

export const orderItemInputSchema = z
  .object({
    product_id: z.string().uuid().nullish(),
    // Nullish: catalog lines send an explicit null (the catalog owns
    // the name); free-text lines send the string.
    product_name_raw: z.string().trim().min(1).nullish(),
    quantity: z.number().positive(),
    unit_price: z.number().nonnegative(),
    discount: z.number().nonnegative().optional(),
    custom_data: customData.optional(),
  })
  .refine(i => i.product_id != null || i.product_name_raw != null, {
    message: 'Each item needs a product_id or a product_name_raw',
  });

/**
 * PATCH on a single order line. Partial by design: the route merges
 * with the current row, re-checks the product_id-or-name invariant on
 * the merged result, and recomputes total_amount server-side
 * (qty × price − discount; order_items.total_amount is app-computed,
 * not a generated column). Explicit null clears product_id (back to a
 * free-text line) or product_name_raw (name comes from the catalog).
 */
export const orderItemUpdateSchema = z
  .object({
    product_id: z.string().uuid().nullish(),
    product_name_raw: z.string().trim().min(1).nullish(),
    quantity: z.number().positive().optional(),
    unit_price: z.number().nonnegative().optional(),
    discount: z.number().nonnegative().optional(),
    custom_data: customData.optional(),
  })
  .refine(d => Object.keys(d).length > 0, { message: 'At least one field is required' });

export const paymentInputSchema = z.object({
  amount: z.number().positive(),
  payment_method: z.enum(['cash', 'mobile_money', 'bank', 'credit']).optional(),
  payment_date: isoDate.optional(),
  notes: z.string().trim().min(1).optional(),
});

export const orderCreateSchema = z.object({
  client_id: z.string().uuid(),
  order_date: isoDate.optional(),
  status: z.string().trim().min(1).optional(),
  custom_data: customData.optional(),
  items: z.array(orderItemInputSchema).min(1),
  payments: z.array(paymentInputSchema).optional(),
});

/**
 * total_amount / amount_paid / balance / payment_status are absent on
 * purpose: trigger-maintained or generated columns, read-only for the API.
 */
export const orderUpdateSchema = z
  .object({
    client_id: z.string().uuid().optional(),
    order_date: isoDate.optional(),
    status: z.string().trim().min(1).optional(),
    custom_data: customData.optional(),
  })
  .refine(d => Object.keys(d).length > 0, { message: 'At least one field is required' });

export const fieldEntitySchema = z.enum(['client', 'order', 'order_item', 'product']);

export const fieldDefinitionCreateSchema = z.object({
  entity: fieldEntitySchema,
  field_name: z
    .string()
    .regex(/^[a-z][a-z0-9_]{0,62}$/, 'Lowercase machine key, e.g. delivery_date'),
  field_label: z.string().trim().min(1),
  field_type: z.enum(['text', 'number', 'date', 'boolean', 'select', 'relation', 'dimension']),
  is_required: z.boolean().optional(),
  is_unique: z.boolean().optional(),
  options: z.array(z.string().trim().min(1)).optional(),
  related_entity: z.string().trim().min(1).optional(),
  display_field: z.string().trim().min(1).optional(),
  conditions: customData.optional(),
  field_group: z.string().trim().min(1).optional(),
  show_in_documents: z.boolean().optional(),
  inherit_from: z.string().trim().min(1).optional(),
  sort_order: z.number().int().optional(),
});

export const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const documentEntitySchema = z.enum(['order', 'expense', 'client']);
export const documentTypeSchema = z.enum(['quotation', 'proforma', 'invoice', 'receipt', 'po']);
export const documentStatusSchema = z.enum([
  'draft',
  'sent',
  'accepted',
  'declined',
  'expired',
  'issued',
  'void',
]);

export const documentCreateSchema = z.object({
  entity_type: documentEntitySchema,
  entity_id: z.string().uuid(),
  document_type: documentTypeSchema,
  snapshot: customData.optional(),
  valid_until: isoDate.optional(),
});

/**
 * status/snapshot only move forward while status is 'draft' — once a
 * document reaches sent/accepted/issued, v2.protect_issued_documents
 * rejects any snapshot change at the DB layer regardless of what this
 * schema allows.
 */
export const documentUpdateSchema = z
  .object({
    status: documentStatusSchema.optional(),
    snapshot: customData.optional(),
    valid_until: isoDate.optional(),
  })
  .refine(d => Object.keys(d).length > 0, { message: 'At least one field is required' });

export const noteCreateSchema = z.object({
  entity_type: z.enum(['order', 'client', 'product', 'expense', 'material_purchase']),
  entity_id: z.string().uuid(),
  content: z.string().trim().min(1),
});

/** field_name and entity are immutable after creation (DB convention). */
export const fieldDefinitionUpdateSchema = fieldDefinitionCreateSchema
  .omit({ entity: true, field_name: true })
  .partial()
  .extend({ status: z.enum(['active', 'archived']).optional() })
  .refine(d => Object.keys(d).length > 0, { message: 'At least one field is required' });
