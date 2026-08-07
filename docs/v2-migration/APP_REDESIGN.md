# App redesign — screens vs schema vs code

Last updated: 2026-08-07. Source of truth for the surface redesign that
followed `ONBOARDING_REDESIGN.md`: 26 frames on the Pencil canvas (`/yoko`)
covering orders, clients, products, documents, home and settings, reconciled
against the live `v2` schema and the code that exists today.

`STATE.md` remains the status record; this file records **what the screens
require, what the schema already supports, and the small set of things that
genuinely have to change.** Read the two principles first — they are what most
of the entries below turn on, and applying them cut the DB asks from four to
two and a half.

---

## Two governing principles

### 1. The DB models correctly; the UI speaks the user's language

A schema decision is not wrong because the interface uses a different word for
it. Users are not system designers — they use the app as they understand it.
The translation belongs in the UI, not in a migration.

The test: **does the value have to persist, and is there nowhere to put it?**
If yes, it's a real gap. If the data is already there and only the vocabulary
differs, it's a rendering job.

Applying this retracted two of the four blockers in the first draft of this
plan. Both entries are kept below under "Translations" as worked examples,
because the mistake is easy to repeat.

### 2. Default to `field_definitions`, not new columns

Anything the screens show that is **not a core column** is a custom field —
shipped as an opt-in starter preset (`app/lib/organization/presets.ts`) so an
org gets it at first-run, but a `field_definitions` row, editable and
archivable by the org, not a schema change.

Core columns are the fixed floor (see `FIXED_FIELDS`): what a record cannot
exist without, plus anything the DB itself computes from.

The only exceptions are **overlooked load-bearing gaps** — a value that must
persist, has no slot anywhere, and that the system's own arithmetic or
filtering depends on. Two qualify (order discount, note type). Everything else
in the designs resolves to an existing column, an existing settings block, or a
starter field.

---

## Screen inventory

| Frame | Screen | Status against code |
|---|---|---|
| A1 | Your business (first-run) | Built (`ONBOARDING_REDESIGN.md`) |
| A2 | Orders — empty state | Not built |
| B1 | Orders — the working list | Exists, pre-redesign |
| B2 | New order — full screen | `OrderFormSheet` supersedes → rewrite |
| B2a / B2a2 | Add item — search / chosen | Not built |
| B2b | Add payment | Not built |
| B2c | Add note | Not built (blocked: note type) |
| B2d | Client search | Not built |
| B3 | Add a line — product or one-off | Not built |
| B4 | Order — the hub | `OrderViewSheet` + 5 tabs supersede → rewrite |
| B5 | Move stage | Partially (`StatusDropdown`) |
| B7 | Issue document | Not built (Receipt chip blocked) |
| B8 | Order discount | **Blocked — needs columns** |
| B9 | Invoice — the document | Not built |
| C1 | Clients | Exists, pre-redesign |
| C2 | Client detail | **No route exists** |
| D1 | Products | Exists, pre-redesign |
| D2 | Product detail | **No route exists** |
| E1 | Track something else | Built (`EntityFieldsManager`) |
| E2 | Notes | **Blocked — note type** |
| E3 | Settings — what you can change | Partially (`/dashboard/organization`) |
| F1 | Documents | **No route, and no org-wide list API** |
| F2 | New invoice — combine orders | Needs `issue_document` extension |
| F3 | Invoice settings | ~80% buildable today |
| H1 | Home (mobile feed) | Built, metrics scaffolded |

---

## Live bug (independent of the redesign)

**`GET /api/orders/[id]` queries dropped columns.**
[`app/api/orders/[id]/route.ts:43`](../../app/api/orders/[id]/route.ts) filters
`payments` on `entity_type`/`entity_id`, removed in the 2026-07-29 money
rewrite. Every order-detail fetch returns Postgres 42703.

The sibling `POST .../payments` was rewritten for this on 2026-07-31; the GET
was missed. `route.test.ts:41` asserts the broken filter, so the suite is green
— the same failure mode STATE.md already recorded for the `document:` vs `doc:`
counter key. **Second occurrence of the class: a test that ratifies the bug.**

