# The Orders System — Finalized Design & Live State

> **Scope:** clients, products, orders, order_items, payments, documents, field_definitions — the complete order-model verification slice. Everything below is confirmed live in the `v2` schema as of this handoff.

---

## 0 · The Core Principle

Every table here is a **spreadsheet with a template**: a small set of fixed columns that never change, plus a `custom_data` jsonb column that any organization can extend — governed by `field_definitions`, validated by a database trigger, never a free-for-all.

**The floor is fixed. The ceiling is open. Nothing in between is guessed.**

---

## 1 · Clients — the anchor entity

The most flexible module in the system. Ask ten businesses what a client is and you get ten different answers — so the fixed floor is deliberately the smallest of any table: identity only.

```sql
v2.clients
├── id                uuid PK
├── organization_id   uuid — tenant scope
├── name              text — the ONLY universal client fact
├── status             text — 'active' | 'archived'
├── custom_data        jsonb — governed, max ~8KB
├── source_ids         uuid[] — migration lineage (old fragments folded into this row)
├── created_by         uuid
├── created_at / updated_at
```

**What's NOT a column:** phone, email, type, credit limit, company name — all of it lives in `custom_data`, defined per-organization via `field_definitions`. There is no `client_types` table. "Type" is a `select` field with organization-defined options. Field visibility uses `conditions` (e.g. show `credit_limit` when `type = "Contract"`) — any field can gate any other field, no lookup tables needed.

**Financial health is never stored on the client.** Total ordered, outstanding balance, last payment — all assembled live from `orders` + `payments` filtered by `client_id`. The client record stays lean forever.

---

## 2 · Products — the reusable catalog

A product is a template a line item is created *from* — not a price authority.

```sql
v2.products
├── id                uuid PK
├── organization_id   uuid
├── name              text — unique per org
├── selling_price     numeric — the DEFAULT, always overridable at point of sale
├── status            text — 'active' | 'archived' | 'draft'
├── custom_data        jsonb — governed (category, unit, code — all user-defined)
├── name_variants      text[] — migration fold map: every spelling that resolves here
├── created_by / created_at / updated_at
```

**Deliberately excluded:**
- **No `product_categories` table.** Category is a `select` field in `custom_data` — a label, not an entity with its own lifecycle.
- **No `base_cost` column.** Cost needs a date, a source, and a justification — it belongs to the (deferred) materials/purchasing module, not the catalog.
- **No pricing-type engine.** One price. The order line can override it. This matches how Zoho Books, QuickBooks, and every production system actually price — confirmed by market research, not assumption.

---

## 3 · Orders — the agreement header

```sql
v2.orders
├── id                uuid PK
├── organization_id   uuid
├── order_number      text — unique per org, generated via next_number()
├── client_id         uuid — HARD FK → clients, always enforced
├── order_date        date
├── status             text — configurable per org (organizations.settings.order_statuses)
├── total_amount       numeric — TRIGGER-maintained, recomputed from order_items on every change
├── amount_paid        numeric — TRIGGER-maintained, recomputed from payments on every change
├── balance             numeric — GENERATED ALWAYS AS (total_amount - amount_paid) STORED
├── payment_status      text — GENERATED ALWAYS: unpaid | partial | paid — CASE on amount_paid vs total
├── custom_data          jsonb — governed (delivery_date, sales_rep, job_ref...)
├── source_id            uuid — migration lineage
├── created_by / created_at / updated_at
```

**The money-integrity law, enforced three ways:**
1. `total_amount` — a trigger on `order_items` recomputes it on every INSERT/UPDATE/DELETE
2. `amount_paid` — a trigger on `payments` recomputes it whenever a payment against this order changes
3. `balance` and `payment_status` — Postgres **generated columns**. Not triggers, not app logic. There is no code path that can set them to a wrong value, because there is no code path that can set them at all.

This is the strongest tier of the "push correctness down" principle: constraints > triggers > functions > app code. Money state sits at the tier that's *structurally impossible* to desync.

---

## 4 · Order Items — the detail lines

```sql
v2.order_items
├── id                uuid PK
├── organization_id   uuid
├── order_id          uuid — FK → orders, ON DELETE CASCADE
├── product_id        uuid — SOFT FK → products, NULLABLE (free-text lines allowed)
├── product_name_raw  text — fallback name when product_id is null
├── quantity          numeric
├── unit_price        numeric — SNAPSHOT at time of sale
├── discount           numeric — default 0
├── total_amount        numeric — (qty × price) − discount
├── custom_data          jsonb — governed (size as dimension type, finish, colour...)
├── source_id            uuid — migration lineage
├── created_at / updated_at
```

