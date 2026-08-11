# App redesign — screens vs schema vs code

Last updated: 2026-08-10. Source of truth for the surface redesign that
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
| A1 | Your business (first-run) | ✅ Built (`BusinessDetailsStep`) — see below; the wizard alone did **not** cover it |
| A2 | Orders — empty state | ✅ Built (a state of `OrdersListScreen`) |
| B1 | Orders — the working list | ✅ Built (`OrdersListScreen`) |
| B2 | New order — full screen | ✅ Built (`NewOrderScreen`, `/dashboard/orders/new`) |
| B2a / B2a2 | Add item — search / chosen | ✅ Built (`AddItemSheet`) |
| B2b | Add payment | ✅ Built (`AddPaymentSheet`) |
| B2c | Add note | ✅ Built (`AddNoteSheet`) |
| B2d | Client search | Built (`ClientField`) — a *state* of B2, not a screen |
| B3 | Add a line — product or one-off | ⛔ **Out of scope** (2026-08-10) |
| B4 | Order — the hub | ✅ Built (`OrderHubScreen`, `/dashboard/orders/[id]`) |
| B5 | Move stage | ⛔ **Out of scope** (2026-08-10) |
| B7 | Issue document | ✅ Built (`IssueDocumentSheet`) — no Receipt chip, A3c postponed |
| B8 | Order discount | ✅ Built (`DiscountSheet`) |
| B9 | Invoice — the document | ✅ Built (`DocumentPaper`, `/dashboard/documents/[id]`) |
| C1 | Clients | Exists, pre-redesign |
| C2 | Client detail | ✅ Built (`ClientDetailScreen`) |
| D1 | Products | Exists, pre-redesign |
| D2 | Product detail | ✅ Built (`ProductDetailScreen`) |
| E1 | Track something else | ⛔ **Out of scope** (2026-08-10) — `EntityFieldsManager` stands |
| E2 | Notes | Not built — unblocked (A2, 2026-08-07) |
| E3 | Settings — what you can change | Partially (`/dashboard/organization`) |
| F1 | Documents | ✅ Built (`/dashboard/documents` + org-wide list API) |
| F2 | New invoice — combine orders | Not built — unblocked (A3a/A3b, 2026-08-09) |
| F3 | Invoice settings | ✅ Built (`InvoiceSettingsScreen`) |
| H1 | Home (mobile feed) | Built, metrics scaffolded |

**15 of 26 built to the redesign** (F3, F1, B9, C2, D2, then B2 with its four
sheets, B4, B7, B1, A2 and A1 on 2026-08-10). **Nothing is blocked on schema any
more** — every remaining row is app work. **The order module is complete end to
end**: list → create → hub → issue → document, all on the redesign, and the
last pre-redesign order code is deleted. What is left is the two other lists
(C1, D1), the settings hub (E3), the notes surface (E2), and F2.

### Scope call, 2026-08-10: B3, E1 and B5 are out

Owner's decision. **B3** was a rival take on the same sheet as B2a/B2a2
(line-first with qty/unit-price/discount, versus product-first with size
chips); B2a2 wins and B3 is not built. **E1** stands as `EntityFieldsManager`.
**B5** is dropped as a surface entirely.

The consequence worth not losing: **stage changes still happen, inline.** B2
and B4 each carry their own STATUS chip row *inside* the frame — that belongs
to those screens, not to B5 — and stages keep being *defined* in the existing
`StatusWorkflowEditor`. So there is no stage-editor surface to build, and
`StatusDropdown` simply rides along until B1 replaces the list that uses it.

**14 surfaces remained** at the time of the call: B2 (+B2d state), B2a/B2a2,
B2b, B2c, B8, B4, B7, B1, A2, C1, D1, E2, E3, F2. **Five remain** after
2026-08-10: C1, D1, E2, E3, F2.

---

## Live bug: issuing a document 400s (found 2026-08-10)

`useDocuments.issueDocument` posts `entity_id: <uuid>`; `documentIssueSchema`
has required `entity_ids: [uuid]` since A3a/A3b landed. Zod strips the unknown
key, `entity_ids` is then missing, and every issue attempt from the order view
sheet fails validation. The client half of that change was never made.