The fix is not a column swap. Payments attach through `payment_allocations`,
and under SINGLE RECEIVABLE an order's payments move to the **invoice** once
one is issued. The read must union `target_type='order'` and the order's live
document, or the hub reports "Paid 0" the moment you invoice.

---

## Real gaps — the exceptions to principle 2

**These are written up for the DB owner in `DB_ASKS.md` (2026-08-07).** G1→A1,
G2→A2, G3→A3, G4→A4, plus the settings-clearing limit as A5 and two
confirmation questions. That file is the one to send; this section is the
reasoning behind it.

### G1. Order-level discount has no column

Appears on B2, B4, B7, B8, B9 and F2's summary. `orders` has `total_amount`,
`amount_paid`, `balance` — no discount. `order_items.discount` is per-line and
absolute. `documents.discount_total` exists only at issue time.

This fails the principle-2 test on purpose: `total_amount` is trigger-computed
from lines, so a discount in `custom_data` would be ignored by the system's own
arithmetic — the order would read 480,000 while the invoice reads 432,000.
Money is the one thing whose storage and presentation cannot be decoupled.

**Ask:** `orders.discount_type` (`amount` | `percent`) + `orders.discount_value`,
with `recompute_order_totals` applying them.

Rejected alternative: distributing across `order_items.discount` at save time.
No migration, but it destroys the "10% off the order" intent, rounds badly, and
cannot round-trip back to a percentage.

### G2. Note type has no slot at all

B2c offers General / Client request / Internal / Production; E2 groups by
Artwork / Delivery / General; E3 presents note types as an org-configurable
list. `notes` is `entity_type` / `entity_id` / `content` — no type column and
**no `custom_data`**, so principle 2's normal escape hatch isn't available.
`fieldEntitySchema` also excludes `'note'`, so a field-definition can't govern
them either.

**Ask (either):** `notes.custom_data` + `'note'` added to `fieldEntitySchema`
— consistent with every other entity and makes the type list org-configurable
for free; or a plain `notes.note_type` text column, smaller but hardcodes the
concept.

Prefer the first: E3 already presents note types as something the org edits.

### G3. `issue_document` scope

Two extensions, one function:

- **Multiple orders** (F2) — see Translations T2. The function must accept an
  order array; `validate_payment_allocation`'s SINGLE RECEIVABLE check must
  learn to find a client-level invoice, not only an order-level one.
- **Payments** — B7 offers a Receipt chip. `documents.entity_type` already
  permits `'payment'`; nothing can produce one yet. Not a design overreach — a
  function that hasn't caught up. Ships with the payments cutover.

### G4. `create_order` doesn't take a payment reference (found 2026-08-07)

Small, but it splits an API surface. `payments.reference` exists, and
`POST /api/orders/[id]/payments` now captures it — that route builds the
`record_payment` payload explicitly, so the column is reachable.

Inline payments at order creation take a different path: they ride inside the
`create_order` payload, whose documented shape is
`{amount, payment_method, payment_date}` (`orders-system-handoff.md` §9). A
`reference` sent there would be dropped DB-side with no error, so
`orderCreatePaymentSchema` omits it and is `.strict()` — refusing loudly beats
losing a cheque number silently. **The B2b sheet must therefore not offer a
reference field when it's opened from the create-order flow**, only from the
order hub.

**Also unverified:** the app has always sent `notes` on that same path, and the
documented payload doesn't list it either. Nobody has confirmed whether
`create_order` persists it. Worth asking with the same breath as the
`reference` ask, since it's the same function and possibly the same silent
drop.

---

## Translations — resolved without schema change

### T1. `quotation` as an order status — **retracted**

The first draft asked whether to drop `quotation` from
`ORDER_STATUS_WORKFLOW`. Wrong question, and a direct violation of principle 1.

