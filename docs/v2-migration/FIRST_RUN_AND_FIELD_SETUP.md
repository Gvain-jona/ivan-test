# First-run onboarding & entity-tied field setup — design spec

Status: **proposed** (design agreed in-session 2026-07-25, not yet built).
Owner-side pieces flagged **[DB owner]**. This doc is the durable record of
the decisions so a fresh session doesn't re-derive them. Conventions live in
`CLAUDE.md`; live migration status in `STATE.md`; DB-side order model in
`orders-system-handoff.md`. Read those first — this only covers first-run
setup and the field-configuration model.

## The problem

v2 ships an org with **no preconfigured values**. `provision_organization`
seeds only the numbering counters; `organizations.settings` is empty and a
new org has **zero `field_definitions`**. Because in v2 everything except a
handful of fixed columns lives in `custom_data` governed by
`field_definitions`, an unconfigured org can capture almost nothing — e.g.
the client form captures only `name` (phone/email/type are custom fields that
don't exist yet).

Today two hardcoded **fallbacks** paper over this:

- `useOrganization()` substitutes `DEFAULT_ORDER_STATUSES`
  (`pending → in_progress → completed → delivered → cancelled`) whenever
  `settings.order_statuses` is empty.
- `formatCurrency(value, currency = 'UGX')` (`lib/utils.ts`) hardcodes UGX +
  `en-UG`, is called ~50 places with **no currency argument**, and is not
  wired to org settings at all. `useOrganization().currency` (`?? 'UGX'`) is
  effectively dead — nothing consumes it.

These fallbacks are **mandatory conditioning**: invisible, unremovable, never
the org's own editable data. The goal is to replace them with **opt-in
presets the org applies into its own settings**, and make the org's data the
single source of truth.

## The decided UX — a guided, entity-by-entity first-run

After sign-in + Clerk org creation + provisioning, a first-time user is
walked through the model in dependency order, learning by doing:

1. **Orientation** — the app has Orders, Clients, Products: related but
   distinct. "To make this yours, let's set up your catalog."
2. **Products** → show a **starter set of fields** (predefined), each
   **toggleable on/off**; user can **add their own** (name + type); for
   **select fields they define the option values**. Save → **create the
   first product**.
3. **Clients** → same cycle → create the first client.
4. **Orders** → same cycle (incl. the status workflow) → create the first
   order.

Unified across desktop and mobile (steady-state Home stays mobile-only, but
first-run is shared). It is **"explicit apply, pre-populated"** — not a blank
slate, not an auto-seeded hidden rule: we *show* the starter set, the user
shapes it, it saves as theirs. This is the "if you wish, not mandatory"
principle.

## The decided architecture — one configuration engine

`field_definitions` is already a full dynamic-field engine (entity,
field_type incl. `select`, `options`, `is_required`/`is_unique`,
`conditions`, `field_group`, `show_in_documents`, `inherit_from`,
`sort_order`, `status active|archived`). It is the single config primitive
for **every configurable/dynamic aspect of an entity**, presented **inside
each entity's own step** — not on a separate global page.

**Boundary (the corrected split):**

- **Entity-configurable fields, including the order status workflow** →
  `field_definitions`.
- **Org-level scalars** (currency, locale, number/document formats) →
  `organizations.settings`. These genuinely aren't entity fields, so they
  stay here — but that is now a principled line, not the murky one.

### Decision: order status unifies into `field_definitions`

`settings.order_statuses` is retired. The order status workflow becomes a
`field_definitions` row (`entity='order'`, `field_name='status'`,
`field_type='select'`, `is_system=true`). This gives **one** configuration
mechanism for every dropdown (client "type", product "category", order
"status" are the same thing to the wizard, the form renderer, and the
trigger), and removes the hardcoded fallback by construction.

`order.status` **stays a real column** (fast filtering, workflow logic,
generated-column neighbors `balance`/`payment_status` untouched) — only its
*allowed values* move from a settings array into the field's `options`,
validated by the governance trigger. NOTE: `products.status` and
`clients.status` are **lifecycle** columns (`active|archived|draft`), a
different concept — they are not part of this and are not user-configurable.

### Decision: select `options` become metadata objects

Select `options` change from bare strings to objects:
`{ value, label, color, is_default, semantic }`. This delivers colored status
chips and **data-driven workflow** — Home feed segmentation and
done/cancelled logic read `semantic` (`open | won | lost` or similar) from
the option instead of matching hardcoded status strings. Applies to every
select, not just status. Storage must tolerate both shapes during migration.

### Decided: retire the standalone `/dashboard/fields`

Field setup lives inside each entity (a "Fields" affordance on the
Products/Clients/Orders surfaces) both during and after onboarding, so a
field is always configured in the context of the entity it belongs to. The
global page is retired — a single decontextualized registry doesn't match
the model or the UX we want (the current Products page confirms this is the
wrong shape). Field editing is always reached from the entity it belongs to.

## Schema changes — **APPLIED** 2026-07-25 (migration `20260725164737`)

Applied to the live v2 project via MCP `apply_migration` and mirrored in
`supabase/migrations/20260725164737_field_definitions_system_defaults_and_status_governance.sql`.
Verified end-to-end (object-options accepted, invalid status rejected,
unconfigured org still transacts; test rows rolled back, zero residue).

1. ✅ **Order status governed by a field definition** — `validate_custom_data`
   now checks the `order.status` fixed column against an
   `entity='order', field_name='status'` **select** field-definition's
   options. Enforced **only when such a field exists**, so an unconfigured
   org still transacts (status had no DB constraint before this).
2. ✅ **`options` object shape** — new shared `v2.value_in_options(options,
   value)` accepts `{value,label,color,is_default,semantic}` object arrays,
   plus legacy string arrays / keyed objects (non-breaking). The trigger's
   select check and the status check both use it.
3. ✅ **`field_definitions.is_system boolean`** (default false).
4. ✅ **`field_definitions.default_value jsonb`** (nullable).
   Also: `validate_custom_data` `search_path` hardened to `''` (was unset —
   a previously-flagged item).

**Backfill: not needed.** Live v2 is a clean test env — one org ("Ephra
test") with empty `settings` and zero field_definitions/clients/orders. The
docs' "3 orgs with real data" was stale. Nothing to convert; new orgs get
their status field from the wizard/preset going forward.

### Still DB-side, not yet done

- Whether/where to also add a `status` field row automatically (vs the app
  applying it as a preset) — current decision is app-applies (explicit,
  pre-populated), so no auto-seed added to `provision_organization`.

## App-side changes

1. **`PATCH /api/organization`** — the missing writer for org-level scalars
   (currency, locale, formats). Route + validator + colocated `route.test.ts`
   (repo testing rule). `/api/organization` is GET-only today.
2. **field_definitions write flow** — the wizard applies starter rows,
   toggles (archive), reorders (`sort_order`), and edits options via the
   existing migrated field-definitions API.
3. **Remove the fallbacks** — `useOrganization` returns the org's real
   settings + an explicit `needsSetup`/`isConfigured` signal (no silent
   substitution). Wire `formatCurrency` to the org currency (thread it
   through, or a currency-aware formatter hook) so amounts respect settings.
4. **Presets as data** — a module of named, opt-in starter templates (field
   sets per entity + status workflow + currency options), applied on user
   action, never silently.
5. **First-run wizard UI** — shared surface both platforms route to while
   onboarding is incomplete; reuses existing create sheets (`OrderFormSheet`,
   `ClientFormSheet`, product form already render custom fields via
   `CustomFieldsForm`).

## Starter field sets (print-shop template — accepted 2026-07-25)

Fixed columns are always present (shown, not toggleable). Listed custom
fields are the predefined, toggleable starter set.

**Product** — fixed: `name`, `selling_price`. Starter custom fields:
| field | type | notes |
|---|---|---|
| category | select | Business Cards, Flyers, Banners, Stationery, Large Format |
| unit | select | piece, pack, sheet, sqm, sqft |
| size | dimension | w/h + raw |
| material | select | Matte, Gloss, Vinyl, PVC, Canvas |

**Client** — fixed: `name`. Starter custom fields:
| field | type | notes |
|---|---|---|
| phone | text | |
| email | text | |
| type | select | Walk-in, Regular, Contract |
| company | text | `conditions`: show when type = Contract |
| address | text | |

**Order** — fixed: `client`, `order_date`, items, amounts. Starter custom
fields + the status workflow:
| field | type | notes |
|---|---|---|
| status | select (is_system) | workflow, see below |
| due_date | date | |
| delivery_method | select | Pickup, Delivery |

Proposed status workflow (option objects):
| value | label | color | semantic |
|---|---|---|---|
| quotation | Quotation | slate | open |
| design | Design | amber | open |
| printing | Printing | blue | open |
| finishing | Finishing | violet | open |
| ready | Ready | teal | open |
| delivered | Delivered | green | won |
| cancelled | Cancelled | red | lost |

## Build sequence (dependency order)

1. ✅ **DONE (2026-07-25)** — schema foundation: `is_system`,
   `default_value`, object-tolerant `value_in_options`, `order.status`
   governance, `search_path` hardening (migration `20260725164737`). No
   backfill needed (empty test env).
2. ✅ **DONE (2026-07-25)** — `PATCH /api/organization` (owner-only, merges
   into `settings`; `organizationSettingsPatchSchema`) + presets-as-data
   module (`app/lib/organization/presets.ts`: currency menu, print-shop
   status workflow, per-entity starter field sets). `TenantDb.organization()`
   gained a settings-only `update()`. Contract + unit + preset-shape tests
   added (81/81 green).
3. ✅ **DONE (2026-07-25)** — first-run wizard.
   - Prereq shipped: object-options end-to-end (`app/lib/fields/options.ts`
     `normalizeOptions`, `fieldDefinitionCreateSchema` union + `is_system`/
     `default_value`, `CustomFieldInput` renders `value`/`label`).
   - `app/components/onboarding/` — `GettingStartedWizard` (welcome →
     currency → product → client → order), `EntityFieldSetupStep` (toggle
     starter fields, add custom via `FieldDefinitionFormSheet`, apply
     idempotently via `starterFieldsToApply`), `OnboardingGate` (routes
     unfinished users to `/dashboard/getting-started`).
   - Onboarding state persists in `settings.onboarding.completed` (PATCH
     schema + `useOrganization().onboardingCompleted`); the wizard's finish
     sets it and redirects to Orders.
   - **Visual QA pending** — the app can't be run authed here (needs Clerk +
     Supabase). Logic is unit-tested (`apply-presets.test.ts`,
     `options.test.ts`); components logged Partial in the responsiveness
     registry until a running-app pass.
4. ✅ **DONE (2026-07-25)** — hardcoded fallbacks removed.
   - `DEFAULT_ORDER_STATUSES` deleted. Order statuses now come from the order
     `status` field-definition via `useOrderStatuses()` (empty until
     configured — no fallback). Consumers migrated: `OrderFormSheet` (default
     status = the workflow's `is_default`/first, not hardcoded `pending`),
     `StatusDropdown`, `OrdersTableNew`/`OrdersFilterSheet`.
   - `UGX` default removed. `useOrganization().currency` is now `null` until
     set; new `useFormatCurrency()` renders plain grouped numbers until a
     currency is chosen, else `Intl` currency. Wired into the live surfaces
     (orders list/card/form, order-view tabs, Home snapshot + recent list,
     products). Legacy/dark modules keep the standalone `formatCurrency` util
     until their cutover.
   - **Follow-up:** richer status rendering from option `label`/`color`/
     `semantic` (StatusBadge data-driven, Home semantic segmentation) — the
     data is there; the UI still renders by value string.
5. ✅ **DONE (2026-07-25)** — retired `/dashboard/fields`. New reusable
   `EntityFieldsManager` (add/edit/archive one entity's fields inline, reusing
   `FieldDefinitionFormSheet`) surfaced behind a "Fields" toggle on the
   Products, Clients, and Orders pages (Orders covers both `order` and
   `order_item`). Global nav entries (FooterNav, MobileTabBar) removed and the
   standalone page deleted. Inline (not sheet-nested) to avoid stacking the
   field-form sheet under another sheet.

## Open questions

- Exact `semantic` vocabulary for status options (drives Home segmentation) —
  starter uses `open | won | lost`; confirm this covers the workflow logic.
- Whether the wizard is skippable / resumable, and how "onboarding complete"
  is determined (derive from data vs a stored flag — no settings writer today,
  so a flag needs the new PATCH route or Clerk metadata).

## Settled

- Guided entity-by-entity first-run; "explicit apply, pre-populated" presets.
- `field_definitions` as the single entity-config engine, tied per-entity.
- Retire the standalone `/dashboard/fields`; field editing reached per-entity.
- Order status unifies into a `field_definitions` select (column stays).
- Select `options` become metadata objects.
- Print-shop starter field sets (above) accepted as the first template.