`app/api/documents/route.test.ts` posts `entity_ids` directly, so the route is
green and the break sits entirely in the gap between hook and route — **the
third instance of the class** after `document:`/`doc:` and the `orders/[id]`
payments filter. The first two were tests asserting a bug; this one is a test
suite with no layer that exercises the hook against the schema at all.

**Fixed 2026-08-10 with B7.** `DocumentIssueInput` now takes `entity_ids` and
the hook sends `[entityId]`, which is also what F2 needs — the same call with
more than one id.

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
  function that hasn't caught up. **Postponed 2026-08-09 to the payments
  cutover** (A3c in `DB_ASKS.md`): a receipt shares none of the lines, tax or
  receivable machinery A3a/A3b built, and its snapshot shape is the payments
  module's to define. So **B7 ships with Quotation and Invoice only** — an
  affordance that can't be wired doesn't get drawn.

### G4. `create_order` and the inline payment's fields — **closed**

Was: inline payments ride inside the `create_order` payload rather than through
`record_payment`, and the handoff doc's §9 shape
(`{amount, payment_method, payment_date}`) implied a `reference` sent there
would be dropped DB-side with no error. This section therefore ruled that
**B2b must not offer a reference field when opened from the create-order flow.**

**That ruling is void as of A4 (migration `20260809180000`).** Reading the live
function settled both halves the doc had wrong: `reference` was always
persisted (`nullif(v_payment->>'reference','')`), and `notes` is persisted now
too. `orderCreatePaymentSchema` accepts both and stays `.strict()` for the
reason that survives — it takes exactly what `create_order` reads, so a key the
function doesn't read is a key that would vanish silently.

**So B2b is one sheet in both contexts**, offering the same fields from the
create-order screen and from the order hub. No branch, no context prop.

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

**Decided 2026-08-10 (owner): delete archives.** Deleting an order drops it out
of the default list rather than leaving it there wearing a Cancelled stage
chip. Three things that follow, none of them schema:

- Orders have no `archived` value, so the archive verb still resolves to
  `status='cancelled'` — the v2 convention is unchanged. What changes is the
  **read**, not the write.
- `GET /api/orders` filters by explicit `status` only and has no default
  exclusion — deliberately, since Home's segmentation and C2's client orders
  read the same route and must keep seeing everything. **B1 excludes on the
  client**: resolve the values whose `semantic` is `lost` from
  `useOrderStatuses()` and send the rest. Statuses carrying no semantic stay
  visible, matching `segment-orders.ts`'s rule that an order in a removed stage
  is exactly the kind someone still has to deal with.
- Cancelled orders need a way back into view. The frame's chip row (All /
  Unpaid / Due soon) stays as drawn; the Filters sheet carries the switch.

So B1 does **not** render the frame's Cancelled row (Rose Auma, ORD-0034) in
its default state — a deliberate deviation from the frame, on this decision.

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
| **F3 Invoice settings** | F3 | ✅ 2026-08-07 — built off the frame; superseded and deleted the four org-settings forms |
| **F1 Documents** | F1 | ✅ 2026-08-07 — built off the frame; now holds the fourth tab-bar slot |
| **B9 Invoice — the document** | B9 | ✅ 2026-08-07 — rendered from the frozen snapshot at `/dashboard/documents/[id]` |
| **C2 Client · D2 Product** | C2, D2 | ✅ 2026-08-07 — built off the frames, with rollups that are exact or absent |
| C1 / D1 list aggregates | per-row owing / order counts | 🔲 Same shape as the detail rollups; the list would need one per row |

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

### Rollups are exact or absent — never quietly partial (2026-08-07)

C2 and D2 both close on money that has to be summed from rows, because v2 has
no aggregate read layer. Home already does that with a bounded fetch and a
figure that is silently approximate, and STATE.md records the regret.

`lib/api/rollup.ts` is the alternative. Fetch up to a cap, compare what came
back against the **exact** count PostgREST returns, and report which of the two
you got. The screen then renders a real figure or says plainly that there are
too many to total yet — never a number that is wrong in a way nobody can see.

Note the asymmetry that makes this work: **the count stays exact either way**,
because PostgREST counts rows rather than sampling them. So "24 total" is
always true even when "UGX 3,690,000" cannot be.

Two things the frames revealed that are easy to miss:

- **A settled order shows its total in green with no balance**; only an order
  with money still on it shows `total · balance`. That contrast is the fastest
  read on the client screen.
