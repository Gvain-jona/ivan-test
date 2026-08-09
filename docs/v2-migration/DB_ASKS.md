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
that matters now**: it blocks B2, B4, B7 and B8, and part 4 of it (rounding at
the currency's scale) is not optional — without it the discount produces
invoices whose printed figures don't add up. A3 blocks consolidated invoicing.
A4 and A5 are papercuts.

> **A correction, since an earlier version of this file went out claiming
> otherwise:** the rounding issue was written up as "A6, a live defect today
> with no discount involved". That was wrong, and measurement disproved it —
> today's `issue_document()` reconciles in 367 of 367 cases in both tax modes,
> because it only ever rounds one value independently. The problem appears only
> once a discount adds a third. It is now part 4 of A1 rather than a standalone
> item, and **nothing needs fixing ahead of A1.**

A1 was deliberately left to the schema owner rather than self-applied: it
changes `recompute_order_totals()` and `issue_document()`, both of which decide
what money a document states.

**All of these are additive** — new columns and function bodies, nothing dropped
or retyped. Verified 2026-08-07: the project holds 1 organization and 10 field
definitions, and **zero** orders, order_items, documents, payments, notes,
clients or products. There is no backfill to weigh.

---

## A1 — Order-level discount has nowhere to live · **blocks B2, B4, B7, B8, B9, F2**

> **Part 1 applied and verified 2026-08-09** (`20260807220500_order_level_discount_and_currency_scale.sql`).
> `orders.discount_type` / `discount_value`, `v2.currency_scale()`,
> `v2.order_discount_amount()`, and both recompute triggers are live; seven
> arithmetic cases check out exactly, including UGX rounding at scale 0.
> `DatabaseV2` now carries the two columns.
>
> **Part 2 is still open, and it is now a divergence rather than a gap.**
> `issue_document()` sums `order_items` and writes `discount_total = 0`, so it
> would bill the *undiscounted* amount while `orders.total_amount` is net. It is
> unreachable through the app — `create_order()` takes no discount fields and
> `orderUpdateSchema` allowlists four keys that exclude them — so the ordering
> constraint is firm: **`issue_document()` must understand the discount before
> any write path exposes it.** Part 2 also owes `issue_document()` the currency
> scale; its tax maths still rounds at a hardcoded 2dp.

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

### What kind of discount this is — it decides everything else

This is a **trade discount**: a reduction from list price granted at the time of
supply. Not a settlement discount ("2/10 net 30"), which is conditional on early
payment and is treated differently under both revenue and VAT rules. v2 has no
settlement-discount concept and shouldn't acquire one through this change.

Two consequences, both of which the proposal below depends on:

- **Revenue is recognised net.** Under IFRS 15 / ASC 606 the transaction price
  is the consideration the seller expects to be entitled to, i.e. after trade
  discounts. A trade discount is never journalised as its own account — so
  `discount_total` on the document is *presentational and evidential*, not a
  ledger entry, and revenue is `documents.total`. That is consistent with where
  v2 already puts it.
- **VAT is charged on the discounted amount.** The taxable amount excludes price
  discounts granted at the time of supply — EU VAT Directive Art. 79(b), UK VAT
  Notice 700 §7, and the same rule in Uganda's VAT Act (taxable value is the
  consideration actually given). So tax computes on the net, which is what the
  table below does.

### The tax interaction — the part that silently goes wrong

`documents.total` is generated as **`(subtotal - discount_total) + tax_total`**,
and in that formula `subtotal` and `tax_total` are both **tax-exclusive**. So
`discount_total` must be the *tax-exclusive portion* of the discount, and tax
must be computed on the **discounted** net.

Worked with the canonical figures (480,000 gross, 10% off, VAT 18%):

| | subtotal | discount_total | tax_total | → generated total |
|---|---|---|---|---|
| Prices exclude tax | 480,000 | 48,000 | 77,760 | **509,760** |
| Prices include tax | 406,779.66 | **40,677.97** | 65,898.31 | **432,000.00** |

Note the second row: the stored discount is **40,677.97**, not the 48,000 the
user typed. Storing 48,000 there instead yields 424,677.97 — wrong by 7,322.03,
exactly the tax on the discount, and wrong in a way that looks plausible on
screen. This is the single most likely thing to get wrong in this change.

### Proposed

A shared helper so the discount is computed in exactly one place:

```sql
alter table v2.orders
  add column discount_type  text
    check (discount_type is null or discount_type in ('amount','percent')),
  add column discount_value numeric not null default 0
    check (discount_value >= 0);

create or replace function v2.order_discount_amount(
  p_line_sum numeric, p_type text, p_value numeric
) returns numeric language sql immutable as $$
  select case
    when p_type = 'percent' then round(p_line_sum * coalesce(p_value, 0) / 100, 2)
    when p_type = 'amount'  then least(coalesce(p_value, 0), p_line_sum)
    else 0
  end;
$$;
```

**Correction to an earlier draft of this ask:** it proposed `least(...)` to clamp
a discount larger than the order. That's wrong. Silently turning a 600,000
discount on a 480,000 order into 480,000 changes the user's figure without
telling them, and a negative-total invoice is not an invoice at all — it's a
credit note, which is a separate document type with its own
`related_document_id` lineage. **A discount exceeding the line sum should raise,
not clamp.** A CHECK constraint can't see the line sum, so the recompute trigger
is the place to reject it.