An order awaiting confirmation is genuinely a different state of the same
record; modelling it as a status keeps one lifecycle instead of two tables.
That the *user* shouldn't meet it as a production stage beside Design and
Printing is a rendering decision, and the screens already implement it — the
stage chips offer production stages, and quotation surfaces as a document.

**No change to `presets.ts`.** The UI stops rendering every status value as a
tappable stage; `semantic` already carries enough to know which ones those are.

Side effect: this *answers* a question left open earlier — Home's "Active
quotations" section is `orders where status = 'quotation'`.

### T2. Consolidated invoices (F2) — no link table

The first draft called for `document_entities(document_id, entity_type,
entity_id)`, on the reasoning that a frozen `snapshot` can't answer "which
orders does this invoice cover."

It can. Postgres queries JSONB; "not yet invoiced" is a containment query, not
a join. Double-invoicing doesn't need a constraint either, because
`issue_document` is already the only write path and already enforces
one-live-invoice-per-order.

**Shape:** a consolidated invoice is `entity_type='client'` with the covered
orders in the snapshot. The DB ask shrinks to the `issue_document` extension in
G3 — which F2 needs regardless.

Also corrected from the first draft: **payment allocation was never undefined.**
`payment_allocations.target_type` accepts `'document'`, so paying a
consolidated invoice and F2's "Already paid − 300,000" both work today.

### T3. Size — product default vs line override

Nobody asks which entity owns it; they think "this banner is 2×4 ft." The
system needs both, and `field_definitions.inherit_from` exists for exactly
that. Presets gap, not schema gap — the API and
`useFieldDefinitions('order_item')` already accept the entity.

**Change:** add an `order_item` starter set with `size` (dimension) inheriting
the product's. `StarterEntity` gains `'order_item'`.

### T4. B2a2's "select with Custom" size control

The first draft proposed a new field type or a `suggestions` array on
`dimension`. Neither is needed. "Usually one of these three, sometimes
something else" is an affordance, not a type.

**Change:** keep the field as `dimension` (free W×H); render the chips from
sizes already used on that product. Nothing to curate, and it improves with use
instead of going stale.

### T5. Delete

Orders "delete" is `status='cancelled'`; clients, products and fields are
`status='archived'`. Nothing is destroyed — correct.

But B1 renders Cancelled as a **stage chip** (Rose Auma, ORD-0034), so one
value carries two different user intents: "the client called it off" and "I
deleted this."

**Decision needed (UI, not schema):** either deleting drops the order out of
the default list, or "delete" stops being offered and the only verb is Cancel.
Recommend the second — a print shop cancels jobs, it doesn't delete them.

### T6. `payment_status` / `balance`

Generated columns with system names (`partial`, `unpaid`). The screens say
"Owes 180,000", "Settled", "UNPAID", "Balance due" — all correct as designed.

**Change:** centralise the mapping in one formatter rather than re-deriving it
per screen, the way `useFormatCurrency` centralised currency.

---

## Field classification

Every non-core field the screens show, and where it lives. Per principle 2, the
default column is "starter field".