- **C2's contact card and D2's detail rows are org-defined fields**, not
  columns. An org that never added `phone` has no contact card — which is
  correct, rather than a card full of blanks. `lib/fields/format.ts` turns a
  stored value into a readable one (a select's machine key into the org's own
  label, a dimension object into "2×4 ft"), and returns null for anything empty
  so the row drops out entirely.

### B9 renders the snapshot, and its actions had to change (2026-08-07)

The paper is **deliberately not theme-tokenized** — the documented exception in
CLAUDE.md, alongside PDF and print stylesheets. An invoice looks the same to
the customer who receives it whatever the sender's OS theme is, and inverting
it in dark mode would make the on-screen copy disagree with the printed one.

Everything comes from `snapshot`, never the live order: the order has moved on
and the document is what was agreed. `lib/documents/snapshot.ts` reads the
shape confirmed from the function source, and every accessor tolerates absence
— a snapshot written by an older version of `issue_document()` is still legally
a document and must still render. Nine tests cover that, including malformed
and empty snapshots.

**Two frame actions were replaced, both for the same reason.** The footer says
"Send to client" and the header carries a download icon; there is no mail
integration, and STATE.md is explicit that PDF rendering belongs to a worker
built from the snapshot which does not exist. A signifier that isn't wired
shouldn't be drawn. The footer action is **Print** — a real browser capability,
the closest honest equivalent for a paper document — with a print stylesheet
that drops the app chrome. The download affordance is omitted until the worker
exists.

The discount line renders only when `snapshot.totals.discount_total` is
present, so it simply won't appear until A1 lands. That is graceful rather than
broken: a document issued today genuinely has no order discount.

### Two deliberate deviations on F1 (2026-08-07)

Both are cases where the frame asks for something the data can't honestly
supply yet, and inventing it would be worse than the gap.

**The summary's left figure is a count, not a money total.** The frame shows
"UGX 1,860,000 · Unpaid invoices". Producing that means summing every live
invoice client-side, which is exactly the bounded-fetch approximation STATE.md
already regrets on Home — one is a scaffold, two is a habit. `count: 'exact'`
is a real answer to "how many", so the card keeps its shape and its figures are
true. The money returns with the metrics read layer.

**There is no "New invoice" action.** It opens F2 — several orders consolidated
into one invoice — which the schema cannot express until A3. A signifier that
isn't wired shouldn't be drawn, so the slot carries the real create path, New
order. Documents are issued *from* orders, so nothing is actually unreachable.

What the frame asked for that *is* now real: each row's client name comes
straight off `snapshot.recipient.name`, and its balance from
`payment_allocations` — the latter genuinely cannot come from the snapshot,
which is frozen at issue time before any money arrives.

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
2. ✅ **Done** — `DB_ASKS.md`, everything except A3c (postponed by decision to
   the payments cutover, not blocked). The UI rebuild waited on this
   deliberately: B2 alone needed A1 for its discount row and A2 for its note
   types, and building the screen twice costs more than waiting once.
3. ✅ **Done (2026-08-10)** — vocabulary consolidation: `screen-parts.tsx`
   merged into `patterns/screen.tsx`, the screen-vs-sheet carve-out written
   into CLAUDE.md. Everything below builds on one set of primitives.
4. ✅ **Done (2026-08-10)** — **B2 New order**, route `/dashboard/orders/new`. Client field (built) →
   status chips → dates → delivery → items → discount → payments → notes →
   summary → footer. The sheet host gains `add-item`, `add-payment`,
   `add-note`, `discount`.
5. ✅ **Done (2026-08-10, with step 4 — see below)** — **the four sheets**: B2a/B2a2, B2b, B2c, B8, all through `OrderSheet`. Two
   app-side gaps land here: `useNotes.addNote` must carry `custom_data` (the
   route already accepts it), and `STARTER_FIELDS` needs a `note` set
   (`StarterEntity` gains `'note'`) so B2c's TYPE chips have a source.
6. ✅ **Done (2026-08-10)** — **B4 Order hub**, route `/dashboard/orders/[id]`, one scrolling surface
   with inline stage chips. Needs `POST`/`PATCH`/`DELETE
   /api/orders/[id]/items` + hook + colocated `route.test.ts`; `trg_items_totals`
   fires on all three, so totals recompute themselves (verified against the
   live DB, not assumed). Deletes `OrderViewSheet` and `order-view/*`.