### Where this model is narrower than the invoicing standard

EN 16931 — the European e-invoicing semantic standard, and what UBL/Peppol
implement — models this as a **document-level allowance**, and pairs it with a
**charge**:

| | |
|---|---|
| BT-92 / BT-93 / BT-94 | allowance amount · **base amount** · **percentage** |
| BT-95 / BT-96 | allowance VAT category · VAT rate |
| BT-97 / BT-98 | reason · reason code |
| BT-99…BT-105 | the same fields for a **charge** |
| BT-106 − BT-107 + BT-108 | line net sum − allowances + charges = total without VAT |

Three gaps worth naming, none blocking:

1. **No charge slot.** A print shop has delivery fees, rush surcharges and setup
   fees — the same mechanism with the opposite sign. With only `discount_total`
   they have to be faked as line items, which then wrongly attract per-line
   treatment. If a `charge_total` is ever wanted, adding it alongside
   `discount_total` now is far cheaper than retrofitting the generated `total`.
2. **The document doesn't record the base or the percentage.** Storing only the
   resolved amount means an invoice can print "− 48,000" but not "Discount
   (10% of 480,000)". That's a legibility loss on the document and an audit loss
   off it — you can't verify the discount was applied to the right base. The
   percentage belongs in `snapshot.totals`.
3. **No reason.** Not needed today; it's why the standard carries it.

**Mixed VAT rates are the constraint to remember.** A document-level allowance
must carry its own VAT rate (BT-95/96) and be apportioned across rate groups, or
the VAT breakdown won't reconcile. This doesn't bite today because v2's tax rate
is org-level and single (`settings.tax.rate`). It would the moment per-line
rates appear.

**1. `recompute_order_totals()`** currently reads, in full:
`total_amount = COALESCE((SELECT SUM(total_amount) FROM v2.order_items WHERE
order_id = v_order), 0)`. It needs to subtract
`v2.order_discount_amount(line_sum, o.discount_type, o.discount_value)`.
`orders.balance` (`total_amount - amount_paid`) and `payment_status` are
generated from `total_amount`, so both follow with no further change.

**2. Editing the discount alone must recompute too.** That trigger fires on
`order_items`; changing `orders.discount_value` touches neither. Suggested: a
`before update on v2.orders` trigger that recomputes `NEW.total_amount` only
when the discount columns actually changed — the `is not distinct from` guard
also stops it fighting with the update `recompute_order_totals()` itself issues.

**3. `issue_document()`** hardcodes `discount_total` to `0`, and computes tax on
the undiscounted gross. Per the table above:

```
v_disc  := v2.order_discount_amount(v_gross, v_order.discount_type, v_order.discount_value);
v_net   := v_gross - v_disc;

if not v_registered or v_rate = 0 then
  v_subtotal := v_gross;                        v_discount_total := v_disc;
  v_tax_total := 0;
elsif v_inclusive then
  v_subtotal       := round(v_gross / (1 + v_rate/100), 2);
  v_net_ex         := round(v_net   / (1 + v_rate/100), 2);
  v_discount_total := v_subtotal - v_net_ex;    -- ex-tax portion, not v_disc
  v_tax_total      := v_net - v_net_ex;
else
  v_subtotal := v_gross;                        v_discount_total := v_disc;
  v_tax_total := round(v_net * v_rate / 100, 2);
end if;
```

…plus `discount_total` (and ideally the type/value, so a document can print
"Discount (10%)") added to `snapshot.totals`, which is what the rendered
document reads.

**4. Round at the currency's scale, not at a hardcoded 2 — this is part of A1,
not a nicety.** Without it the discount makes documents that don't add up.

Today's function is safe because it only ever rounds **one** value
independently: the inclusive branch derives `tax = gross − subtotal`, the
exclusive branch leaves `subtotal = gross` unrounded. The identity closes by
construction. Verified across 367 gross values in both modes: **zero**
reconciliation failures.

A discount introduces a third value, and three values rounded to 2dp and then
printed in a zero-decimal currency stop summing. Measured on this database with
the same 367 values, a 10% discount and 18% inclusive VAT:

| A1 stored at… | documents whose printed figures don't add up |
|---|---|
| 2 decimal places | **85 of 367** |
| the currency's own scale | **0 of 367** |

**UGX has zero minor units** (ISO 4217; so do RWF, JPY, KRW — while BHD, KWD,
TND have three). There is no fractional shilling, so 2dp storage invents cents
that the renderer then rounds away, and the rounding happens three times
independently.

The standard treatment — EN 16931's BR-CO rules, and every VAT regime — is that
a document's monetary values are stated in the currency's own precision and the
VAT total is computed from the already-rounded taxable base. Round once, at the
currency's scale, and derive the rest so they reconcile by construction.

`issue_document()` already resolves `v_currency` from `settings.locale.currency`
before any arithmetic runs, so the scale is available where it's needed. A
`v2.currency_scale(text)` lookup — zero-decimal and three-decimal lists,
defaulting to 2 — is all that's missing.

### App side, once this lands

`orderCreateSchema` / `orderUpdateSchema` gain the two fields, `DatabaseV2` is
updated by hand, and B2/B4's discount rows become real. Nothing else changes —
every total the UI shows already comes from `total_amount` or the document.

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