**The one deliberate snapshot in the whole system:** `unit_price`. Everything else is an ID reference joined live (so a rename propagates everywhere). Price is different — it's a historical, legal fact. If Ivan sold a banner at 48,000/sqm in January and raises the rate in July, the January order must still show 48,000. That's not a design choice, it's financial integrity.

**The `dimension` field type** (built for `size`): stores `{w, h, raw}` — width and height as real numbers plus the original text, always preserved. Migration audit proved 96% of Ivan's historical size values parse cleanly into this shape, unlocking real sqm-based analytics that were previously locked inside free text.

---

## 5 · Payments — the shared engine

One polymorphic table replaces what used to be three separate implementations (order_payments, expense_payments, material_installments).

```sql
v2.payments
├── id                uuid PK
├── organization_id   uuid
├── entity_type       text — 'order' | 'expense' | 'material_purchase'
├── entity_id         uuid — the parent record
├── amount             numeric — CHECK > 0
├── payment_date        date
├── payment_method      text — 'cash' | 'mobile_money' | 'bank' | 'credit'
├── notes                text
├── source_id / source_table — migration lineage
├── created_by / created_at
```

Insert a payment → the `recompute_order_paid` trigger fires → the parent order's `amount_paid` updates → `balance` and `payment_status` regenerate automatically. One insert, the whole chain settles itself.

---

## 6 · Documents — the transactional artifact system

Also polymorphic, and **every document exists because a transaction happened or is being proposed** — there is no legitimate "floating" document with nothing behind it. This was traced against the business logic explicitly and confirmed against how production accounting systems model the domain (Zoho Books / QuickBooks: Estimates → Sales Orders → Invoices → Credit Notes on the sales side, mirrored by Purchase Orders → Bills → Vendor Credits on the purchase side — the same shape we landed on independently).

```sql
v2.documents
├── id                    uuid PK
├── organization_id       uuid
├── entity_type           text — 'order' | 'payment' | 'expense'(future) | 'client'(future) | 'organization'(future)
├── entity_id             uuid — the transaction this document is ABOUT
├── document_type         text — 'quotation' | 'invoice' | 'credit_note' | 'receipt' | 'po' | 'bill' — extensible
├── document_number       text — per-type sequence via next_number(): QT-0012, INV-0451
├── snapshot              jsonb — frozen render data (client, items, prices, totals)
├── status                text — draft | sent | accepted | declined | expired | issued | void
├── valid_until           date — nullable, quotation expiry
├── related_document_id   uuid — self-reference; a credit_note points at the invoice it corrects
├── created_by / created_at / updated_at
```

### Where each document type anchors

| Document | entity_type | Why |
|---|---|---|
| Quotation | `'order'` | A proposed sale — the order in a pre-commitment status |
| Invoice | `'order'` | A claim for payment on a sale — same order, further along |
| Credit note | `'order'` | Corrects an issued invoice — uses `related_document_id` to point at it |
| Receipt (given to a client) | `'payment'` | Corresponds to *the money that arrived*, not the whole order — a partially-paid order can have multiple receipts, one per payment, without ambiguity |
| Purchase order / Bill (future) | `'expense'` | The purchase-side mirror, once the expense module is built |
| Vendor credit (future) | `'expense'` | The purchase-side mirror of a credit note — same `related_document_id` mechanism |
| Company/compliance files (license, lease, ID, tax cert) | **N/A — not a `documents` row** | No transaction behind them, no snapshot to freeze — these live in `attachments` only |

**Immutability is trigger-enforced.** Once `status` reaches `sent`, `accepted`, or `issued`, the `protect_issued_documents` trigger blocks any change to `snapshot`. A document, once real, cannot silently mutate — regenerating creates a new row, never overwrites.

**Quotation → order conversion has zero data duplication.** A quotation is the *same order record* in a pre-commitment status (a `quotation` stage added to the configurable status workflow). Accepting it is a status change plus a new document render — not a copy. This is a deliberate improvement over how Zoho and most competitors handle it (their quote-to-invoice conversion loses custom fields because quote and invoice are separate modules with separate field registries).

**Credit notes need no new mechanism** — a credit note is a `documents` row like any other with one `related_document_id` pointer back to the invoice it corrects. Same table, same numbering engine, same immutability trigger. Validated against Zoho Books' credit-note API, which exposes a dedicated credit-note ↔ invoice relationship.

