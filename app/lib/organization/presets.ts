/**
 * The starter template every new org begins with (see
 * docs/v2-migration/FIRST_RUN_AND_FIELD_SETUP.md).
 *
 * Decision, 2026-08-14: the system applies this baseline **for** the user
 * rather than asking them to configure it. Knowing what data a print shop
 * should collect is expert knowledge most owners don't have on day one, so we
 * take that burden — the app arrives pre-set-up with the common needs, and the
 * flexibility is unchanged: the moment these land they are the org's own
 * field_definitions / settings, free to change, disable, or ignore. That this
 * happened is communicated by the design (a brief A1 screen, then a "Continue
 * setup" badge through the app), not by an explanatory step.
 *
 * This module stays the single source of truth for the print-shop template.
 * `seed-defaults.ts` writes it into a new org's rows — at provisioning (the
 * Clerk webhook) and, as a safety net, on A1 completion.
 */

import type { FieldOption } from '@/lib/fields/options';
import { slugifyOptionValue } from '@/lib/fields/slug';

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

export type StarterEntity = 'product' | 'client' | 'order' | 'order_item' | 'note';

/** Slug a human label into a stable, machine-safe option value. */
function toOption(label: string): SelectOption {
  return { value: slugifyOptionValue(label), label };
}

/**
 * The shortlist the currency picker shows first — the currencies this market
 * most plausibly prices in, not a default and not the limit. Every other
 * currency is browsable underneath it (`lib/organization/currencies.ts`), and
 * PATCH /api/organization accepts any ISO-4217 code regardless. Each code here
 * must also exist in ALL_CURRENCIES, or the shortlist would offer something
 * the list below it can't find; a colocated test enforces that.
 */
export const CURRENCY_OPTIONS: { code: string; label: string; symbol: string }[] = [
  { code: 'UGX', label: 'Ugandan Shilling', symbol: 'USh' },
  { code: 'KES', label: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'TZS', label: 'Tanzanian Shilling', symbol: 'TSh' },
  { code: 'RWF', label: 'Rwandan Franc', symbol: 'FRw' },
  { code: 'NGN', label: 'Nigerian Naira', symbol: '₦' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
];

/**
 * The industries A1's picker offers first.
 *
 * A shortlist, not a taxonomy — stored as free text in
 * `settings.identity.industry`, so a business that isn't here types its own.
 * Print & signage leads because it is the first tenant's trade and the only
 * one the starter field sets are written for; when a second set exists, this
 * is what will choose between them.
 */
export const INDUSTRY_OPTIONS: string[] = [
  'Printing & signage',
  'Design studio',
  'Photography',
  'Events & branding',
  'Retail',
  'Manufacturing',
  'Professional services',
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
 * The real columns every record of an entity always has, in display terms.
 *
 * These are NOT field_definitions and can't be toggled — they're fixed v2
 * columns. Setup shows them so "toggle off what you don't need" can't be read
 * as "a product needs no name": the list makes the floor visible before the
 * choices start. Labels only; nothing here is written anywhere.
 */
export const FIXED_FIELDS: Record<StarterEntity, string[]> = {
  product: ['Name', 'Selling price'],
  client: ['Client name'],
  order: ['Client', 'Order date', 'Amounts'],
  order_item: ['Product', 'Quantity', 'Unit price'],
  note: ['Note', 'Who wrote it', 'When'],
};

/**
 * Print-shop starter field sets per entity (accepted 2026-07-25). Fixed
 * columns (see FIXED_FIELDS) are always present and not represented here —
 * these are the toggleable predefined custom fields shown in each entity's
 * setup step.
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
  /**
   * Fields on a single line of an order, not on the order as a whole.
   *
   * `size` deliberately exists here *and* on `product`, because they answer
   * different questions: the product's size is the catalogue default ("a
   * roll-up banner is 2×4 ft"), the line's is what was actually sold on this
   * job ("this one went out at 3×6"). One order routinely carries lines of
   * different sizes, so folding them into one field would lose the variation
   * the shop floor works from.
   *
   * The line's value is prefilled from the chosen product in the order form —
   * the same way unit_price already is. It is NOT wired through
   * `field_definitions.inherit_from`: that column exists but nothing in the
   * app or (as far as the repo can see) the DB interprets it yet, so setting
   * it would be a guess at semantics we don't own.
   */
  order_item: [
    { field_name: 'size', field_label: 'Size', field_type: 'dimension', sort_order: 10 },
  ],
  /**
   * What kind of note this is — the thing B2c's TYPE chips and E2's grouping
   * both read.
   *
   * A field rather than a column, per principle 2: `notes.custom_data` and the
   * `'note'` entity landed together in migration `20260807213900` precisely so
   * this could be org-editable, and E3 presents note types as a list the org
   * changes. That is also why the canvas disagrees with itself — B2c draws
   * General / Client request / Internal / Production while E2 and E3 draw
   * Artwork / Delivery / General. Neither is wrong: they are two orgs that
   * edited the list. This preset is the *suggestion*, taken from B2c because
   * that is the frame where a type is chosen.
   */
  note: [
    {
      field_name: 'type',
      field_label: 'Type',
      field_type: 'select',
      sort_order: 10,
      options: [
        { value: 'general', label: 'General', color: 'slate', is_default: true },
        { value: 'client_request', label: 'Client request', color: 'blue' },
        { value: 'internal', label: 'Internal', color: 'violet' },
        { value: 'production', label: 'Production', color: 'amber' },
      ],
    },
  ],
};
