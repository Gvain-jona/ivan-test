# Schema asks — v2

Raised 2026-08-07, from reconciling the 26-frame surface redesign
(`APP_REDESIGN.md`) against the live `v2` schema.

**Verified against the live database** (`giwurfpxxktfsdyitgvr`), reading
`pg_proc` sources directly — not against `orders-system-handoff.md`, which is
stale in at least two places noted below. Every claim here about what a
function does or doesn't do was read, not inferred.

This is the whole list. It is short on purpose: two working principles kept it
that way — the DB models correctly while the UI translates, and anything not a
core column becomes a `field_definitions` entry rather than a migration. Applying
those turned four apparent gaps into two, and everything else in the designs
resolved to something that already exists.

Each ask says what breaks without it, so anything here can be declined on its
merits rather than assumed necessary.

**Status.** **A2 is done** — applied 2026-08-07, see below. **A1 is the one
that matters now**: it blocks B2, B4, B7, B8, B9 and F2, i.e. the whole UI
rebuild. A3 blocks consolidated invoicing. A4 and A5 are papercuts that can
ride along with either.

A1 was deliberately left to the schema owner rather than self-applied: it
changes `recompute_order_totals()` and `issue_document()`, both of which decide
what money a document states.

**All of these are additive** — new columns and function bodies, nothing dropped
or retyped. Verified 2026-08-07: the project holds 1 organization and 10 field
definitions, and **zero** orders, order_items, documents, payments, notes,
clients or products. There is no backfill to weigh.

---

## A1 — Order-level discount has nowhere to live · **blocks B2, B4, B7, B8, B9, F2**

### The gap

A shop gives 10% off an order. There is no column for it.

- `order_items.discount` exists but is **per line and absolute** — it can't
  express "10% off the whole order", and distributing a percentage across lines
  rounds badly and can't round-trip back to the percentage the user typed.
- `documents.discount_total` exists but only comes into being **at issue time**,
  so an order that hasn't been invoiced yet has nowhere to hold it.
- `orders.custom_data` can hold the number, but `total_amount` is
  trigger-computed from the lines and would ignore it — the order would read
  480,000 while its own invoice reads 432,000.

This is the one place where storage and presentation genuinely cannot be
decoupled: the stored number *is* the thing being discussed.

### Proposed — three parts, all needed together

```sql
alter table v2.orders
  add column discount_type  text    check (discount_type in ('amount','percent')),
  add column discount_value numeric not null default 0;
```

**1. `recompute_order_totals()`** currently reads, in full:

```sql
total_amount = COALESCE((SELECT SUM(total_amount) FROM v2.order_items
                         WHERE order_id = v_order), 0)
```

It needs to subtract the order discount after that sum, so `total_amount` — and
therefore the generated `balance` and `payment_status` — account for it.

**2. `issue_document()` hardcodes `discount_total` to `0`** in its insert. Left
as-is, an invoice would show the pre-discount total while the order shows the
discounted one. It also needs the discount in `snapshot.totals`, which is what
the rendered document reads.

**3.** The trigger fires on `order_items` changes. Editing the discount alone
touches only `orders`, so it needs its own trigger or the app has to nudge a
line — worth deciding DB-side rather than working around in the app.

### Question

Is a discount exceeding the line subtotal worth a constraint, or is clamping
the app's job?

---

## A2 — ✅ **DONE 2026-08-07** — notes now carry org-defined fields

Applied as migration `20260807213900_notes_custom_data_and_note_field_entity`
and mirrored into `supabase/migrations/`. Option A below, and it turned out
cheaper than written: **`validate_custom_data()` was not touched.** It is
already parameterised by `TG_ARGV[0]` and reads `NEW.custom_data` /
`NEW.organization_id` generically, with `order` status as its only
entity-specific branch — so notes needed nothing but their own trigger
registration, the same shape as `trg_validate_client_cd`.

Three additive statements: `notes.custom_data jsonb not null default '{}'`, a
widened `field_definitions_entity_check` (which already permitted `payment` and
`attachment` — the app surfaces neither), and `trg_validate_note_cd`.

App side: `'note'` added to `fieldEntitySchema` / `FieldEntity` /
`FIELD_ENTITIES`, `custom_data` accepted by `noteCreateSchema` and returned by
`/api/notes`, and `DatabaseV2` updated by hand.

**Still to build, not blocked:** the note-type chips on B2c and the "Note types"
row on E3 — both are UI in the rebuild, and an org has no note types configured
until something writes them.

<details><summary>Original ask, kept for the record</summary>

### The gap

### The gap

`v2.notes` is `entity_type` / `entity_id` / `content`. The designs group notes
by kind — Artwork, Delivery, Client request, General — and the settings screen
presents that list as **something the organization edits**, not a fixed set.

There is no column for it, and `notes` has no `custom_data` either, so the usual
escape hatch (put it in the field registry) isn't available.

### Proposed — either, preferring the first

**A.** Give notes the same treatment every other entity has:

```sql
alter table v2.notes add column custom_data jsonb not null default '{}'::jsonb;
```

plus `'note'` accepted as a `field_definitions.entity`, and `validate_custom_data`
covering the table. The org then defines its own note types exactly the way it
defines order statuses, and the settings screen needs no special case.