**Partial / progress invoicing needs no new mechanism** either. An invoice can receive multiple payments over time, each logged as its own event, with paid/balance derived from the sum — exactly what the `payments` engine plus the generated `balance`/`payment_status` columns on `orders` already do.

**`related_document_id` is live** — migration applied: one nullable, self-referencing, indexed column. When the expenses/materials module is built, vendor_credit → bill uses the identical pattern.

**Status:** `issue_document()` RPC — the function that atomically assigns the number + freezes the snapshot + sets status — is **not yet built.** The table, the entity_type grouping, and the correction mechanism (`related_document_id`) are all now finalized; what remains is the orchestration function, the `snapshot` jsonb shape (not yet specified), and per-type freeze timing (likely "at generation" for invoices, "at sent" for quotations). The table and its immutability trigger are live.

**App-side status (2026-07-15):** `supabase-v2.ts` carries `related_document_id`, but the app validators/UI have **not** yet been reconciled to this model — `documentEntitySchema` still lacks `'payment'` (so receipts-on-payment would be rejected) and `documentTypeSchema` still has `'proforma'` and lacks `'credit_note'`/`'bill'`. That enum reconciliation is a deliberate open follow-up (it changes what the create form accepts and needs DB-owner counter-key confirmation) — see STATE.md.

---

## 7 · Field Definitions — the registry that makes it all governed

```sql
v2.field_definitions
├── id                 uuid PK
├── organization_id    uuid — each org defines its own fields
├── entity              text — 'client' | 'order' | 'order_item' | 'product'
├── field_name           text — machine key, IMMUTABLE after creation, ^[a-z][a-z0-9_]{0,62}$
├── field_label           text — display name, freely editable
├── field_type            text — text | number | date | boolean | select | relation | dimension
├── is_required / is_unique
├── options               jsonb — select dropdown values, org-defined
├── related_entity / display_field — for relation fields
├── conditions             jsonb — conditional visibility, any field can gate any other
├── field_group             text — UI grouping label, not a table
├── show_in_documents        boolean — does this field print on invoices/quotes?
├── inherit_from              text — auto-fill from a related entity's matching field
├── sort_order / status (active | archived — never hard-deleted)
```

This single table is simultaneously: the schema registry, the form renderer's data source, the validation trigger's rulebook, and the future analytics view compiler's blueprint. Nothing about "what fields exist" lives anywhere else.

---

## 8 · The Governance Trigger — where the rules become real

Every write to `custom_data` on `clients`, `orders`, `order_items`, and `products` passes through `v2.validate_custom_data()` before it's accepted:

| Check | Behavior |
|---|---|
| Unknown key | **Rejected** — `"unknown field X on order — define it in field_definitions first"` |
| Required field missing | **Rejected** |
| Wrong type | **Rejected** — text/number/boolean/date each type-checked |
| Invalid select value | **Rejected** — must match `options` exactly |
| Dimension malformed | **Rejected** — must have a `raw` key, `w`/`h` must be numeric if present |
| Relation to nonexistent record | **Rejected** |
| **Relation to a record in a different organization** | **Rejected** — `"reference X not found in same organization"` — this is the cross-tenant injection guard, proven live in testing |
| JSON `null` used | **Rejected** — convention is *absence* means unset, never a stored null |
| Payload over ~8KB | **Rejected** — CHECK constraint on the column itself |

This isn't application-layer validation that a direct API call could bypass. It's a `BEFORE INSERT OR UPDATE` trigger — the database itself refuses bad data, regardless of what wrote it.

---

## 9 · The Write Path — `create_order()`

The one RPC every order creation goes through, because PostgREST cannot run multi-statement transactions — without this function, a client crash mid-sequence could leave an orphaned half-order.

```sql
v2.create_order(payload jsonb) RETURNS uuid
```

**Field-agnostic by design** — the function names no organization-specific field anywhere. `custom_data` on the order and every item passes through opaquely; the registry trigger validates it per-organization. The same function creates a valid order for Ivan's print shop and a completely unrelated widget shop with different fields, without modification.

**What it does, atomically, in one transaction:**
1. Resolves the organization from JWT claims
2. Generates the order number via `next_number()`
3. Inserts the order header
4. Inserts each item (product_id or free-text, each with its own custom_data)
5. Inserts any initial payment(s)
6. If any step fails validation, the entire transaction rolls back — no orphans, ever

**Security posture:** `SECURITY INVOKER`, not DEFINER. RLS and the validation trigger already enforce correctness — this function is a pure transaction wrapper, nothing more, running with the caller's own privileges.