| Field (screen) | Entity | Lives in | State |
|---|---|---|---|
| Status chips (B2, B4, B5) | order | core `orders.status`, governed by an `order.status` select field-def | ✅ |
| Due date (B2, B4, B9) | order | starter field `due_date` | ✅ exists |
| Delivery (B2, B9) | order | starter field `delivery_method` | ✅ exists |
| **Order discount (B2, B4, B8)** | order | — | ❗ **G1** |
| Size on the line (B2a2, all item rows) | order_item | starter field, `inherit_from` product | ⚠️ **T3** |
| Category / Unit / Material (D1, D2) | product | starter fields | ✅ exist |
| Size (D2) | product | starter field `size` (dimension) | ✅ exists |
| Also called (D2) | product | core `products.name_variants` | ✅ |
| Phone / Email / Type / Company / Address (C1, C2) | client | starter fields | ✅ exist |
| Client since (C2) | client | derived from `created_at` | ✅ |
| Reference — "MTN ref, cheque no…" (B2b) | payment | core `payments.reference` | ⚠️ missing from `paymentInputSchema` |
| Payment note — "Deposit" (B2b, B4) | payment | core `payments.notes` | ✅ |
| **Note type (B2c, E2, E3)** | note | — | ❗ **G2** |
| Payment terms (B7, F2, F3) | org | `settings.documents.terms_days` + per-issue override | ✅ both |
| Quotation validity (F3) | org | `settings.documents.quote_validity_days` | ✅ |
| Currency (F3) | org | `settings.locale.currency` | ✅ |
| Charge tax / Rate / Inclusive (F3) | org | `settings.tax.{registered,rate,label,inclusive}` | ✅ |
| Tax ID / TIN (F3, B9) | org | `settings.tax.number` **or** `settings.identity.tax_id` | ⚠️ ambiguous — see below |
| Letterhead: name / address / phone (F3, B9) | org | `settings.identity.*` | ✅ |
| Payment instructions (F3, B9) | org | `settings.documents.bank_details` + `show_bank_details` | ✅ |
| Numbering format / next / reset (F3) | org | `counters.{format,current_value,reset_policy}` | ✅ no route |
| Fields that print (F3) | field-def | `field_definitions.show_in_documents` | ✅ no UI |

**Correction from the first draft:** tax rate and letterhead were reported as
having nowhere to live. They do — `settingsBlocks` in
[`validators.ts:141`](../../app/lib/api/validators.ts) already whitelists
`tax` and `identity`. F3 is ~80% buildable with no DB involvement.

**Ambiguity resolved 2026-08-07:** the tax number appears in two whitelisted
blocks (`tax.number` and `identity.tax_id`). The form writes
**`identity.tax_id`**, on the evidence in STATE.md that `issue_document`
snapshots `settings.identity` as the invoice issuer — so that is the copy that
reaches a document. `tax.number` is left unwritten; if it turns out to serve
tax *reporting* rather than the letterhead, it gets its own field then, rather
than two inputs writing the same fact today.

---

## Buildable now — no DB dependency

| Work | Unblocks | Status |
|---|---|---|
| `reference` on `paymentInputSchema` + `buildPaymentPayload` | B2b | ✅ 2026-08-07 — see G4 for what it surfaced |
| `STARTER_FIELDS.order_item` with `size` | B2a2, every item row | ✅ 2026-08-07 — offered inside the Orders step, see below |
| Org-wide `GET /api/documents` | F1 | ✅ 2026-08-07 — entity pair now optional (still required together), + type/status/search/paging, `useDocumentList` |
| `GET`/`PATCH /api/counters` | F3 numbering | ✅ 2026-08-07 — owner-gated, `current_value` increase-only, cannot create a counter, `useCounters` |
| Org settings: `identity` / `tax` / `documents` blocks | F3 (minus numbering) | ✅ 2026-08-07 — three forms on `/dashboard/organization`; closes the blank-issuer blocker |
| `show_in_documents` toggle | F3 "fields that print" | ✅ 2026-08-07 — **the per-field toggle already existed**; what was missing was the consolidated view, now `DocumentFieldsForm` |
| Centralised payment-state formatter | T6 | ✅ **already centralised** in `PaymentStatusBadge` — the item was a false premise. What it uncovered next door was real: see "Home segmented on statuses that don't exist" |
| Swap Expenses out of `MobileTabBar` PRIMARY | nav | ✅ 2026-08-07 — Products takes the slot; dark modules moved to More and marked Soon |
| Client + product detail routes | C2, D2 | 🔲 Neither `/dashboard/clients/[id]` nor `/products/[id]` exists |
| C1 / C2 / F1 aggregates | client owing, order counts, unpaid invoices | 🔲 Scoped queries — see Aggregates |

Two decisions taken while building these, worth not relitigating:

- **`current_value` is increase-only.** Skipping ahead is a real migration-day
  need (the paper book reached 999); going backwards reissues a number that is
  already on an immutable document.
