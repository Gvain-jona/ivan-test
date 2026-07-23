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

**Progress (2026-07-23)** — the decision-independent, norm-backed items shipped first:
- ✅ **INT-04** — grab handle removed until the sheet is actually draggable (returns with
  the drawer primitive). ✅ **INT-10** — disabled tiles now show a "Soon" label instead of
  dead silence. ✅ **INT-13** — scroll-top FAB tokenized (`bg-primary`) and lifted clear of
  the tab bar. INT-05 left as-is (product decision: search+add bar is accepted).
- ⏳ Foundations A (open mechanism) and B (drawer primitive) pending the two decisions
  below; default leaning A2 (state host + history) + `vaul`.

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
1. **Foundation A** (in-place open) — biggest felt improvement, unblocks Home.
2. **Foundation B + B′** (real sheet + Back handling) — makes the sheet a real sheet.
3. **Polish** (INT-05, INT-10, INT-13) — quick sweep.

---

## Verification against 2026 norms (researched 2026-07-23)

Checked the two load-bearing recommendations (drawer lib + in-place-open approach) and
the sheet-mechanics claims against current sources. Outcome: findings hold, but **both
foundations get refined** — I'd overstated a couple of things.

**Confirmed (mechanics):** Modal bottom sheets should have a scrim + disable background
(we do — scroll lock at `sheet.tsx:29`), and are dismissed by tap-outside / swipe-down /
close-action — **multiple dismiss methods coexisting is normal**, so INT-06 is really about
our *inconsistency + dead handle*, not "too many closes." New norm to apply: **a drag
handle should only appear when the sheet is actually draggable** (iOS hides the grab
indicator when there's a single detent). So the cheapest correct fix for INT-04, regardless
of library, is **wire the drag or hide the handle** — a decorative handle is a norm
violation, not just a nitpick. (Material 3 bottom sheets; iOS `UISheetPresentationController`.)

**Refines Foundation A (in-place open).** The current Next.js-recommended modal pattern is
**intercepting + parallel routes** — they give a URL-addressable overlay that opens over the
*current* page and dismisses on Back, natively (solves INT-01/02/03 **and** INT-12 without
manual history glue). That's more aligned than my "avoid navigation, pure state host."
Caveat the community also flags: `router.back()` dismissal breaks once a modal links to
*other* intercepted routes, and it adds route-segment complexity for our heavy client-form
sheets. So it's a genuine trade, not a clear win:
- **Option A1 — intercepting/parallel routes:** framework-blessed, URL + Back for free; more
  setup, known edge cases with nested intercepts.
- **Option A2 — state sheet-host + explicit history entry (or `?sheet=` param):** simpler,
  full control, in-place; we own the Back glue. Also an accepted community pattern.
  Given our sheets are deep client forms (contexts + mutations), **A2 is the pragmatic pick**;
  A1 is the textbook one.

**Refines Foundation B (real sheet).** `vaul` is still legitimate — shadcn's Drawer is built
on it, it's Radix-Dialog-based (matches our stack), MIT, production-proven (Linear, Vercel).
But research flags it's on a **~2-year-old release** with known iOS-scroll / keyboard-a11y
workarounds, and — notably — **shadcn now defaults its primitive layer to Base UI** (stable
v1, 2026, by the ex-Radix team) though its Drawer still uses vaul. So:
- **vaul** — best ecosystem fit, proven; accept slow releases.
- **react-modal-sheet** (Motion-based) — actively maintained alternative with velocity
  dismiss; pick this if maintenance freshness matters more than Radix alignment.
  Recommend **vaul** for stack fit unless we want the fresher maintenance.

**Net changes to the plan:**
1. Do the **handle fix immediately** (wire drag *or* hide handle) — norm-backed, library-agnostic.
2. Foundation A becomes a **decision**: A1 intercepting routes (textbook) vs A2 state-host +
   history (pragmatic, recommended here).
3. Foundation B: **vaul (recommended)** or react-modal-sheet — either is norm-current.

**Sources:** Next.js modal patterns (jsmanifest, May 2026; Next.js parallel-routes docs) ·
Base UI v1 / shadcn default (InfoQ Feb 2026; greatfrontend 2026) · vaul status (npm; shadcn
Drawer) · react-modal-sheet (Temzasse) · Material 3 bottom-sheet specs · iOS
`UISheetPresentationController` (Sarunw) · bottom-sheet UX (Mobbin, Plotline).