**B.** A plain `notes.note_type text`. Smaller, but hardcodes a concept the
design explicitly presents as configurable.

App side is one line either way (`'note'` added to the field-entity enum).

</details>

---

## A3 — `issue_document()` covers one order, and only orders · **blocks F2, B7's receipt**

Three related extensions to one function.

### A3a · One invoice covering several orders

A shop invoices a regular client once for the month, not per job. Today
`documents.entity_type` + `entity_id` is a single reference.

**No new table needed** — we reconsidered this. A consolidated invoice can be
`entity_type='client'` with the covered orders inside `snapshot`, and "which
orders has this invoice billed" answered by a JSONB containment query. Double
billing doesn't need a constraint either, since `issue_document()` is already
the only way a document comes into existence.

The ask is that the function accept **several order ids** and freeze them into
one snapshot.

### A3b · Three guards assume one document = one order

All three read as order-scoped, and a client-level invoice slips past every one.
Confirmed by reading the sources; each is silent rather than loud.

1. **`validate_payment_allocation()`** locks an order once it has a live
   invoice by counting `documents where entity_type='order' and entity_id =
   new.target_id`. A consolidated invoice matches nothing there, so
   order-targeted allocations keep being accepted — money split across two
   receivables for one debt.
2. **`v2.allocation_order_id(target_type, target_id)`** resolves a document
   back to its order so the payment's party can be checked. For a client-level
   document it returns null, and the caller then raises *"does not resolve to
   an order — cannot verify party"*. So consolidated invoices wouldn't merely
   bypass the guard; they'd fail allocation outright.
3. **`issue_document()`'s own one-live-invoice check** is likewise
   `entity_type='order' and entity_id = p_order_id`, so nothing would stop a
   consolidated invoice being issued over orders that already have their own.

Must ship with A3a, not after.

### A3c · Receipts

`documents.entity_type` already permits `'payment'`, but nothing can produce
one. The app currently refuses `entity_type != 'order'` at the API rather than
letting the call fail deeper in. Expected with the payments cutover; noted here
so it isn't forgotten.

---

## A4 — `create_order()` silently drops a payment's note · **small**

Its payment insert names exactly:

```
organization_id, direction, party_type, party_id,
amount, payment_date, payment_method, reference, created_by
```

- **`reference` is persisted** — `nullif(v_payment->>'reference','')`. The
  handoff doc omits it; the doc is wrong. The app now passes it through.
- **`notes` is not there.** A note sent with an inline payment disappears with
  no error. `record_payment()` — the other path — does store one, so the same
  field is capturable when recording a payment against an existing order and
  lost when recording one while creating the order.

Ask: add `notes` to the insert. Until then the app **rejects** it on this path
rather than letting it vanish, which means the create-order payment sheet can't
offer a note field.

---

## A5 — A settings value cannot be cleared · **papercut**

`organizations.settings` blocks are validated strictly and most of their string
keys require at least one character. So sending `""` is rejected, and omitting a
key means "leave it alone" — which leaves **no way to remove a value once set**.

An owner who deletes their phone number and saves currently gets told which
fields kept their old value, because the alternative was reporting a success
that didn't happen.

Ask: accept `null` (or empty string) as "clear this" for the optional string
keys in `identity`, `tax` and `documents`.

---

## Answered by reading the source — no longer questions

Both were open until 2026-08-07 and are settled; kept here because decisions
elsewhere rest on them.

**1. `documents.snapshot` shape.** Built by `issue_document()` as:

```
meta         { document_type, document_number, order_number, order_date, issued_at }
issuer       ← settings.identity, verbatim
recipient    { client_id, name, fields{} }
order_fields { <field_label>: <value> }
lines        [ { description, quantity, unit_price, discount, total, fields{} } ]
totals       { currency, subtotal, tax_total, total, tax_label, tax_rate,
               tax_registered, amounts_include_tax }
terms        { terms_days, due_date, valid_until, footer, bank_details }
```

Two consequences for the app:

- **The client's name is already in the snapshot** (`recipient.name`), so a
  documents list needs no join back through the polymorphic `entity_id`. The
  frozen name is arguably the more correct one to show, since it's what the
  document says.
- `bank_details` is nulled unless `settings.documents.show_bank_details` is
  true, and every `fields{}` block is populated from
  `field_definitions.show_in_documents`. That flag is genuinely load-bearing on
  the rendered output.

**2. The tax number.** `issuer` is `settings.identity` copied verbatim, and the
tax block contributes only `tax_label` / `tax_rate` / `tax_registered`.
**`settings.tax.number` is never read.** So `identity.tax_id` is the one that
reaches a document — which is what the settings screen writes.

---

## Not asked for, deliberately

Recorded so they aren't re-raised:

- **`quotation` as an order status** is right. An order awaiting confirmation is
  a state of the same record, and modelling it as a status keeps one lifecycle
  instead of two tables. The UI simply doesn't render it as a production stage.
- **A `document_entities` link table** was drafted and withdrawn — see A3a.
- **Anything the designs show that isn't a core column** (due date, delivery
  method, size, material, category, client phone/type) is a `field_definitions`
  entry and needs no schema change.
