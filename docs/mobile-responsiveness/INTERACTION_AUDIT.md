# Mobile Interaction Refinement Audit

**Date:** 2026-07-23
**Scope:** The mobile flows built/touched in this refinement pass — Home feed, the
form/bottom-sheet system, orders list, and the nav shell. This is not a
responsiveness audit (see `MOBILE_AUDIT.md`); it's about **interaction quality** —
whether behavior matches the affordance and whether flows feel considered.
**Method:** direct code inspection; every finding cites the file.

## The root patterns

Most of the "trinkets" are not independent bugs — they're a few missing foundations
showing up repeatedly:

- **P1 — Navigate-to-summon-a-modal.** Opening an overlay is done by changing route +
  a URL side-effect, instead of opening in place. Set accidentally as the house style.
- **P2 — Affordance ≠ behavior.** A signifier (grab handle, search icon) promises an
  interaction the code doesn't implement.
- **P3 — The bottom sheet isn't a real bottom sheet.** The custom `Sheet` primitive is
  missing the mechanics a native sheet has (drag, focus, motion).
- **P4 — Silent states.** Disabled/blocked actions give no response.
- **P5 — Context & history loss.** After an action you're left somewhere you didn't
  intend; hardware/browser Back doesn't dismiss sheets.

---

## Findings

| ID | Flow | The trinket | File | Pattern | Sev |
|----|------|-------------|------|---------|-----|
| INT-01 | Home → create order | Quick-add is a `<Link href="/dashboard/orders?new=1">` — tapping **navigates to Orders**, whose effect then opens the sheet. A modal summoned by a route change. | `app/components/home/HomeHero.tsx:82` | P1 | High |
| INT-02 | Home → open order | Recent-order card links to `/dashboard/orders?order=<id>` — again routes to Orders, *then* opens the view sheet. | `app/components/home/RecentOrdersList.tsx` (OrderCard) | P1 | High |
| INT-03 | Home → new client/product | Quick-action chips link to `/clients?new=1` / `/products?new=1` — route, then open. | `app/components/home/HomeQuickActions.tsx` | P1 | High |
| INT-04 | Bottom sheet | **Grab handle implies drag-to-dismiss; there is no drag gesture.** A visual promise the code doesn't keep. | `app/components/ui/sheets/OrderSheet.tsx` (handle) + `app/components/ui/sheet.tsx` | P2 | High |
| INT-05 | Home → create order | Quick-add leads with a **search (🔍) icon for a create action**. | `app/components/home/HomeHero.tsx:86` | P2 | Low |
| INT-06 | Sheets, app-wide | **Two inconsistent bottom-sheet languages:** OrderSheet has a grab handle + `rounded-t-2xl`; the tab bar's More sheet has no handle + `rounded-t-3xl`. No single sheet primitive. | `OrderSheet.tsx` vs `app/components/navigation/MobileTabBar.tsx:115` | P2 | Med |
| INT-07 | Bottom sheet | No **drag-to-dismiss** (custom `Sheet` supports only X / backdrop / Escape). | `app/components/ui/sheet.tsx` | P3 | High |
| INT-08 | Bottom sheet | No **focus management** — focus isn't moved into or trapped within the sheet; keyboard/AT users are left behind it. | `app/components/ui/sheet.tsx` | P3 | Med |
| INT-09 | Bottom sheet | No **enter/exit animation** — the sheet *appears* instead of sliding up (variants set position, not a transform). Feels broken on mobile. | `app/components/ui/sheet.tsx` | P3 | Med |
| INT-10 | Nav / disabled items | Disabled **Analytics** tile in the More sheet is a dead `<div>` (`cursor-not-allowed`); tapping does nothing, says nothing. Disabled nav items only `console.log`. | `app/components/navigation/MobileTabBar.tsx:139` | P4 | Low |
| INT-11 | Home → create, then done | After creating an order from Home (INT-01) you're **left on Orders**, not returned Home; the deep-link `router.replace` also strips the param abruptly. | `app/dashboard/orders/page.tsx` (`?new`/`?order` effect) | P5 | Med |
| INT-12 | Any sheet | Sheets don't push a **history entry**, so hardware/browser **Back closes the whole screen** instead of dismissing the sheet — the universal mobile expectation. | `app/components/ui/sheet.tsx` / all sheet callers | P5 | Med |
| INT-13 | Scroll-to-top FAB | Hardcoded `bg-orange-500` (not a token; wrong in light theme) and `fixed bottom-20` sits tight against the MobileTabBar. | `app/components/navigation/FooterNav.tsx:242` | P4 | Low |

**Verified NOT broken** (so we don't "fix" them): body scroll *is* locked while a sheet
is open (`sheet.tsx:29`); form submit shows a button spinner + toast + closes on success;
recent-order cards and "See all" now go to distinct, correct destinations.

---

## Fix strategy — foundations, not whack-a-mole

Two foundations collapse most of the table; a short polish list mops up the rest.

### Foundation A — a global sheet host (kills P1 + INT-11)
A provider that owns the create-order / view-order / create-client / create-product
sheets and opens them **by intent from anywhere**, in place, with no navigation. Home's
quick-add, card taps, and chips call `openCreateOrder()` / `openOrder(id)` etc. instead
of routing. Closes INT-01, INT-02, INT-03, INT-11 at once, and makes "create" feel
instant. (The orders page keeps deep-link support for shared URLs, but Home stops using
navigation as its open mechanism.)

### Foundation B — one real bottom-sheet primitive (kills P2/P3 + INT-06)
Adopt **`vaul`** (the standard React drawer: drag-to-dismiss with velocity, snap points,
focus trap, slide animation, scroll-lock) for the mobile bottom-sheet path, and route
**both** OrderSheet's mobile side **and** the tab bar's More sheet through it. One sheet
language everywhere; the grab handle finally does what it says. Desktop keeps the
right-side panel. Closes INT-04, INT-06, INT-07, INT-08, INT-09.
*Decision needed:* adopt `vaul` (one dependency) vs. hand-rolling the gesture on the
custom sheet (more code, worse result). Recommend `vaul`.

### Foundation B′ — Back dismisses the sheet (INT-12)
Whichever primitive we land on, opening a sheet should push a history state so Back
closes it. `vaul` doesn't do routing itself; we add a small history-entry-on-open in the
sheet host. Bundle with Foundation A.

### Polish (after foundations)
- INT-05: swap the quick-add's 🔍 for a create glyph (or make it a real search-or-create).
- INT-10: disabled tiles respond ("Analytics — coming soon" toast) instead of dead silence.
- INT-13: FAB → theme token; nudge clear of the tab bar.

## Suggested order
1. **Foundation A** (global sheet host) — biggest felt improvement, unblocks Home.
2. **Foundation B + B′** (vaul + Back handling) — makes the sheet a real sheet.
3. **Polish** (INT-05, INT-10, INT-13) — quick sweep.
