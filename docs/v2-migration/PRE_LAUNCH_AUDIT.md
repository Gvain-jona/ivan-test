# Pre-launch audit — live v2 surface

Date: 2026-08-20. Method: five parallel audits (endpoint connectivity, CRUD
completeness, feedback/UX states, race conditions, interactions) reading the
actual routes + hooks + components, not the docs. Findings cross-checked and
de-duplicated; the flagship items were re-verified by hand.

**Scope — live v2 surface only:** orders (+items/payments/notes/status/issue),
clients, products, field-definitions, documents, notifications, organization/
counters/settings, home. **Excluded** (intentionally dark since the Clerk swap,
per `STATE.md`): expenses, materials, accounts, invoices, analytics,
account-rules, material-purchases.

## Resolution status (branch `claude/pre-launch-endpoint-audit-ui511t`)

Fixed on this branch, each with tsc clean + suite green:

- **H1** money double-submit — synchronous `useRef` latch in `useOrderHub.run()`
  and `useOrderDraft.save()`; **M2** add-sheets now await the write and stay
  open + busy, closing only on success.
- **H2/H3** client/product edit + archive — `openEditClient/Product` + a
  `RecordActions` kebab (Edit + confirm-gated Archive) on the detail headers.
- **H4** document lifecycle — `DocumentActions`: void an unpaid invoice / decide
  a quotation, transitions verified against the live v2 functions.
- **H5** detail-screen error state — shared `RecordError` on all four screens.
- **M1** list error state — shared `ListError` on all four lists.
- **M3** payment refreshes the invoice (DOCUMENTS keys invalidated).
- **M4** inline new-client carries the typed name + selects back.
- **M6** dead announcements provider stubbed (no per-load fetch).
- **M7** client/product detail open orders via `openOrder()` (no list flash).
- **M8/M9/M10** bell is a real labeled button; forms submit on Enter; stray
  console.logs removed.
- **M5** is largely covered for correctness by the H1 latch (overlapping hub
  writes are dropped, not interleaved).
- LOW bundle: order-hub success toasts, field-restore error handling, product
  search spinner, form-submit ref latches, issue invalidates the docs list,
  deleted dead `home/SummarySection`+`PendingInvoices`, fixed the stale
  "Search HR tools" placeholder, registered new components.

Still open (deliberately deferred): **M11** (desktop menus bypass AppSheet — a
second overlay system, wants its own design pass), the orphan/dead legacy routes
(delete at their module cutovers), and the remaining cosmetic LOW items
(FooterBar consistency, chip tap-height, webhook notify dedup, order
date/client edit after create, cancel-order confirm).

## Headline

The live surface is **structurally sound**: tenancy is safe by construction
(`createTenantDb` auto-scopes every query by `organization_id` —
`tenant-db.ts:113-147`), every migrated route gates on `resolveTenant()`,
request/response contracts match, the overlay/sheet architecture is followed
almost everywhere, and the money-critical DB paths (numbering, allocation) are
atomic RPCs. No tenant-isolation hole was found.

The real pre-launch risks are two clusters plus a set of gaps:

1. **Double-submit on money paths** — the single most important theme. Nothing
   uses a synchronous in-flight latch; protection is React state that only
   latches after a re-render, and the payment sheet actively invites the retry.
2. **Read-error dead-ends** — detail screens hang forever on a failed/404 fetch;
   list screens silently show "you have nothing" instead of an error.
3. **Missing CRUD entry points** — client edit, product edit, and document void
   have working backends with no UI to reach them.

### One finding was investigated and dismissed

A cross-tenant IDOR was flagged on `clients/[id]`, `products/[id]`, and notes
GET. **False positive** — verified against `tenant-db.ts`: `tenant.db.from().
select/insert/update/delete` auto-appends `.eq('organization_id', …)`, so those
routes are org-scoped even without an explicit `.eq`. The explicit filters in
`orders/[id]` are belt-and-suspenders, not the only line of defense.