- **`PATCH /api/counters` cannot create a counter.** A `doc:{type}` row is what
  makes a document type legal, so creating one from a numbering screen would
  quietly grant an issuing capability. That needs its own explicit action.

**Not built on purpose:** the `reference` input on `OrderPaymentsTab`. B4
replaces that component, so the field lands with the hub rather than twice.

### Home segmented on statuses that don't exist (fixed 2026-08-07)

Found while checking whether the payment-state formatter was really missing —
it wasn't, but this was.

`RecentOrdersList`'s segments matched literal status values: `pending`,
`in_progress`, `paused`, `completed`. Of those, **none appear in
`ORDER_STATUS_WORKFLOW`**, whose values are quotation / design / printing /
finishing / ready / delivered / cancelled. So on the workflow the app actually
ships, every order between quotation and delivered fell through to a catch-all
bucket labelled **"Other"** — i.e. most of the feed, on the one screen that
exists to show what needs attention.

This is the "data-driven status chips" follow-up STATE.md has carried since
2026-07-25, and it's the same root cause as T1: reading a status value as if
the app owned it. Statuses are org-defined; only `semantic` (open | won | lost)
is stable.

Now `lib/orders/segment-orders.ts`, keyed on `semantic`, with the labels as the
UI's own words for it — so an org renaming "Printing" to "On the press" changes
nothing. Two behaviours worth keeping: a status carrying **no** semantic still
lands in "Other" rather than vanishing (an order sitting in a stage that was
later removed is exactly the kind someone has to deal with), and until the
workflow loads the list renders **flat** rather than filing everything under
"Other".

**Worth a sweep**: this was the third instance of hardcoded status values, and
nothing prevents a fourth.

### A settings block cannot be cleared (found 2026-08-07)

Building the settings forms surfaced a limit worth knowing before F3's
remaining rows are wired.

The blocks are `.strict()` and most of their strings are `.min(1)`, so sending
`''` is a 400 while omitting a key means "leave it alone". **A key that already
has a value therefore cannot be emptied** — an owner who deletes their phone
number and saves would otherwise watch nothing happen and be told it worked.

Handled rather than hidden: `settingsBlockPayload()` drops what the schema
would reject, `unclearableKeys()` works out what the user tried to remove, and
the save toast names those fields instead of claiming a clean success. Real
clearing needs the DB-side schema to accept null or empty for those keys — a
small ask to bundle with G1/G2 rather than a separate trip.

`false` and `0` are deliberately *not* treated as empty: "not registered for
tax" and "a 0% rate" are answers, and filtering on falsiness would silently
refuse to save either. That's what `settings-patch.test.ts` pins down.

### Order lines are set up inside the Orders step (decided 2026-08-07)

Not a sixth wizard step. `order_item` is a system word; a print shop owner
looking for "where do I say a banner has a size" would not look for a stage
called Order items. The Orders step now carries both, with the lines under
"For each item on an order".

Structurally that meant `EntityFieldSetupStep` — which was one-entity-by-
construction — becoming a shell over a new `EntityFieldSection`. All per-entity
state (starter toggles, staged edits, the composer, the status drill-in) moved
into the section, so a second entity costs a second mount rather than a second
copy of the logic. The step keeps only what spans the sections: the footer, the
apply order, and hiding everything else when the status workflow takes the
panel over.

Two details worth knowing:

- **Each section has its own composer.** One shared "+ Add a field" would be
  ambiguous about which entity it adds to.
- **Sections apply in order and stop on the first failure.** Pressing on would
  leave half the starters created behind an error toast that reads as "nothing
  happened".

**Small and real:** `create_order` defaults status to `'pending'`, which is not
in `ORDER_STATUS_WORKFLOW`. A configured org's `validate_custom_data` rejects
it. Invisible only because `OrderFormSheet` always sends the workflow default —
anything creating an order outside that form hits it.

---

## Aggregates

The first draft deferred all six rollups to "the metrics layer". Too blunt —
most are cheap scoped queries:

