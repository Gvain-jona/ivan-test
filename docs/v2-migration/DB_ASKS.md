# Schema asks — v2

Raised 2026-08-07, from reconciling the 26-frame surface redesign
(`APP_REDESIGN.md`) against the live `v2` schema.

This is the whole list. It is short on purpose: two working principles kept it
that way — the DB models correctly while the UI translates, and anything not a
core column becomes a `field_definitions` entry rather than a migration. Applying
those turned four apparent gaps into two, and everything else in the designs
resolved to something that already exists.

Each ask says what breaks without it, so anything here can be declined on its
merits rather than assumed necessary.

**Priority:** A1 and A2 block screens that are otherwise ready to build. A3
blocks consolidated invoicing. A4 and A5 are correctness papercuts that can ride
along with any of the above.

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

### Proposed

```sql
alter table v2.orders
  add column discount_type  text    check (discount_type in ('amount','percent')),
  add column discount_value numeric not null default 0;
```

and `recompute_order_totals()` subtracting it after the line sum, so
`total_amount` — and therefore the generated `balance` and `payment_status` —
already account for it.

### Questions

1. Should `issue_document()` carry this into `documents.discount_total`, so an
   invoice shows the same discount the order does? We assume yes.
2. Is a discount that exceeds the line subtotal worth a constraint, or is
   clamping the app's job?

---

## A2 — Notes have no type · **blocks B2c, E2, E3**

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

### A3b · `validate_payment_allocation()` must find a client-level invoice

This one is easy to miss and would be silent. SINGLE RECEIVABLE currently
enforces "once an order has a live invoice, allocate to the invoice" by looking
for a live invoice **on the order**. A consolidated invoice isn't on any order,
so the check wouldn't see it and would keep accepting order-targeted
allocations — money split across two receivables for the same debt.

Must ship with A3a, not after.

### A3c · Receipts

`documents.entity_type` already permits `'payment'`, but nothing can produce
one. The app currently refuses `entity_type != 'order'` at the API rather than
letting the call fail deeper in. Expected with the payments cutover; noted here
so it isn't forgotten.

---

## A4 — `create_order()` drops payment details · **papercut, already worked around**

`orders-system-handoff.md` §9 documents the inline payment payload as
`{amount, payment_method, payment_date}`.

- **`reference`** (mobile-money transaction id, cheque number) is not in it. The
  column exists on `v2.payments` and the standalone payment route writes it, so
  the same field is capturable from one screen and not the other. The app now
  **rejects** a reference on the create path rather than letting it vanish
  DB-side.
- **`notes`** is unverified. The app has always sent it on this path and the
  documented payload doesn't list it either. **Does `create_order` persist it?**
  If not, it has been silently discarded on every order created with an inline
  payment.

Ask: accept both keys, or confirm they're already handled and the doc is stale.

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

## Confirmations, not changes

Two answers would settle decisions currently resting on inference.

1. **What shape is `documents.snapshot`?** It's the authority for what an
   invoice printed, and nothing app-side has seen it. Rendering the invoice
   (B9) means reading it, and guessing would produce a document that disagrees
   with itself. A sample row would do.

2. **Which tax number does `issue_document()` snapshot — `settings.tax.number`
   or `settings.identity.tax_id`?** Both are whitelisted. The settings screen
   currently writes `identity.tax_id` on the basis that identity is what gets
   frozen as the issuer, and leaves `tax.number` alone rather than having two
   inputs write the same fact.

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