---

## Ranked findings

### CRITICAL / HIGH

**H1 — Money paths are double-submittable (no synchronous in-flight latch).**
The worst instance: `AddPaymentSheet` fires `onAdd()` then closes the sheet
**synchronously without awaiting** (`AddPaymentSheet.tsx:88-97`), so there's no
spinner and the hub balance stays stale until the refetch lands; meanwhile the
"PAYMENTS + Record" section trigger is **not** busy-gated (`OrderHubScreen.tsx:124`
— only the footer is). A user unsure the first tap registered reopens the
prefilled sheet and pays again → **duplicate / over-payment**. Same class,
lower blast radius: issue-document (`IssueDocumentSheet.tsx:100`,
`useOrderHub.ts:34`) → two immutable numbered invoices + two burned counters;
create-order (`useOrderDraft.ts:53`, no `saving` re-check in `save()`) →
duplicate order with duplicated inline payments. Common fix: a `useRef(false)`
latch checked/set at handler entry, plus busy-gate every trigger (not just the
footer) and keep add-sheets open until the write resolves.

**H2 — Client edit + archive completely unreachable from the UI.**
`ClientFormSheet` supports edit and `useClients` exposes `updateClient`/
`archiveClient`, but the sheet is only ever mounted with `client={null}`
(`sheet-host.tsx:94`) and the only opener is `openCreateClient()`.
`archiveClient` has zero callers. **Clients are create+read only** — a wrong
name/phone/email can never be corrected, a client never removed. Fix: an Edit
action on `ClientDetailScreen` (and/or row) that opens the sheet with the
client + an `onSaved` that revalidates; an archive action with confirm.