7. ✅ **Done (2026-08-10, with B4)** — **B7 Issue document**: Quotation and Invoice only, terms chips wired to
   `terms_days`. Fixes the `entity_id` → `entity_ids` break in the same pass.
8. ✅ **Done (2026-08-10)** — **B1 + A2**, the working list and its empty state. Deleted
   `OrdersTableNew`, `OrderRow`, `OrderCard`, `OrdersFilterSheet`,
   `StatusDropdown`, `OrderActions`, `OrderDeleteConfirmation`, `CustomDropdown`,
   and the whole `_components`/`_context` tree under the page.
9. **C1 + D1** — the same list language; per-row rollups exact or absent.
10. **F2**, then **E2** and **E3**.
11. **Trailing** — the C1/C2/F1 aggregates.

### B2 and its sheets, built 2026-08-10

**Steps 4 and 5 shipped together, and had to.** `orderCreateSchema` requires
`items.min(1)`, so a B2 without its add-item sheet is a screen nobody can
submit — and three of its seven sections would have carried "+ Add …" actions
that opened nothing, which is the one thing the mobile guardrails forbid.

What the screen is, and isn't:

- **A route, not a sheet** (`/dashboard/orders/new`), per the carve-out. The
  cutover is one line in the sheet host: `openCreateOrder()` now pushes the
  route. All **eight** call sites — Home's hero and recent-orders empty state,
  the client and product detail footers, the documents page, the orders page's
  `?new=1` deep link, onboarding's first-records step — moved without being
  touched, because they were already asking for an intent rather than a sheet.
  `OrderFormSheet` (460 lines) is deleted; git is the archive.
- **`DashboardLayout` renders it chromeless**, alongside the setup surface. A
  composing screen owns its own header and sticky footer, and the mobile tab
  bar would sit on top of that footer.

Four things worth not rediscovering:

- **`validate_custom_data` rejects unknown keys** (`unknown field % on %` —
  read from `pg_proc`, not assumed). The add-item sheet prefills a line from
  the chosen product, and copying the product's whole `custom_data` across
  would have failed *every* order create for any org whose product fields
  differ from its line fields — i.e. the shipped starter set, where products
  carry category/unit/size/material and lines carry only `size`. The prefill is
  an intersection with the line's own definitions, which is also what
  `presets.ts` always said it meant.
- **Notes are a second, non-atomic write.** `create_order` takes items and
  payments but not notes — a note is a row against an entity that must exist
  first. So a note failing after the order saved must never read as "the order
  didn't save"; the toast names what didn't attach and the order still opens.
- **Local date, not UTC.** `lib/orders/dates.ts` exists because
  `toISOString().slice(0,10)` files every order taken after 9pm in Kampala
  under tomorrow. `order_date` and `payment_date` are DATE columns — a calendar
  day, not an instant.
- **The status default is derived, not stored in state.** The workflow loads
  async; an effect writing the default into state races with the first tap and
  silently discards it. `status || defaultStatus` cannot.

Deliberately not faked, both tracked as `TODO(v2 read layer)`: B2a2's size
chips ("sizes already used on this product") need an aggregate over
`order_items`, so the line's fields render as themselves, prefilled from the
product; and the client search rows still omit what each client owes.

One thing the frame offers that is only half-wired, and says so in a comment:
`New client "kamp"` opens the create-client sheet **empty** rather than
carrying the typed name across, because the sheet host's `openCreateClient()`
takes no argument yet.

**Note types became real here.** `STARTER_FIELDS` gained a `note` entry (and
`StarterEntity` a `'note'` member) and `useNotes.addNote` now carries
`custom_data`, which the route already accepted. The list is org-editable —
which is why B2c and E2/E3 draw *different* types on the canvas and both are
right, so the preset takes B2c's list, that being the frame where a type is
chosen. Until E3's "Note types" row exists, the list is editable from the
orders page's Fields panel.

### B4 and B7, built 2026-08-10

Shipped together for the same reason B2 and its sheets did: B4's DOCUMENTS
section carries a "+ Issue" action, and an affordance opening nothing is the
one thing the mobile guardrails forbid.

