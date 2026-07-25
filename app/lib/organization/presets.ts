/**
 * Opt-in starter templates for first-run setup (see
 * docs/v2-migration/FIRST_RUN_AND_FIELD_SETUP.md).
 *
 * These are NOT silent fallbacks. Nothing here is applied unless the user
 * chooses to during onboarding; once applied they become the org's own
 * editable field_definitions / settings, which they can change, disable, or
 * ignore. This module is the single source of truth for the print-shop
 * template — the wizard reads it, presents it, and (on apply) writes the
 * selected pieces via POST /api/field-definitions and PATCH /api/organization.
 */

import type { FieldOption } from '@/lib/fields/options';

/**
 * A select option, metadata-rich (matches the object shape the v2
 * validate_custom_data trigger and value_in_options() now accept). `value`
 * is what's stored; `label` is displayed; `color`/`semantic` drive chips and
 * workflow logic (e.g. Home segmentation reads `semantic`, not hardcoded
 * status strings). Canonical shape lives in lib/fields/options.
 */
export type SelectOption = FieldOption;

/** A starter field, shaped for POST /api/field-definitions. */
export interface StarterField {
  field_name: string;
  field_label: string;
  field_type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'relation' | 'dimension';
  options?: SelectOption[];
  is_required?: boolean;
  /** Protected/seeded field (e.g. order status) — not hard-deletable in UI. */
  is_system?: boolean;
  /** Conditional visibility; shape matches CustomFieldsForm's interpreter. */
  conditions?: Record<string, unknown>;
  sort_order?: number;
}

export type StarterEntity = 'product' | 'client' | 'order';

/** Slug a human label into a stable, machine-safe option value. */
function toOption(label: string): SelectOption {
  return {
    value: label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, ''),
    label,
  };
}

/**
 * Currency menu for the settings picker — a convenience list, not a default.
 * Any valid ISO-4217 code is accepted by PATCH /api/organization; this just
 * saves typing for common cases.
 */
export const CURRENCY_OPTIONS: { code: string; label: string }[] = [
  { code: 'UGX', label: 'Ugandan Shilling (USh)' },
  { code: 'KES', label: 'Kenyan Shilling (KSh)' },
  { code: 'TZS', label: 'Tanzanian Shilling (TSh)' },
  { code: 'RWF', label: 'Rwandan Franc (FRw)' },
  { code: 'NGN', label: 'Nigerian Naira (₦)' },
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'British Pound (£)' },
];

/**
 * The print-shop order status workflow — the options for the order `status`
 * select field-definition. `semantic` classifies each stage so workflow
 * logic keys off data, not hardcoded strings.
 */
export const ORDER_STATUS_WORKFLOW: SelectOption[] = [
  { value: 'quotation', label: 'Quotation', color: 'slate', semantic: 'open', is_default: true },
  { value: 'design', label: 'Design', color: 'amber', semantic: 'open' },
  { value: 'printing', label: 'Printing', color: 'blue', semantic: 'open' },
  { value: 'finishing', label: 'Finishing', color: 'violet', semantic: 'open' },
  { value: 'ready', label: 'Ready', color: 'teal', semantic: 'open' },
  { value: 'delivered', label: 'Delivered', color: 'green', semantic: 'won' },
  { value: 'cancelled', label: 'Cancelled', color: 'red', semantic: 'lost' },
];

/**
 * Print-shop starter field sets per entity (accepted 2026-07-25). Fixed
 * columns (product.name/selling_price, client.name, order client/date/amounts)
 * are always present and not represented here — these are the toggleable
 * predefined custom fields shown in each entity's setup step.
 */
export const STARTER_FIELDS: Record<StarterEntity, StarterField[]> = {
  product: [
    {
      field_name: 'category',
      field_label: 'Category',
      field_type: 'select',
      sort_order: 10,
      options: ['Business Cards', 'Flyers', 'Banners', 'Stationery', 'Large Format'].map(toOption),
    },
    {
      field_name: 'unit',
      field_label: 'Unit',
      field_type: 'select',
      sort_order: 20,
      options: ['piece', 'pack', 'sheet', 'sqm', 'sqft'].map(toOption),
    },
    { field_name: 'size', field_label: 'Size', field_type: 'dimension', sort_order: 30 },
    {
      field_name: 'material',
      field_label: 'Material',
      field_type: 'select',
      sort_order: 40,
      options: ['Matte', 'Gloss', 'Vinyl', 'PVC', 'Canvas'].map(toOption),
    },
  ],
  client: [
    { field_name: 'phone', field_label: 'Phone', field_type: 'text', sort_order: 10 },
    { field_name: 'email', field_label: 'Email', field_type: 'text', sort_order: 20 },
    {
      field_name: 'type',
      field_label: 'Type',
      field_type: 'select',
      sort_order: 30,
      options: ['Walk-in', 'Regular', 'Contract'].map(toOption),
    },
    {
      field_name: 'company',
      field_label: 'Company',
      field_type: 'text',
      sort_order: 40,
      // Only relevant for contract clients; `type` stores the option value.
      conditions: { field: 'type', equals: 'contract' },
    },
    { field_name: 'address', field_label: 'Address', field_type: 'text', sort_order: 50 },
  ],
  order: [
    {
      field_name: 'status',
      field_label: 'Status',
      field_type: 'select',
      is_system: true,
      sort_order: 10,
      options: ORDER_STATUS_WORKFLOW,
    },
    { field_name: 'due_date', field_label: 'Due date', field_type: 'date', sort_order: 20 },
    {
      field_name: 'delivery_method',
      field_label: 'Delivery method',
      field_type: 'select',
      sort_order: 30,
      options: ['Pickup', 'Delivery'].map(toOption),
    },
  ],
};
