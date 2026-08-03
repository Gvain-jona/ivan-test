# Mobile Responsiveness Audit

**Date:** 2026-06-25
**Scope:** Navigation, core data tables (orders/expenses/materials), forms/sheets/dialogs, settings, analytics, notifications, images — audited against a ~375px (phone) viewport.
**Method:** Direct inspection of `app/components/`, `app/dashboard/`, `app/features/`; highest-impact claims verified against source (not taken at face value from initial passes).

## Status Key

| Symbol | Meaning |
|--------|---------|
| 🔲 OPEN | Not yet addressed |
| 🟡 IN PROGRESS | Being worked on |
| ✅ FIXED | Applied, committed, verified |

---

## Critical — broken or inaccessible on a real phone

| ID | Finding | File:Line | Fix | Status |
|----|---------|-----------|-----|--------|
| MOB-01 | Expenses table data is unreachable on mobile — outer wrapper is `overflow-hidden` with ~1200px of fixed-width columns and no scrollable ancestor anywhere in the chain (`ExpensesTabContent.tsx` → `ExpensesTable.tsx`). Columns beyond the viewport are clipped with no scrollbar, no swipe. | `app/dashboard/expenses/_components/table/ExpensesTable.tsx:35` | Change `overflow-hidden` to `overflow-x-auto` on the actual scroll container, the way `OrdersTableNew.tsx:469` already does correctly. | 🔲 OPEN |
| MOB-02 | Same bug as MOB-01 in the materials table. | `app/components/materials/MaterialPurchasesTable.tsx:41` | Same fix as MOB-01. | 🔲 OPEN |
| MOB-03 | Notifications drawer hardcodes `width="450px"` — no phone has a 450px viewport, so this overflows on every device, not an edge case. | `app/components/notifications/NotificationsDrawer.tsx:72` | Cap with `w-[min(450px,90vw)]` or pass a viewport-aware width. | 🔲 OPEN |
| MOB-04 | Orders table forces horizontal scroll through the app's most-used screen — `table-fixed` layout with a `w-[250px]` client column plus fixed date/actions columns. Scrolling itself works (correct `overflow-auto` wrapper), but the UX is sideways-scrolling a list users hit constantly. | `app/components/orders/OrdersTableNew.tsx` | ✅ Card-first `OrderCard` list renders on mobile (`lg:hidden`); the table is now desktop-only (`hidden lg:block`). | ✅ FIXED |

## High — works, but actively fights the user on mobile

| ID | Finding | File:Line | Fix | Status |
|----|---------|-----------|-----|--------|
| MOB-05 | Settings edit dialogs use `sm:max-w-[425px]`, a minimum that only applies above the `sm` breakpoint (640px) — below it the dialog goes full-width around a non-collapsing `grid-cols-4` label/input layout. Every settings edit dialog is cramped on a phone. | `app/dashboard/settings/_components/AccountsSettingsTab.tsx:674,684,702,729,747,910,920,934,948,967`; `ProfitSettingsTab.tsx:654` | Collapse to `grid-cols-1` (label above input) below `sm`; let dialog go `w-[calc(100vw-2rem)]` on mobile. | 🔲 OPEN |
| MOB-06 | Pervasive `size="icon"` buttons render at 32–36px against the 44px (iOS)/48px (Material) touch-target guidance. Most repeated issue in the codebase. | `OrderActions.tsx:143`; `OrderFormSheet.tsx:96`; `UserManagementTab.tsx:268,275,284`; `AccountsSettingsTab.tsx:482,491,502`; `ProfitSettingsTab.tsx:429,436` | Bump primary row-action icon buttons to `h-11 w-11` (44px), or add an invisible larger hit-area wrapper. | 🔲 OPEN |
| MOB-07 | Sticky form footers have no reserved bottom padding — focusing the last field brings up the keyboard and covers the Save button. | `OrderFormSheet.tsx`; `MaterialPurchaseForm.tsx:1004,1264` | 🟡 v2 forms (order/client/product/field) now use OrderSheet's `footer` slot: a real sticky action bar, safe-area-aware (`pb-[max(.75rem,env(safe-area-inset-bottom))]`). Keyboard-viewport (`visualViewport`) handling still pending; legacy MaterialPurchaseForm untouched (dark module). | 🟡 IN PROGRESS |
| MOB-08 | Form tabs truncate/overflow at 375px — not enough room for icon+label per tab. | `OrderFormSheet.tsx:139` (4 tabs); `InvoiceSheet.tsx:52-74` (3 tabs, no wrap/scroll) | Icon-only tabs below `sm`, or a horizontally-scrolling tab strip. | 🔲 OPEN |
| MOB-09 | Analytics stat grid hardcoded to 2 columns; labels like "Overdue Installments" wrap badly in a ~150px column. | `app/dashboard/analytics/_components/MaterialsPanel.tsx:273` | `grid-cols-1 sm:grid-cols-2`. | 🔲 OPEN |
| MOB-10 | Invoice preview metadata block uses a non-collapsing 2-column grid. Note: the outer container (`maxWidth: 900px`) and the line-items table (percentage-based `gridTemplateColumns`) already shrink correctly — this is the one real gap, not a full-template rebuild. | `app/features/invoices/components/templates/OrangeInvoiceTemplate.tsx:230` | Collapse `gridTemplateColumns: '1fr 1fr'` to one column below ~480px. | 🔲 OPEN |

## Medium — real, but lower impact