**The tabs are gone.** `OrderViewSheet` and `order-view/*` are deleted. An
order is one object, and finding out whether it was paid should not mean
remembering which tab that lived behind. `openOrder()` in the sheet host now
pushes `/dashboard/orders/[id]` — the second intent to resolve to a route, and
again its call sites didn't change.

**No Save button.** Every action writes immediately and refetches; the figures
on screen are the DB's, never the screen's arithmetic. The one thing the hub
computes is the *subtotal*, because `orders.total_amount` is already net of the
discount and deriving the subtotal back out of it would be arithmetic on
arithmetic — it sums the rows the DB returned instead.

**What had to be built underneath:**

- **`/api/orders/[id]/items` (POST) and `/items/[itemId]` (PATCH, DELETE)**,
  with 18 colocated contract tests. No RPC: `trg_items_totals` fires on all
  three operations, so writing the row *is* the operation. Every handler proves
  the order belongs to the caller's org first — without that a foreign order id
  would recompute another tenant's totals, which is SEC-05 with money attached
  — and the line handlers pin `order_id` as well as `id`, so a line can't be
  edited through the wrong order's URL.
- **`TenantDb` gained a delete**, narrowed by type to `DeletableTable` =
  `'order_items'`. The "entities archive, nothing is destroyed" rule is intact
  and still type-enforced (`test/types/tenant-scoping.ts` asserts
  `from('orders').delete()` does *not* compile); `order_items` is the case the
  rule doesn't fit — no status column to archive into (checked against the live
  schema), no identity outside its order, already CASCADEs with it. A wrong
  line left on an order forever is a wrong total forever.
- **`GET /api/orders/[id]` now embeds `products(name)`**. Without it a
  catalogue line carries only `product_id` — `product_name_raw` is set for
  one-offs only — and every row would have read "Item".
- **`apiRequest` learned DELETE**, and sends no `Content-Type` when there's no
  body.

**Removal lives in the edit sheet, not on the row.** The frames give item rows
no remove affordance (checked: B2's only small path is the client field's clear
icon), so tapping a line opens it and "Remove this item" sits inside — you open
a line to change it, and one of the changes is that it shouldn't be there.

**Two things deliberately not drawn.** The frame's ⋯ overflow in the hub header
has no menu defined anywhere on the canvas, so it isn't rendered. And notes
have no Remove: `/api/notes` has no PATCH or DELETE, so the button would open
nothing — `NoteCard`'s `onRemove` is optional for exactly this, present on a
draft and absent on a saved note.

**B7 ships Quotation and Invoice only.** The Receipt chip the frame draws stays
out until A3c lands with the payments cutover. Terms chips send `terms_days`
only when someone actually picks one, so the org's own default otherwise
stands, and the sheet states the tax rather than computing it — `issue_document`
resolves tax from settings, and a second computation here could disagree with
the paper.

### B1 and A2, built 2026-08-10

The last pre-redesign order surface. `OrdersTableNew` (642 lines) and its
satellites are gone, and the page dropped from 19.8 kB to 6.4 kB.

**A2 is a state of B1, not a second screen.** The frame draws it with the same
header, summary card and quick actions — only with zeros and a prompt where the
rows would be — so splitting them would mean maintaining that chrome twice. The
empty state distinguishes three cases that are easy to conflate: an org that
has never taken an order, a search that matched nothing, and a filter that is
simply empty right now. Telling a shop with 200 orders that it has none is the
failure mode worth avoiding.

**"All" is where the delete-archives decision actually lands.** The list
excludes every status whose `semantic` is `lost`, computed from the org's own
workflow — never from a hardcoded `'cancelled'`, which is the mistake this
codebase has now made three times. A "Cancelled" chip brings them back, and
appears only when the workflow has such a stage.

**Two things the API had to learn**, both with contract tests:

- **Search covers client name as well as order number**, because that is what
  the frame's box says and what a shop actually types. PostgREST can't `or`
  across an embedded relation, so the route resolves matching client ids first
  and folds them into one `or` over two real columns — one query, so paging
  stays correct. The search term is stripped of `(`, `)` and `,` first: those
  are `or`-filter syntax, and a client called "Smith, Jones" would otherwise
  silently change which orders came back.
