# Create-in-context: how production platforms handle it

Research date: 2026-08-18. Question that prompted it: when a user starts a new
order and the org has **no clients or products yet**, what should happen — a
blocking "set these up first" gate, or something else? This surveys how mature
billing/CRM/commerce products actually solve it, then maps the consensus back
onto our order flow.

Bottom line up front: **our instincts already match the industry consensus, and
the refinement shipped on `claude/crud-operations-ux-so1wgt` (create-and-return
for clients, one-off items with an optional "Save to catalogue") is precisely
the pattern the leaders converged on.** The value of this doc is the evidence
for that, the two places we still differ, and the one real tradeoff (one-offs
vs. analytics) to keep in view.

---

## 1. The dominant pattern: inline "+ Add New", create-and-return

Every major invoicing/accounting product lets you create the related record
**from the picker, without leaving the document you're composing**, and drops
you back with the new record **selected**.

| Product | Customer when none exists | Line item when none exists |
|---|---|---|
| **QuickBooks Online** | Customer dropdown → **"+ Add New"** → mini-form → returns selected | Product/service dropdown → **"+ Add New"** on-the-fly, never leave the invoice |
| **Zoho Books / Invoice** | Customer Name dropdown → **"+ New Customer"** inline | Item dropdown → add item inline; global **Quick Create** (top bar) as an alt entry |
| **Stripe Invoicing** | **"Add new customer"** — only a *name* is required, email/rest optional | **Two** explicit choices: **"Add one-time item"** vs **"Create new product"** (save for reuse). Auto-saves a draft on exit. |
| **Shopify** (draft orders) | Customer section → search **or create** inline with contact/address | **"Add custom item"** — name, price, qty, **no product ID**; not catalogued |
| **Salesforce** | Lookup field → **"+ New"** opens a configurable *quick-create* mini-form → returns and populates the lookup | Same lookup/quick-create mechanism per related object |

Two design details recur and are worth copying exactly:

- **The typed text carries into the create form.** You type a name that matches
  nothing, click "New X", and the form opens **prefilled** with what you typed —
  you never retype it. (This was the specific gap in our client flow; now fixed.)
- **The created record returns selected.** Control comes back to the document
  with the new record already chosen, so the compose flow continues in one pass.
  (Also the specific gap we fixed — the leaf sheet already returned the client;
  the host was discarding it.)

## 2. The Stripe two-item model validates "Save to catalogue"

Stripe is the sharpest articulation of the products question. It offers **two
distinct actions** on a line:

- **Add one-time item** — a name + price for *this document only*, never saved.
- **Create new product** — same inputs, but **persisted to the catalogue** for
  reuse.