| ID | Finding | File:Line | Fix | Status |
|----|---------|-----------|-----|--------|
| MOB-11 | App-wide pattern is desktop-first with sparse mobile overrides, not mobile-first: only ~11 `hidden md:`/`md:hidden` toggles across `app/`, vs. ~130 `md:` / ~123 `sm:` prefixes mostly used for sizing rather than restructuring. | repo-wide | Keep mobile-first restructuring (not just shrinking) as the default for new work. | 🔲 OPEN |
| MOB-12 | Settings tables scroll horizontally inside an already-narrow dialog — a double-scroll UX (scroll the sheet, then scroll the table inside it). | `RolePermissionsSection.tsx:256`; account/user list tables in `AccountsSettingsTab.tsx`, `UserManagementTab.tsx` | Consider a card-list layout for these tables inside dialogs on mobile. | 🔲 OPEN |
| MOB-13 | Bottom-nav "Search" popup has an internal `grid-cols-2` with no mobile override; its dynamic width calc (`Math.min(500, Math.max(300, vw-32))`) can land narrower than the 2-column content needs on a 320px phone. | context menu / search popup (triggered from `FooterNav`) | `grid-cols-1` fallback when computed width is below a threshold. | 🔲 OPEN |
| MOB-14 | Toast/notification `min-w-[300px]` can clip on the narrowest real devices (320px) once margins are subtracted. | notification/toast component | `min-w-[min(300px,calc(100vw-2rem))]`. | 🔲 OPEN |
| MOB-15 | Profile page uses a raw `<img>` instead of `next/image` (everywhere else in the app — `TopHeader.tsx`, `file-upload.tsx` — uses `next/image` correctly). Inconsistent, and worse on mobile data. | `app/dashboard/profile/page.tsx` | Migrate to `next/image` with a `sizes` prop. | 🔲 OPEN |

## Already solid — do not "fix"

Verified as genuinely well-built for mobile already; re-auditing these would be wasted effort:
- Home dashboard KPI grids (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`)
- `MaterialPurchaseForm` internal field grids (`grid-cols-1 md:grid-cols-2/3`)
- Chart rendering — Recharts `ResponsiveContainer` used consistently
- Date-range picker's responsive min-width
- Bottom-nav (`ExpandableTabs`) itself

## Architecture question — RESOLVED (2026-07-21)

Earlier drafts flagged a dead `SideNav.tsx`; that file no longer exists. The nav model is now a **deliberate platform-adaptive split**, not one nav restyled:
- **Desktop (`lg+`)**: the floating bottom pill (`FooterNav`/`ExpandableTabs`) with the full destination set — kept as the signature desktop IA.
- **Mobile (`<lg`)**: `MobileTabBar.tsx` — a full-width bottom tab bar with 4 primary routes + a More sheet.
- **Header**: `TopHeader` is desktop-only (`hidden lg:block`); mobile screens own their own top (e.g. the Home greeting hero).

No desktop sidebar is planned. New shell work should preserve this split rather than converging the two navs.

---

## Post-redesign findings (2026-07-23)

Added after the mobile-shell redesign (Home feed + `MobileTabBar`), which the
2026-06-25 pass predates. See `DESIGN_PHILOSOPHY.md` for the direction these are
judged against.

| ID | Finding | File:Line | Fix | Status |
|----|---------|-----------|-----|--------|
| MOB-16 | Home's recent-order cards — the prime mobile order surface — all link to the generic `/dashboard/orders` list, not the specific order. Tapping any card, "See all", the Orders tab, and the Orders chip all land in the same place; you cannot open an order from Home. | `app/components/home/RecentOrdersList.tsx:62` | ✅ Cards deep-link `?order=<id>`; the orders page opens that order's view sheet via `handleViewOrderById` (sheet hydrates detail from the id). | ✅ FIXED |
| MOB-17 | Shell sized with `h-screen` (`100vh`): on mobile browsers `100vh` counts the area behind the collapsing toolbar, pushing the fixed bottom tab bar and last content rows out of view until scroll. | `app/components/layout/DashboardLayout.tsx:34` | `h-dvh` (dynamic viewport height). | ✅ FIXED |
| MOB-18 | Profile-error alert is `fixed top-0` at all sizes, but the compensating `mt-12` offset lives only on the desktop-only header — on mobile nothing offsets it, so it covers the Home hero. | `app/components/navigation/TopHeader.tsx:177` | ✅ Resolved by making the alert **desktop-only** (`hidden lg:flex`) — per the 2026-07-23 decision that `TopHeader` is desktop chrome and mobile shows nothing from it. (Superseded the earlier in-flow-on-mobile approach.) | ✅ FIXED |
| MOB-19 | Home quick-add leads the "Create a new order…" action with a magnifying-glass `Search` icon (comment calls it a "command/search bar"), but it's a plain link straight to create — no search, no input. Wrong affordance. | `app/components/home/HomeHero.tsx:82` | Kept as-is by product decision (2026-07-23): the search+add bar reads as intended. | ⏸ ACCEPTED |
| MOB-20 | Home category chips (Orders/Clients/Products/Expenses) duplicated `MobileTabBar`'s primary tabs, both on-screen on Home — redundant nav weight on the most important screen. | `app/components/home/HomeQuickActions.tsx` | ✅ Chips repurposed into quick *actions* (New client / New product create shortcuts) — no longer duplicate nav. | ✅ FIXED |

## Suggested order of attack

1. MOB-01 – MOB-04 (critical — difference between "usable" and "broken" on a phone)
2. MOB-06, MOB-07 (touch targets + keyboard overlap — cheap, repeated everywhere)
3. Remaining High items
4. Medium items as capacity allows
