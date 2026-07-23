# Design Philosophy — Mobile & Desktop

**Status:** Foundational. This is the north star every UI/UX refinement points back to.
Established 2026-07-23 as the first step of the UX/UI refinement pass. If a change
contradicts a principle here, either the change is wrong or this doc needs an explicit,
dated revision — don't silently diverge.

---

## Foundational principle — two products, shared modules

Mobile and desktop are **not one information architecture rendered at two widths.**
They diverge on purpose. What they share is the *modules* — orders, clients, products,
expenses, and the rest. What they do **not** share is the shell and the landing:

- **Mobile** is a feed-first, aggregated, app-like experience anchored on **Home**.
- **Desktop** is a set of module pages framed by persistent chrome (branded header,
  floating pill nav), landing directly on **Orders**.

Do not try to converge them. Do not port the mobile Home feed onto desktop, and do not
port desktop's header chrome onto mobile. The asymmetry *is* the design.

---

## Mobile

1. **Home is the prime structure.** The Home feed (greeting hero, quick-add,
   category chips, momentum snapshot, card-first recent orders) is both the mobile
   landing *and* the pattern language every other mobile screen inherits. When a
   module screen gets its mobile treatment, it should feel like it came from the same
   place as Home.
2. **Each screen owns its own top.** There is no global header bar on mobile. Identity,
   greeting, and announcements live *inside* the feed, not in chrome stacked above it.
   Content earns the vertical space a phone is short on.
3. **Card-first, not tables.** Lists of records (orders, clients, expenses, materials)
   become cards on mobile — never a horizontal-scrolling desktop table shrunk down.
   `RecentOrdersList` is the reference treatment.
4. **Thumb-zone navigation.** A full-width bottom tab bar (`MobileTabBar`): 4 primary
   destinations + a More sheet. Safe-area aware. Touch targets ≥ 44px.
5. **Visual language.** Spacious, generously rounded (`rounded-2xl` / `rounded-3xl`),
   card-on-background surfaces, driven entirely by theme tokens so every screen holds
   in both light and dark. This is the **locked** system — "matches Home" is a hard
   constraint for new mobile work, not a suggestion.

## Desktop

1. **Module-pages + chrome.** `TopHeader` (branding, greeting, announcement banner) and
   the floating pill nav (`FooterNav` / `ExpandableTabs`) are desktop's frame. They are
   desktop-only (`hidden lg:block`) by design — their content is redundant with the
   mobile Home feed.
2. **Lands on Orders.** Desktop has no Home concept. `/dashboard` sends desktop users
   straight to `/dashboard/orders`; **Home is mobile-only** and is not a desktop
   destination (not in the desktop pill, and `/dashboard/home` bounces desktop viewers
   to Orders).
3. **A dedicated desktop dashboard is deliberately deferred.** If one is ever built, it
   is a *new* desktop-native surface — not the centered mobile feed reused.

---

## How this maps to the shell today

| Concern | Mobile | Desktop |
|---------|--------|---------|
| Landing (`/dashboard`) | `/dashboard/home` (feed) | `/dashboard/orders` |
| Top chrome | none — screen owns its top | `TopHeader` (branding + announcement) |
| Primary nav | `MobileTabBar` (bottom, 4 + More) | `FooterNav` floating pill |
| Order list surface | card feed (`RecentOrdersList` language) | data table |
| Home route on this platform | the experience | redirects to Orders |

---

## Refinement mandate

The refinement pass this doc opens goes **as far as needed for a polished, app-like,
working product** — not a responsiveness patch job. "It technically fits at 375px" is not
the bar; "it feels like a native app screen that belongs next to Home" is. Where an
existing screen only shrinks a desktop layout, it gets **rebuilt** to the mobile language,
not tweaked.

## Scaffolding gaps (data/modules that don't exist yet)

When a screen needs analytics, an aggregate, or a module that hasn't been built or
migrated yet, **don't block and don't fake it** — scaffold the UI to its finished
visual state on the best honest interim data (a bounded query, a real approximation),
and **record the handoff** so it gets wired properly when the owning module lands:

1. Build the UI to look done — no visible "coming soon" stubs unless the data truly
   can't be approximated.
2. Mark the interim data in code with a `TODO(v2 read layer)` comment naming the
   module it belongs to.
3. Log it in `docs/v2-migration/STATE.md` — under that module's row in **Module
   status**, and in the **Follow-up backlog** — so whoever cuts the module over sees
   it. STATE.md is the tracker of record for "when we have the actual module."

Reference example: Home's "sales this month" card — scaffolded on a bounded
client-side order sum, tracked against the analytics/metrics module in STATE.md.

See `MOBILE_AUDIT.md` for the tracked findings and `COMPONENT_REGISTRY.md` for the
per-component responsiveness log.