**H3 — Product edit + archive completely unreachable from the UI.**
Identical shape (`sheet-host.tsx:103`, `useProducts.ts:75-92`). The form's
Active/Draft/**Archived** status select is unreachable because edit mode never
opens. Products can be created but never edited (price, name, custom fields,
status) or archived. Fix: same as H2 on `ProductDetailScreen`.

**H4 — No UI to void/transition a document; a wrong invoice is unrecoverable.**
`PATCH /api/documents/[id]` supports status transitions incl. **void**, and
`useDocumentMutations.updateDocument` wraps it, but **no component calls it** —
it's dead code (`useDocuments.ts:169-184`). The document page offers only Print.
Documents are issued immutable with a one-live-invoice-per-order rule, so a
mistaken invoice can't be voided and the order can't be reissued. For a billing
app this is a hard dead end. Fix: wire a status/void action on the document
detail screen; on void, also invalidate ORDERS keys (releasing allocations
changes the order's money).

**H5 — Detail screens hang on a perpetual skeleton on any fetch error / 404.**
Order hub, client detail, product detail, and the document page all compute
`loading = isLoading || !data` and never read SWR `error`
(`OrderHubScreen.tsx:51`, `ClientDetailScreen.tsx:57`, `ProductDetailScreen.tsx:65`,
`documents/[id]/page.tsx:70`). A network drop, a 500, or a **404 for a record
that doesn't exist or isn't in the caller's org** leaves `data` undefined
forever → an animated skeleton with no message and no retry. This is the case a
launch user actually hits: a cross-org access is a 404, and a deleted order
deep-linked from a notification is a 404 — both dead-end. Fix: read `error`,
add an error branch before the loading branch, distinguish 404 from transient
via `ApiRequestError.status`, offer Retry (`mutate()`) + Back.

### MEDIUM

**M1 — List screens swallow the fetch error and render the empty-org state.**
Orders/clients/products/documents list hooks don't destructure `error`
(`useOrdersList.ts:77`, `useClientsList.ts:31`, `useProductsList.ts:26`,
`documents/page.tsx:57`), so a failed fetch shows "No orders yet / No clients
yet …" — sometimes with a first-run "add the first one" CTA — indistinguishable
from a genuinely empty org, no retry. `app/dashboard/notifications/page.tsx:120`
already does this correctly (error + Try again) and is the model to copy.

**M2 — Order-hub add sheets close before the async write resolves.**
`AddItem/AddPayment/AddNote/Discount` fire the callback without awaiting and
`onOpenChange(false)` immediately (`HubSheets.tsx:33-67`). On failure the toast
fires but the typed data is already gone and the `busy` prop never shows;
`IssueDocumentSheet` is the only one that awaits-then-closes correctly. (Broader
than H1: covers item/note/discount, not just payment.) Fix: mirror
`IssueDocumentSheet` — await, keep open + show busy, close only on success.

**M3 — Recording a payment doesn't revalidate DOCUMENTS keys.**
`addPayment` invalidates only `keysUnder(ORDERS)` (`useOrders.ts:171`), but per
SINGLE RECEIVABLE the payment allocates to the **document**, so the invoice
detail/list keep showing the pre-payment balance until an unrelated
revalidation. Fix: also `mutate(keysUnder(PLATFORM_API.DOCUMENTS))`.

**M4 — Inline "New client" from the order screen loses input and doesn't select
back.** `ClientField` calls `onCreate(name)` with the typed name
(`ClientField.tsx:136`), but the new-order screen routes it through the shared
`openCreateClient()` which takes no argument (name dropped) and has
`onSaved={close}` (created client not attached) — `sheet-host.tsx:82,94`. The
point of inline create is defeated. Fix: prefill the name and have `onSaved`
call `onSelect(client)`.

**M5 — Ungated concurrent hub actions → out-of-order revalidation.**
Status chips, discount, and the section "+" actions stay interactive during
`hub.busy`; `run()` has no mutual exclusion (`OrderHubScreen.tsx:76,91,114,124`).
Tapping status A then B before A's refetch returns can leave the UI showing A
while the DB committed B. No money loss (DB serializes) but UI/DB divergence
until the next fetch. Fix: gate inline actions on `hub.busy` or serialize
writes.

**M6 — Live app-wide provider calls the dead legacy `/api/announcements` on
every page load.** `AnnouncementProvider` is mounted app-wide
(`providers.tsx:58`) and fetches `/api/announcements` on mount
(`announcement-context.tsx:60`); `TopHeader` renders its banner. The route runs
an unauthenticated query against the dead `public.announcements` (no Clerk
session), degrading silently, and its POST/PUT/DELETE still gate on the dead
`profiles.role==='admin'`. Fix: stub the provider (as `NotificationsContext`
was) or gate the route behind `resolveTenant()` until an announcements cutover.

**M7 — Detail screens open orders via a list-redirect flash, not `openOrder()`.**
`ClientDetailScreen.tsx:130` / `ProductDetailScreen.tsx:145` push
`/dashboard/orders?order=${id}`, which lands on the list and then
`router.replace`s to the hub — a visible double-nav flash. Both files already
import `useSheets`; the fix is one word (`openOrder(id)`).

**M8 — Notifications bell isn't a real button.** `NotificationsIndicator.tsx:38`
renders a clickable `<div>` — not keyboard-focusable, no `role`/`aria-label`.
Fix: `<button type="button" aria-label="Notifications">`.

**M9 — Enter doesn't submit the create/edit form sheets.** `ClientFormSheet` /
`ProductFormSheet` render inputs in a plain `<div>`, not a `<form>`; submit is
wired only to the footer `onClick`. Fix: wrap in `<form onSubmit>` + `type=submit`.

**M10 — No edit/delete for payments or notes.** Both append-only server + UI
(`payments` POST-only, `notes` GET/POST-only); combined with H4 (no void) a
fat-fingered payment amount can never be corrected through the product. Notes
edit/delete can stay deferred; consider at least a delete for the last/unallocated
payment.

**M11 — Desktop notifications/search/profile use a bespoke `context-menu.tsx`,
not the AppSheet primitive** (`FooterNav.tsx:263`, `ui/context-menu.tsx:117`). A
second overlay system with its own focus/dismiss — the recurrence class the
guardrail exists to kill. Softer since it's an anchored desktop dropdown; at
minimum confirm it traps focus and closes on Escape.

### LOW (bundle)

- **Feedback polish:** order-hub writes give no success toast (`useOrderHub.ts:34`);
  field **restore** failure is silently swallowed — no try/catch, unlike archive
  (`use-field-actions.tsx:48`); AddItem product search shows no in-flight
  indicator (`add-item-states.tsx:105`); brief blank frame before the deferred
  skeleton on cold loads.
- **CRUD tail:** order date & client read-only after create though the PATCH
  accepts them (`OrderHubScreen.tsx:65`); issuing from the hub doesn't invalidate
  the org-wide documents list (`useDocuments.ts:70`); cancelling an order (a
  "lost" status chip) has no confirmation.
- **Concurrency tail:** client/product form `if (submitting) return` is a
  stale-closure read, not a real latch (`ClientFormSheet.tsx:50`); Clerk webhook
  membership notify is TOCTOU → a duplicate "you were added" on overlapping
  deliveries (`webhooks/clerk/route.ts:137`).
- **Cruft / consistency:** stale `"Search HR tools…"` placeholder on the live
  desktop search menu (`ui/context-menu.tsx:126`); form sheets hand-roll
  Cancel+Save instead of `FooterBar`; choice/status chips ~30px tall, under the
  44px thumb target (`patterns/controls.tsx:118`); dead color-heavy
  `home/SummarySection.tsx` + `home/PendingInvoices.tsx` sit in the live home dir
  (zero imports — delete, git is the archive); `NotificationsMenu` missing from
  `COMPONENT_REGISTRY.md`; leftover `console.log`s in the notifications poll
  (`NotificationsIndicator.tsx:25,30`).
- **Orphan / dead routes** (no live caller; delete at their module cutover):
  `/api/users/[userId]`; `/api/settings{,/app,/profit}` (SettingsContext reads
  `user_settings` directly, not via these); `/api/dropdown/*` + `/api/categories`
  + `/api/items` (legacy comboboxes only — and their inserts omit
  `organization_id`, so **do not resurrect them for v2 pickers**);
  `/api/invoice-settings/v2` + `/api/storage/init` (dark PDF generator only).
- **Doc drift:** `issueDocuments` (multi-order F2) is referenced in a comment +
  STATE.md but unbuilt — nothing depends on it. `useClient`/`useProduct` silently
  drop the `rollup`/`lines` the detail routes compute (screens fetch directly,
  so nothing breaks).

---

## Verified healthy (do not "fix" these)

- Tenancy safe by construction; every migrated route auth-gated; contracts and
  HTTP methods align; no dangling calls.
- Order create; order items add/edit/remove (real DELETE, org money recomputed);
  status/discount/custom_data; field-definitions CRUD; notifications
  read/mark-all/archive; organization settings + counters.
- Atomic DB numbering + payment allocation (no client-side read-modify-write);
  typeahead/search cancellation is SWR-keyed (out-of-order responses discarded);
  no optimistic-write rollback gaps (all write-then-revalidate); notifications
  are pull-only (no realtime dup).
- `AppSheet` is the one primitive: grab handle really drags, close-X is
  desktop-only, Back dismisses; screen-vs-sheet carve-out honored; live surface
  uses `OPTION_COLORS` (no hand-rolled color pairs); `DocumentPaper` hexes are
  the documented paper/print exception.

## Suggested pre-launch cut line

- **Must-fix:** H1 (money double-submit), H2/H3 (client/product edit), H4
  (document void), H5 (detail-screen error state).
- **Should-fix:** M1 (list error state), M2 (sheet-close data loss), M3 (payment
  → document staleness), M4 (inline new-client), M6 (dead announcements wiring),
  M8/M9 (bell a11y + Enter-to-submit).
- **Can defer with eyes open:** the LOW bundle, M5/M7/M10/M11.
