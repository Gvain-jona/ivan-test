import { z } from 'zod';
import type { Json } from '@/types/supabase-v2';
import { BRAND_PRESET_IDS } from '@/lib/theme/brand-presets';

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
  /** Mobile money transaction id, cheque number, bank slip — how a real
   *  payment is traced back to the bank. Distinct from `notes`, which is
   *  free commentary ("deposit", "balance on collection"). */
  reference: z.string().trim().min(1).optional(),
  notes: z.string().trim().min(1).optional(),
});

/**
 * Payments supplied inline at order creation, which travel to
 * v2.create_order rather than v2.record_payment.
 *
 * `reference` is deliberately absent. create_order's documented payload is
 * {amount, payment_method, payment_date} (orders-system-handoff.md §9), so a
 * reference sent here would be dropped in the DB without an error — worse
 * than refusing it, because the user watches their cheque number vanish.
 * Capture one through POST /api/orders/[id]/payments, which builds the
 * record_payment payload explicitly.
 *
 * `notes` is grandfathered, not verified: the app has always sent it and the
 * same doc doesn't list it either. Confirm with the DB owner whether
 * create_order persists it — if not, it belongs out here too.
 *
 * `.strict()` rather than zod's default strip, on purpose: a stripped key is
 * still a silently dropped one, just discarded a layer earlier. Failing loudly
 * is what makes "the create-order payment sheet must not offer a reference
 * field" discoverable while building it instead of after the data is gone.
 */
export const orderCreatePaymentSchema = paymentInputSchema
  .omit({ reference: true })
  .strict();

export const orderCreateSchema = z.object({
  client_id: z.string().uuid(),
  order_date: isoDate.optional(),
  status: z.string().trim().min(1).optional(),
  custom_data: customData.optional(),
  items: z.array(orderItemInputSchema).min(1),
  payments: z.array(orderCreatePaymentSchema).optional(),
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
 * organizations.settings is a DB-governed schema: a trigger
 * (v2.validate_organization_settings) whitelists the top-level blocks and
 * type-checks their contents. These schemas mirror the block *shape* so a
 * typo fails as a 400 here rather than a trigger error on the round trip —
 * but the trigger remains the authority on semantics, exactly as it is for
 * custom_data. Keep `.strict()` in step with the DB whitelist.
 *
 * Currency is checked for ISO-4217 *shape* only, not against a fixed list,
 * so any real currency works — the preset list
 * (app/lib/organization/presets.ts) is just a menu.
 */
const currencyCode = z.string().trim().regex(/^[A-Z]{3}$/, 'Expected a 3-letter ISO 4217 code');

const settingsBlocks = z
  .object({
    locale: z
      .object({
        currency: currencyCode,
        date_format: z.string().trim().min(1),
        timezone: z.string().trim().min(1),
      })
      .partial()
      .strict(),
    tax: z
      .object({
        registered: z.boolean(),
        label: z.string().trim().min(1),
        rate: z.number().min(0).max(100),
        inclusive: z.boolean(),
        number: z.string().trim().min(1),
      })
      .partial()
      .strict(),
    documents: z
      .object({
        terms_days: z.number().int().min(0),
        quote_validity_days: z.number().int().min(0),
        footer: z.string(),
        bank_details: z.string(),
        show_bank_details: z.boolean(),
      })
      .partial()
      .strict(),
    identity: z
      .object({
        legal_name: z.string().trim().min(1),
        trading_name: z.string().trim().min(1),
        address: z.string(),
        phone: z.string().trim().min(1),
        email: z.string().trim().email(),
        tax_id: z.string().trim().min(1),
        website: z.string().trim().min(1),
        logo_attachment_id: z.string().uuid(),
      })
      .partial()
      .strict(),
  })
  .partial()
  .strict();

export type OrganizationSettingsBlocks = z.infer<typeof settingsBlocks>;

/**
 * PATCH /api/organization. name/slug/logo are Clerk-authoritative and order
 * status values live in field_definitions — neither belongs here.
 *
 * Three keys, three destinations, on purpose:
 *   settings ............. deep-merged into organizations.settings
 *   onboarding_completed . writes the onboarding_completed_at column, because
 *                          settings is config that gets frozen into document
 *                          snapshots and setup progress is neither
 *   brand_color .......... writes Clerk org public_metadata, where the rest
 *                          of the org's visual identity already lives (see
 *                          app/lib/theme/brand.ts)
 */
export const organizationSettingsPatchSchema = z
  .object({
    settings: settingsBlocks,
    onboarding_completed: z.boolean(),
    // A closed set, not a free colour: every preset's light/dark pair is
    // contrast-verified at authoring time (app/lib/theme/brand-presets.ts).
    brand_color: z.enum(BRAND_PRESET_IDS),
  })
  .partial()
  .strict()
  .refine(
    d =>
      d.settings !== undefined ||
      d.onboarding_completed !== undefined ||
      d.brand_color !== undefined,
    { message: 'At least one setting is required' },
  )
  .refine(d => d.settings === undefined || Object.keys(d.settings).length > 0, {
    message: 'settings must name at least one block',
  });

/**
 * PATCH /api/counters — numbering config for one counter.
 *
 * `current_value` is increase-only, enforced in the route. A counter is what
 * guarantees document numbers are unique and gapless-by-intent; letting an
 * owner set it backwards would hand out a number that already exists on an
 * issued, immutable document. Skipping ahead (starting invoices at 1000
 * because the old paper book reached 999) is both safe and a real thing
 * people need on migration day.
 *
 * `reset_policy` must agree with `format`: a {YYYY} format that never resets
 * produces numbers that lie about their year. The DB comment states the rule;
 * nothing enforces it, so the UI should present them as one decision.
 */
export const counterUpdateSchema = z
  .object({
    counter_key: z.string().trim().min(1),
    format: z.string().trim().min(1).optional(),
    reset_policy: z.enum(['never', 'yearly', 'monthly']).optional(),
    current_value: z.number().int().nonnegative().optional(),
  })
  .refine(
    d =>
      d.format !== undefined ||
      d.reset_policy !== undefined ||
      d.current_value !== undefined,
    { message: 'At least one field is required' },
  );

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

/**
 * POST /api/documents — issue a document from an order.
 *
 * No caller-supplied snapshot or totals: v2.issue_document() reads the order,
 * resolves org settings, computes tax and freezes the snapshot itself. That
 * is the point — a client that can hand over the financial content of an
 * invoice can forge one, and the numbers would drift from the order the
 * moment either side changed.
 *
 * Orders only. `documents.entity_type` also permits payment/expense/client,
 * but nothing DB-side can issue those yet (receipts arrive with the payments
 * cutover, expenses with theirs), so accepting them here would just produce a
 * confusing failure deeper in.
 */
export const documentIssueSchema = z.object({
  entity_type: z.literal('order', {
    errorMap: () => ({ message: 'Only orders can be issued as documents today' }),
  }),
  entity_id: z.string().uuid(),
  document_type: documentTypeSchema,
  /** Overrides settings.documents.terms_days for this invoice only. */
  terms_days: z.number().int().min(0).optional(),
  /** Overrides settings.documents.quote_validity_days for this quotation. */
  validity_days: z.number().int().min(0).optional(),
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
