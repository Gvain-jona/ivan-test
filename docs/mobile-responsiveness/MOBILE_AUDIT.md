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
| MOB-04 | Orders table forces horizontal scroll through the app's most-used screen — `table-fixed` layout with a `w-[250px]` client column plus fixed date/actions columns. Scrolling itself works (correct `overflow-auto` wrapper), but the UX is sideways-scrolling a list users hit constantly. | `app/components/orders/OrdersTableNew.tsx:469-475` | Needs a real mobile pattern — a stacked card/list view under `sm:`, not a CSS-only tweak. | 🔲 OPEN |

## High — works, but actively fights the user on mobile

| ID | Finding | File:Line | Fix | Status |
|----|---------|-----------|-----|--------|
| MOB-05 | Settings edit dialogs use `sm:max-w-[425px]`, a minimum that only applies above the `sm` breakpoint (640px) — below it the dialog goes full-width around a non-collapsing `grid-cols-4` label/input layout. Every settings edit dialog is cramped on a phone. | `app/dashboard/settings/_components/AccountsSettingsTab.tsx:674,684,702,729,747,910,920,934,948,967`; `ProfitSettingsTab.tsx:654` | Collapse to `grid-cols-1` (label above input) below `sm`; let dialog go `w-[calc(100vw-2rem)]` on mobile. | 🔲 OPEN |
| MOB-06 | Pervasive `size="icon"` buttons render at 32–36px against the 44px (iOS)/48px (Material) touch-target guidance. Most repeated issue in the codebase. | `OrderActions.tsx:143`; `OrderFormSheet.tsx:96`; `UserManagementTab.tsx:268,275,284`; `AccountsSettingsTab.tsx:482,491,502`; `ProfitSettingsTab.tsx:429,436` | Bump primary row-action icon buttons to `h-11 w-11` (44px), or add an invisible larger hit-area wrapper. | 🔲 OPEN |
| MOB-07 | Sticky form footers have no reserved bottom padding — focusing the last field brings up the keyboard and covers the Save button. | `OrderFormSheet.tsx:229`; `MaterialPurchaseForm.tsx:1004,1264` | Add `pb-[max(1rem,env(safe-area-inset-bottom))]`-style spacing, or pad content using `visualViewport`. | 🔲 OPEN |
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

## Architecture question — not a bug, needs a decision

`app/components/navigation/SideNav.tsx` is a full sidebar component that is **never imported anywhere**. The entire app, desktop included, runs on the floating bottom pill-nav (`FooterNav`/`ExpandableTabs`). This may be a deliberate mobile-first IA choice, or a half-finished migration — worth confirming intent before either deleting `SideNav.tsx` or finishing it as a real `lg:` desktop sidebar.

---

## Suggested order of attack

1. MOB-01 – MOB-04 (critical — difference between "usable" and "broken" on a phone)
2. MOB-06, MOB-07 (touch targets + keyboard overlap — cheap, repeated everywhere)
3. Remaining High items
4. Medium items as capacity allows
