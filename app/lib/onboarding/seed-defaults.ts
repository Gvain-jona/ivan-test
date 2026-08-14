import type { createV2AdminClient } from '@/utils/supabase/server-v2';
import type { DatabaseV2, Json } from '@/types/supabase-v2';
import { STARTER_FIELDS, type StarterEntity, type StarterField } from '@/lib/organization/presets';

type FieldDefinitionInsert = DatabaseV2['v2']['Tables']['field_definitions']['Insert'];
type V2Admin = ReturnType<typeof createV2AdminClient>;

/**
 * First-run baseline: the org's starter field_definitions, applied silently.
 *
 * The product decision (2026-08-14): knowing *what to collect* is expert
 * knowledge most owners don't have on day one, so the system prepares the
 * common print-shop setup for them rather than asking. The DB stays exactly as
 * flexible — these become the org's own field_definitions, editable, disable-
 * able, ignorable from the moment they land — but the burden of defining them
 * is lifted. `presets.ts` is the single source of truth for the template; this
 * module is only how it reaches a new org's rows. Nothing here is a silent
 * runtime fallback: it is written once, up front, and then it is just data.
 *
 * Seeded at org provisioning (the Clerk webhook, right after
 * provision_organization) and, as a safety net, on A1 completion — Clerk can
 * deliver organization.created out of order or retry it, and orgs created
 * before this shipped never ran it. Both paths call this; it is idempotent.
 */

/** Turn one starter field into the row shape field_definitions expects. */
function toRow(organizationId: string, entity: StarterEntity, field: StarterField): FieldDefinitionInsert {
  return {
    organization_id: organizationId,
    entity,
    field_name: field.field_name,
    field_label: field.field_label,
    field_type: field.field_type,
    is_required: field.is_required ?? false,
    // The order `status` workflow rides in as a system field — not hard-
    // deletable in the UI, and the one field the app genuinely can't run
    // without (Home segmentation, the stage editor and status chips all read
    // it). Everything else degrades gracefully when absent; this must exist.
    is_system: field.is_system ?? false,
    options: (field.options ?? null) as Json,
    conditions: (field.conditions ?? null) as Json,
    sort_order: field.sort_order ?? 0,
    status: 'active',
  };
}

/**
 * Every starter row for an org, across all entities — pure, so the shape and
 * completeness (e.g. that the order `status` field is present and `is_system`)
 * can be asserted without a database.
 */
export function starterFieldRows(organizationId: string): FieldDefinitionInsert[] {
  const rows: FieldDefinitionInsert[] = [];
  for (const entity of Object.keys(STARTER_FIELDS) as StarterEntity[]) {
    for (const field of STARTER_FIELDS[entity]) {
      rows.push(toRow(organizationId, entity, field));
    }
  }
  return rows;
}

/**
 * Apply the baseline to an org. Idempotent: conflicts on the
 * (organization_id, entity, field_name) unique index are ignored, so an org
 * that already has some fields keeps them and only gains what it's missing —
 * re-running (retry, safety net, backfill) never duplicates or overwrites an
 * edited field.
 */
export async function seedOrgDefaults(admin: V2Admin, organizationId: string): Promise<void> {
  const { error } = await admin
    .from('field_definitions')
    .upsert(starterFieldRows(organizationId), {
      onConflict: 'organization_id,entity,field_name',
      ignoreDuplicates: true,
    });
  if (error) throw error;
}