Shopify draws the same line with **"Add custom item"** (uncatalogued) sitting
beside catalogue products. This is exactly our model: type a name → **"Add as a
one-off"** (Stripe's one-time item / Shopify's custom item), with an optional
**"+ Save to catalogue"** to promote it (Stripe's "Create new product"). A print
shop's reality — most lines are bespoke, a few recur — is the reality these
products designed for. We are not inventing here; we're matching the leaders.

**`v2.order_items` taking either `product_id` or `product_name_raw` is the same
schema decision** Shopify made (custom line items carry no product/variant id).

## 3. The one real tradeoff: one-offs are invisible to product analytics

Shopify states the cost of custom items plainly: they **"don't appear in product
sales reports"** and **"aren't tracked as inventory."** A one-off is a line of
text with a price — nothing aggregates it. The same will be true for us: a job
billed as a one-off won't roll up under a product in any future
per-product analytics, because there is no `product_id` to group on.

Implication for us — and the reason the promote action matters beyond
convenience: **a product typed a second time should be easy to catalogue**, so
recurring work stops leaking out of the product dimension. Our "Save to
catalogue" is the release valve. When the analytics/metrics module cuts over
(STATE.md → Home dashboard), per-product reporting will only be as good as how
much of the catchable-repeat work got promoted. Worth a one-line nudge in the
UI later ("billed as one-off 3 times — save it?"), but not now.

## 4. The counter-example: HubSpot (create parent first, associate after)

Not everyone allows inline creation *during* creation. In HubSpot you **cannot**
create a new contact/company on the new-deal screen itself — you create the deal,
then on the deal record click "Add contact" → search → "create new" if missing.
Their mitigation is **automatic association** settings (link the company through
an already-linked contact).

This is instructive as the model to **avoid** for our case:

- HubSpot's own community has long-standing, heavily-upvoted requests to allow
  on-the-fly creation during deal creation — users experience the two-step as
  friction, not safety.
- It works for HubSpot because a deal without a contact is still a valid, useful
  record. **Our order has a hard FK to a client** (`orders.client_id NOT NULL`)
  and needs at least one item — there is no meaningful "empty" order to create
  first and populate later. So the "create parent, associate after" model is
  actively wrong for us; inline create-and-return is the fit.

## 5. Empty state: a nudge, never a blocking gate

Consensus from design-system and UX guidance (NN/g, Carbon, and SaaS onboarding
practice):

- A first-run empty state is a **"teachable moment"**, not a dead end. It should
  **name what belongs here and offer the primary action** — not "No data."
  Concretely: "No clients yet — type a name to create your first one" beats a
  neutral "Start typing." (Now our copy.)
- First-use empty states are **distinct from no-results** empty states. Ours are:
  empty search with an empty org → the create nudge; empty search *with* a query
  → the "New client 'X'" / "Add 'X' as a one-off" create affordance.
- **Activation comes from producing a real record**, not from tours. Figma
  (create a file), Notion (personalized first doc), and checklist patterns
  (Zeigarnik effect) all drive first-record creation. A blocking "set up clients
  and products before you can order" wizard is the opposite — it front-loads
  config before value. It also contradicts our own standing principle
  ("unconfigured org still transacts", STATE.md). **Verdict: no gate.**

## 6. Modal vs. sheet vs. page — our carve-out is the documented rule

Carbon's create-flows guidance lines up almost exactly with CLAUDE.md's
"screen vs sheet" carve-out:

- **Inline** for the simplest additions (an item on a list).
- **Modal / bottom sheet / drawer** for a *simple* create — "one or two fields",
  and explicitly **"don't use a modal if there are more than four fields or if it
  scrolls."** The advantage is **keeping the context of the current screen**
  (scroll position, entered input) — which is why a drawer that leaves the
  document visible underneath is preferred for a quick sub-create.
- **Separate page / tearsheet** for a *complex* object built across sections.

Mapped to us: composing an order = **screen** (`/dashboard/orders/new`, seven
sections — Carbon's "separate page"); add item / add payment / **quick-create
client** = **sheet** (`AppSheet`, the drawer variant that keeps the order
underneath). Our instinct here is the textbook recommendation, not a house
quirk. The one caution Carbon raises that applies to us: a quick-create client
sheet should stay short — if the org has configured many required client fields,
that sheet drifts past the "simple create" threshold and starts to argue for a
full page. Watch field-count creep on the create-client sheet.

## 7. What this means for our flow (verdict)

| Question | Industry consensus | Our flow |
|---|---|---|
| Force client/product setup before ordering? | **No** — inline create-and-return | ✅ No gate; inline create |
| No products yet? | One-time / custom item, no catalogue needed | ✅ "Add as a one-off" (`product_name_raw`) |
| Promote a repeat item to catalogue? | Stripe "Create new product" | ✅ "Save to catalogue" (shipped) |
| No clients yet? | "+ Add New", prefilled, returns selected | ✅ Now prefilled + returns selected (shipped) |
| Empty state | Nudge + primary action, not "no data" | ✅ "No clients yet — type a name…" (shipped) |
| Quick-create surface | Drawer/modal for simple, page for complex | ✅ Sheet for client, screen for order |
| Analytics cost of one-offs | Real; mitigate via easy promote | ⚠️ Understood; promote is the valve, nudge later |

**Nothing in the survey contradicts the direction; it confirms it.** The two
follow-ups it surfaces are both already on the radar: (a) a later "you've typed
this one-off N times — catalogue it?" nudge to protect product analytics, and
(b) keep the quick-create client sheet short enough to stay a sheet.

---

## Sources

- QuickBooks Online — [Create and send an invoice](https://quickbooks.intuit.com/learn-support/en-us/help-article/invoicing/create-invoices-quickbooks-online/L7gSzvCld_US_en_US) (inline "+ Add New" for customers and products/services).
- Zoho Books — [Ways to create invoices](https://www.zoho.com/us/books/kb/invoices/ways-to-create-invoice.html), [Create invoice](https://www.zoho.com/us/books/kb/invoices/create-invoice.html) ("+ New Customer" inline; global Quick Create).
- Stripe — [Use the Dashboard (Invoicing)](https://docs.stripe.com/invoicing/dashboard), [Add one-time items to invoices](https://support.stripe.com/questions/how-to-add-one-time-items-to-invoices-and-subscriptions-in-the-dashboard) ("Add new customer"; "Add one-time item" vs "Create new product").
- Shopify — [Creating draft orders](https://help.shopify.com/en/manual/fulfillment/managing-orders/create-orders/create-draft) (search-or-create customer; "Add custom item"; custom items excluded from inventory and product sales reports).
- Salesforce — [Lightning record form](https://developer.salesforce.com/docs/platform/lightning-component-reference/guide/lightning-record-form.html), [Quick Create on lookup (IdeaExchange)](https://ideas.salesforce.com/s/idea/a0B8W00000GdptfUAB/) (configurable quick-create mini-form from lookup "+ New").
- HubSpot — [Create deals](https://knowledge.hubspot.com/records/create-deals), [community: add contact/company on-the-fly](https://community.hubspot.com/t5/CRM/Is-it-possible-to-add-a-contact-company-to-a-new-deal-on-the-fly/td-p/3437) (no inline create during deal creation; associate after; auto-association settings).
- Design systems — [Carbon: create flows](https://carbondesignsystem.com/community/patterns/create-flows/), [Carbon: empty states](https://carbondesignsystem.com/patterns/empty-states-pattern/), [PatternFly Select](https://www.patternfly.org/components/menus/select/), [Twilio Paste Combobox](https://paste.twilio.design/components/combobox) (create-new-from-typed-value; modal ≤ a few fields, page for complex).
- Modal vs. page — [Smashing Magazine: Modal vs. Separate Page decision tree](https://www.smashingmagazine.com/2026/03/modal-separate-page-ux-decision-tree/) (context preservation; drawers keep background data visible).
- Empty states / onboarding — [Pencil & Paper: Empty states](https://www.pencilandpaper.io/articles/empty-states), [Setproduct: Empty state UI](https://www.setproduct.com/blog/empty-state-ui-design) (first-run "teachable moment"; first-record activation; Figma/Notion patterns).