| Screen | Figure | Cost |
|---|---|---|
| C1, C2 | "Owes 180,000" | Sum `balance` over the client's orders — one query, now |
| C1, C2 | "12 orders" | Count on the same query — free |
| F1 | "Unpaid invoices · 3 Overdue" | Live documents with `due_date` passed — one query, now |
| D1, D2 | "24 orders · 41 units · UGX 3,690,000" | `order_items` grouped by product across all time — **this** needs the metrics layer |
| H1 | "Sales this month" | Already scaffolded as a bounded client-side sum (see STATE.md) |

So most of C1, C2 and F1 land now; only product lifetime stats wait.

---

## Code the design supersedes

- **`OrderFormSheet`** (460 lines) — 3-column grids and `Select` dropdowns. B2
  replaces it wholesale: full screen, status chips, search-in-place for client
  and product, UGX/% discount pair, inline notes, summary after payments.
  Rewrite, not an edit.
- **`OrderViewSheet` + `order-view/*Tab.tsx`** (5 tabs) — B4 is one scrolling
  hub with sections. The tabs go.
- **`app/api/invoice-settings/v2/route.ts`** — legacy (Supabase session,
  `public` schema). F3 must not build on it.

**Guardrail that needs amending:** B2 moves order creation from
`openCreateOrder()` to a route, which contradicts CLAUDE.md's "One sheet, one
door / never navigate to another page to pop a modal." Write the carve-out
explicitly: **composing a record is a screen; deciding one thing is a sheet.**
Create/edit order, the order hub, client and product detail, and the document
surfaces are screens. Add item / payment / note / issue document are sheets.

---

## Sequence

1. ✅ **Done** — the `orders/[id]` payments bug and the test that ratified it;
   the buildable-now data layer; org settings; Home's segmentation.
2. 🔵 **With the DB owner** — `DB_ASKS.md`. **The UI rebuild waits on this**
   (decided 2026-08-07): B2 alone needs A1 for its discount row and A2 for its
   note types, and building the screen twice costs more than waiting once.
3. **UI rebuild, in design order** — B2 (+ its add-item / payment / note
   sheets) → B4 order hub → C2 / D2 detail → F1 + F3 → F2 last, gated on A3a.
4. **Trailing** — the C1/C2/F1 aggregates, T5's delete-vs-cancel decision.

### B2 groundwork already landed (2026-08-07)

Paused mid-build, but what exists is transcribed from the frame rather than
guessed, so it resumes rather than restarts:

- `components/orders/new-order/screen-parts.tsx` — the layout vocabulary read
  off `BZdA1`: 40px field boxes, 11/14 list rows, 7/11 chips, the 16/7/22/24
  spacer rhythm, the 150×44 footer action. Includes the frame-hex → theme-token
  mapping, so these hold in both themes and `--primary` stays the org's colour.
  Recurs on B4/C2/D2/F1 — promote out of `new-order/` when B4 lands.
- `components/orders/new-order/ClientField.tsx` — B2d, which is a *state* of B2
  rather than its own screen: the field becomes a search in place.

**One thing removed rather than faked** while building it: the client search
rows show what each client owes in the frame. `clients` has no balance column
and the figure is a sum over that client's order balances — the aggregate in
step 4. Left as a tracked `TODO(v2 read layer)`.

---

## Parked

- **Standalone payments / unapplied credit.** v2 supports a payment with zero
  allocations (credit sitting on a client's account, `v_payment_unallocated`).
  No screen covers it, and C2's Billed / Paid / Outstanding cannot represent a
  client who is *ahead*. In user terms: "Grace paid 100,000" before there is an
  order to attach it to — ordinary in a print shop. Deferred by decision
  2026-08-07; the SINGLE RECEIVABLE half of it rides with G3 and is **not**
  parked.

## Open decisions

- T5 — does "delete" archive out of the list, or become "cancel" only?
- Tax number: `settings.tax.number` or `settings.identity.tax_id`?
- Does Documents or Products replace Expenses in the mobile tab bar?