- **"Due soon" filters a custom field, not a column.** `due_date` is a starter
  field an org may have renamed or removed, so the route resolves *its own*
  date field from `field_definitions` and builds the jsonb path from that. The
  field name is never taken from the query string — it lands inside a PostgREST
  filter, and a caller-supplied column reference is not something to trust. An
  org with no date field isn't offered the chip.

**The summary is exact or absent.** "Orders this month" is always right
(PostgREST counts rather than samples); "Total sales" renders `—` with a plain
explanation when the month exceeds the rollup cap, rather than a number that is
quietly missing orders. Same rule as C2, D2 and F1.

**One frame affordance left out:** the "New quote" quick action. A quotation is
an order at a stage the org defines, and B2 already opens at that default — so
the chip would either duplicate New order or hardcode a status value the app
doesn't own. That is T1's reasoning applied to a button.

### A1 was marked built and wasn't (found 2026-08-10)

This inventory credited A1 to `ONBOARDING_REDESIGN.md` since 2026-08-07. That
was wrong, and the frame's own subtitle is the tell: **"the form, no
narration"**. What existed was a wizard whose first screen was a `WelcomeStep`
narrating the data model, followed by a currency-only step. The frame asks for
something else entirely — one **Business Details** form: business name,
industry, location, phone, email, currency, and a Get Started button.

The gap mattered more than a missing screen. STATE.md has carried this since
2026-08-02 under "Open, needs a product call": onboarding collected currency
and nothing else, while `issue_document()` freezes `settings.identity` as the
invoice issuer — so a shop that finished setup and raised its first invoice got
a **blank letterhead**. A1 *is* the answer to that open question, and building
it closes the item rather than deferring it again.

**What it maps to.** Every field but one lands in `settings.identity`
(`legal_name`, `address`, `phone`, `email`) or `settings.locale.currency` —
both already whitelisted blocks, so no DB change. `industry` needed one line:
the DB whitelists settings *blocks* and not the keys inside them, so it already
accepted the key; the `.strict()` that rejected it was ours, in `settingsBlocks`.

**Five steps now, all numbered.** Welcome and Currency are gone as steps —
`SetupStepId` is `business | product | client | order | records`, and
`NUMBERED_STEPS` is simply `SETUP_STEPS` because there is no longer an
un-numbered intro. `STEP_COUNT` stays 5.

**A1 renders outside `SetupShell`**, which is the design's point rather than an
omission. The frame has no rail, no step tracker and no "STEP 1 OF 5" — its
subtitle is "the form, no narration", and a progress counter above an empty
form is the same instinct as the welcome page it replaced. The shell returns
for the field-setup steps, which genuinely are a sequence. This is also why
the wizard returns the step directly rather than wrapping it.

**Measured against the frame, not approximated:** 20px gutters, 52px above a
48px org mark at 14px radius, 24/600 title, 6px, 13.5px subtitle, 26px, then
six fields of an 11/500 uppercase label 6px above a 44px box (8px radius, 1px
`$border`, 12px side padding) with its value at 14.5/500, 14px apart, closing
on a full-width 48px action at 15/600 with 28px beneath it.

**Two deviations, both deliberate:**

- **LOCATION has no chevron.** The frame gives it one, alongside INDUSTRY and
  CURRENCY. Those two open real pickers; `identity.address` is a single string
  with no picker behind it, and a caret promising a surface that doesn't exist
  is worse than a plain field that takes what you type.
- **The org mark's initials are heavier than the frame's 600.** `OrgLogo` is
  shared with the rail and the setup header at other sizes, and it renders
  Clerk's org image whenever there is one — initials are the pre-load fallback,
  not the normal case, so it wasn't worth forking the component over.

**Only currency is required**, for the reason it always was: `issue_document()`
refuses to raise anything without it, quoting "complete setup first", so
letting Continue pass would stamp onboarding complete and then fail every
document. Blanks are **omitted from the payload** rather than sent as `''`,
because settings is frozen into document snapshots and `"phone": ""` asserts a
blank phone number rather than an unanswered question.

**The business name is prefilled from the Clerk organization.** It is what the
user typed to create the org, so asking again on a blank line is the app
pretending not to know something it does. `provision_organization` seeds
`identity.legal_name` for new orgs, so the fallback mainly catches the org that
predates it — which is exactly the one with the blank letterhead. Seeding waits
for **both** Clerk and the settings fetch: Clerk resolving first would seed a
blank currency from still-loading settings and then block Continue on a
decision the user had already made.