```jsonc
// payload shape
{
  "client_id": "uuid",
  "order_date": "2026-07-07",
  "custom_data": { /* org-defined order fields */ },
  "items": [
    {
      "product_id": "uuid | null",
      "product_name_raw": "text — used when product_id is null",
      "quantity": 2,
      "unit_price": 5000,
      "discount": 0,
      "custom_data": { /* org-defined item fields */ }
    }
  ],
  "payments": [
    { "amount": 6000, "payment_method": "cash", "payment_date": "2026-07-07" }
  ]
}
```

---

## 10 · Numbering — `next_number()`

```sql
v2.next_number(counter_key text, org_id uuid?) RETURNS text
```

Atomic, race-safe (row-level lock via `UPDATE ... RETURNING`), per-organization, per-document-type. Format tokens: `{YYYY}` `{YY}` `{N4}` `{N5}` `{N6}` `{N}`. Verified: `ORD-2026-00001`, `ORD-2026-00002`, `INV-2026-00001` — independent counters per key, correctly incrementing.

---

## 11 · Proven — the generic engine test

Before any Ivan-specific data touched the system, the whole order-write path was proven against a **throwaway, unrelated organization** (a fictional widget shop — deliberately not print-shop shaped) to confirm the machinery is genuinely multi-tenant, not accidentally Ivan-shaped:

| Test | Result |
|---|---|
| Valid order + items + payment via `create_order` | ✅ Created; full cascade fired |
| Totals / paid / balance / status auto-recompute | ✅ 13,000 total, 6,000 paid, 7,000 balance, `partial` status — all correct, none set manually |
| Invalid select value | ✅ Rejected, entire order rolled back — zero orphan rows |
| Unknown custom field | ✅ Rejected |
| **Cross-tenant reference injection** (a field pointing at another org's client) | ✅ **Blocked** — the single most dangerous multi-tenant edge case, structurally prevented |
| Full teardown of the test org | ✅ Clean — proves the pattern is disposable and repeatable |

---

## 12 · Deliberately Deferred (documented, not forgotten)

| Item | Why it waits |
|---|---|
| `issue_document()` RPC | Model is finalized (grouping + `related_document_id`); orchestration function still unwritten |
| ~~Credit notes / corrections~~ | **Resolved** — `related_document_id` self-reference, validated against Zoho Books' credit-note API pattern |
| ~~Partial / progress invoicing~~ | **Resolved** — needs no new mechanism; existing payments engine + generated `balance`/`payment_status` already handle it |
| Snapshot shape | Not yet specified — which fields, how items nest inside the jsonb |
| `attachments.custom_data` | Needed for company/compliance documents (category, expiry, visibility) — not yet built |
| Storage bucket security | Both buckets found `public: true` — needs private + tenant-scoped policies (see STATE.md / AUDIT_PROGRESS.md STOR-01) |
| Document validators/UI reconciliation | Align app `entity_type`/`document_type` enums to this §6 model (add `payment`, `credit_note`, `bill`; decide `proforma`) — changes the create form, needs DB-owner counter-key confirmation |
| Read-layer materialized views | Needed for analytics (`client_financials`, sales summaries) — not needed for the order-write path itself |
| Governed jsonb merge function | Only needed if concurrent multi-user editing of the same record's custom fields becomes a real UX case — not built speculatively |

None of these block using the orders system as designed. They block specific *future* features layered on top of it.

---

## 13 · What This Replaced — the old system's diseases, cured structurally

| Old symptom | Root cause | v2 cure |
|---|---|---|
| 2,299 clients, each with exactly 1 order | App minted a client row per order — no real entity contract | Hard FK + derive-from-sales migration strategy; structurally can't repeat |
| 4,364 of 4,597 order_items pointing to dead item_ids | Catalog was decorative, never enforced | Soft FK allows free-text lines *by design*, but real products are real rows with real references |
| `profit_amount`, `labor_amount` always 0.00 | Dead columns, never computed | No such columns exist; cost/margin belongs to the (deferred) materials module, not faked on the order line |
| 15 unused recurrence columns on expenses | Speculative schema, never used | Nothing gets added until a real, current need justifies it |
| 3 separate payment tables, none complete | Same concept, rebuilt three times | One `payments` engine, polymorphic, used everywhere |
| Every function anon-callable, `check_can_insert` hardcoded to `true` | No grant discipline, DEFINER-by-default | Every v2 function grant is scoped and reasoned; INVOKER is the default, DEFINER only where structurally forced |

---

*Orders system handoff · v2 · Documents grouping finalized (`related_document_id`, receipts-on-payment), market-validated*
*Source: `giwurfpxxktfsdyitgvr` · schema `v2`*
