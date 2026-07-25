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
    product_name_raw: z.string().trim().min(1).optional(),
    quantity: z.number().positive(),
    unit_price: z.number().nonnegative(),
    discount: z.number().nonnegative().optional(),
    custom_data: customData.optional(),
  })
  .refine(i => i.product_id != null || i.product_name_raw != null, {
    message: 'Each item needs a product_id or a product_name_raw',
  });

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

// A select field's options: either a legacy string array or the current
// metadata-object array ({value,label,color,is_default,semantic}). The DB
// (value_in_options) accepts both; validation stays structural.
const selectOptionObject = z.object({
  value: z.string().trim().min(1),
  label: z.string().trim().min(1),
  color: z.string().trim().min(1).optional(),
  is_default: z.boolean().optional(),
  semantic: z.enum(['open', 'won', 'lost']).optional(),
});
const fieldOptions = z.union([
  z.array(z.string().trim().min(1)),
  z.array(selectOptionObject),
]) as unknown as z.ZodType<Json>;

// A single jsonb default (any JSON shape); assertion reconciles zod's
// `unknown` with the DB `Json` type, same pattern as customData.
const jsonValue = z.unknown() as unknown as z.ZodType<Json>;

export const fieldDefinitionCreateSchema = z.object({
  entity: fieldEntitySchema,
  field_name: z
    .string()
    .regex(/^[a-z][a-z0-9_]{0,62}$/, 'Lowercase machine key, e.g. delivery_date'),
  field_label: z.string().trim().min(1),
  field_type: z.enum(['text', 'number', 'date', 'boolean', 'select', 'relation', 'dimension']),
  is_required: z.boolean().optional(),
  is_unique: z.boolean().optional(),
  is_system: z.boolean().optional(),
  options: fieldOptions.optional(),
  default_value: jsonValue.optional(),
  related_entity: z.string().trim().min(1).optional(),
  display_field: z.string().trim().min(1).optional(),
  conditions: customData.optional(),
  field_group: z.string().trim().min(1).optional(),
  show_in_documents: z.boolean().optional(),
  inherit_from: z.string().trim().min(1).optional(),
  sort_order: z.number().int().optional(),
});

/**
 * PATCH /api/organization — org-level scalar settings only, merged into
 * organizations.settings. name/slug/logo are Clerk-authoritative; order
 * status values live in field_definitions (not here). Currency is checked
 * for ISO-4217 *shape* only, not against a fixed list, so any real currency
 * works — the preset list (app/lib/organization/presets.ts) is just a menu.
 */
export const organizationSettingsPatchSchema = z
  .object({
    currency: z.string().trim().regex(/^[A-Z]{3}$/, 'Expected a 3-letter ISO 4217 code'),
    locale: z.string().trim().min(2).max(35),
    // First-run wizard state (see FIRST_RUN_AND_FIELD_SETUP.md). Merged
    // into settings; `completed` gates the onboarding redirect.
    onboarding: z.object({ completed: z.boolean() }),
  })
  .partial()
  .refine(d => Object.keys(d).length > 0, { message: 'At least one setting is required' });

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