**Industry is a suggestion list, not a taxonomy.** `INDUSTRY_OPTIONS` fills a
drill-in with a "something else" box, and the value is stored as free text.
Nothing downstream branches on it yet; it is the natural input for choosing
between starter field sets once more than the print-shop one exists.

**Email is validated inline** rather than left to the round trip:
`settingsBlocks.identity.email` is `.email()`, so a malformed address would
otherwise come back as a 400 with a zod path in it for the user to decode.

### B2 groundwork already landed (2026-08-07)

Paused mid-build, but what exists is transcribed from the frame rather than
guessed, so it resumes rather than restarts:

- ~~`components/orders/new-order/screen-parts.tsx`~~ — the layout vocabulary
  read off `BZdA1`: 40px field boxes, 11/14 list rows, 7/11 chips, the
  16/7/22/24 spacer rhythm, the 150×44 footer action, plus the frame-hex →
  theme-token mapping so these hold in both themes and `--primary` stays the
  org's colour. **Merged into `components/patterns/screen.tsx` and deleted
  (2026-08-10)** — the promotion this line anticipated, brought forward.

  It had to happen before B2 rather than after B4: while B2 was paused, C2, D2,
  F1, F3 and B9 were built on `patterns/screen.tsx`, which had independently
  grown its own `ScreenHeader`, `ScreenFooter` and `Card` (≡ `ListBox`). Two
  vocabularies for one design language, and whichever one B2 picked up, the
  other nine screens would have inherited the fork. `Section` gained
  `actionLabel`/`onAction` rather than keeping a separate `SectionHead`.

  The result is **two files, one vocabulary**: `patterns/screen.tsx` is the
  furniture (header, section, card, divider, footer) and `patterns/controls.tsx`
  the inputs (`FieldBox`, `ChoiceChip`, `ListRow`). Split by role at the moment
  of the merge, while it cost one import line — the merged file was already
  269 lines with eleven screens still to build on it. Not a fork: the split is
  by what a thing *is*, and neither file duplicates the other.
- `components/orders/new-order/ClientField.tsx` — B2d, which is a *state* of B2
  rather than its own screen: the field becomes a search in place.

**One thing removed rather than faked** while building it: the client search
rows show what each client owes in the frame. `clients` has no balance column
and the figure is a sum over that client's order balances — the aggregate in
step 4. Left as a tracked `TODO(v2 read layer)`.

### What reading the live schema changed (2026-08-07)

Direct access to the v2 project settled the two open questions and corrected
three things this document had wrong. Details in `DB_ASKS.md`; the ones that
change app work:

- **F1 needs no join for the client name.** `snapshot.recipient.name` is frozen
  into every document at issue time. An earlier draft of the documents route
  resolved `entity_id` → order → client to get it; that was reverted, and it
  turns out to have been unnecessary rather than merely premature.
- **`show_in_documents` drives real output.** `issue_document()` builds
  `lines[].fields`, `recipient.fields` and `order_fields` from it. The toggle
  view added on the org settings page controls what an invoice actually prints.
- **`identity.tax_id` is correct and `tax.number` is dead.** The snapshot's
  `issuer` is `settings.identity` verbatim; the tax block contributes only
  label/rate/registered.
- **A regression shipped earlier the same day was found and fixed.**
  `orderCreatePaymentSchema` rejected `reference` and accepted `notes`, on the
  handoff doc's authority. The live function is the exact opposite: it reads
  `reference` and has no `notes` column in its insert. Inverted, with tests
  rewritten against the source rather than the doc.

**Standing lesson:** `orders-system-handoff.md` §9 is stale and was trusted
twice. Read `pg_proc` before encoding a claim about what a function accepts.

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

None. All three that stood here are closed:

- **T5 — delete vs cancel**: decided 2026-08-10, *delete archives*. See T5.
- **Tax number**: `settings.identity.tax_id`. Resolved 2026-08-07 from the
  snapshot's `issuer` — see Field classification.
- **Tab bar**: Documents took the fourth slot; Products sits in More. Already
  shipped in `MobileTabBar`, so this was stale rather than open.
