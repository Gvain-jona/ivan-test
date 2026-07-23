# UI Component Responsiveness Registry

An ongoing log, not a gate. Add one row whenever a new component is created (or an existing one is significantly restructured), with a plain `Yes` / `No` / `Partial` on whether it holds up across breakpoints (~375px phone through desktop). No write-up required, no enforcement implied — `No` is a perfectly valid entry. This exists only to keep visibility into how much of the app actually scales as it grows.

Seeded below from `MOBILE_AUDIT.md` (2026-06-25) to bootstrap the log — update a row's status in place once its underlying fix ships, rather than adding a duplicate row.

| Component | Path | Responsive | Notes |
|-----------|------|------------|-------|
| ExpensesTable | `app/dashboard/expenses/_components/table/ExpensesTable.tsx` | No | MOB-01 |
| MaterialPurchasesTable | `app/components/materials/MaterialPurchasesTable.tsx` | No | MOB-02 |
| NotificationsDrawer | `app/components/notifications/NotificationsDrawer.tsx` | No | MOB-03 |
| OrdersTableNew | `app/components/orders/OrdersTableNew.tsx` | Yes | Card-first list on mobile (`lg:hidden`), table desktop-only (`hidden lg:block`) — MOB-04 fixed |
| OrderCard | `app/components/orders/OrderCard.tsx` | Yes | Mobile order card (Home card language) with full action parity — tap-to-view, status dropdown, actions menu, badges |
| AccountsSettingsTab (edit dialogs) | `app/dashboard/settings/_components/AccountsSettingsTab.tsx` | Partial | MOB-05, MOB-06 |
| ProfitSettingsTab (edit dialogs) | `app/dashboard/settings/_components/ProfitSettingsTab.tsx` | Partial | MOB-05, MOB-06 |
| UserManagementTab | `app/dashboard/settings/_components/UserManagementTab.tsx` | Partial | MOB-06, MOB-12 |
| OrderFormSheet | `app/components/orders/OrderFormSheet.tsx` | Partial | MOB-06, MOB-07, MOB-08 |
| MaterialPurchaseForm | `app/components/materials/MaterialPurchaseForm.tsx` | Partial | Field grids solid; sticky footer overlaps keyboard — MOB-07 |
| InvoiceSheet | `app/features/invoices/components/InvoiceSheet.tsx` | Partial | Tabs overflow — MOB-08 |
| MaterialsPanel (analytics) | `app/dashboard/analytics/_components/MaterialsPanel.tsx` | Partial | Stat grid hardcoded to 2 cols — MOB-09 |
| OrangeInvoiceTemplate | `app/features/invoices/components/templates/OrangeInvoiceTemplate.tsx` | Partial | Metadata grid doesn't collapse — MOB-10 |
| RolePermissionsSection | `app/dashboard/settings/_components/RolePermissionsSection.tsx` | Partial | Double-scroll inside dialog — MOB-12 |
| FooterNav / ExpandableTabs | `app/components/navigation/FooterNav.tsx` | Yes | Desktop-only now (`hidden lg:block`) — the floating pill with the full destination set; mobile renders MobileTabBar instead |
| MobileTabBar | `app/components/navigation/MobileTabBar.tsx` | Yes | Mobile-only (`lg:hidden`) bottom tab bar: 4 primary routes + More sheet; safe-area aware. The platform-adaptive counterpart to the desktop pill |
| TopHeader | `app/components/navigation/TopHeader.tsx` | Yes | Entirely desktop-only now: branded bar + announcement banner (`hidden lg:block`) and the profile-error alert (`hidden lg:flex`) all render only at `lg+`. Mobile shows nothing from this header — each screen owns its own top (e.g. Home hero) |
| DashboardLayout | `app/components/layout/DashboardLayout.tsx` | Yes | |
| Home dashboard KPI grids | `app/dashboard/home/` | Yes | |
| MaterialPurchaseForm field grids | `app/components/materials/MaterialPurchaseForm.tsx` | Yes | Internal `grid-cols-1 md:grid-cols-2/3` layout specifically |
| Chart rendering (Recharts) | various `_components/` analytics charts | Yes | `ResponsiveContainer` used consistently |
| Date-range picker | shared date-range component | Yes | |
| SideNav | `app/components/navigation/SideNav.tsx` | N/A | Dead code, never rendered — see MOBILE_AUDIT.md architecture question |
| CustomFieldsForm | `app/components/fields/CustomFieldsForm.tsx` | Yes | Field grid collapses `sm:grid-cols-2` → 1 col; groups stack vertically |
| CustomFieldInput | `app/components/fields/CustomFieldInput.tsx` | Yes | Dimension inputs wrap via `flex-wrap`; selects/inputs full-width |
| OrderSheet (shared form wrapper) | `app/components/ui/sheets/OrderSheet.tsx` | Yes | Platform-adaptive: **bottom sheet on mobile** (grab handle, rounded top, `max-h-[85dvh]`, safe-area) / **right panel on desktop** (`lg`), chosen via `useMediaQuery`. Optional **`footer` slot** = a sticky action bar pinned below the scroll body (safe-area aware). Order/client/product/field forms all render through it |
| OrderFormSheet (v2 rebuild) | `app/components/orders/OrderFormSheet.tsx` | Yes | All field grids collapse `sm:` → 1 col; payment rows stack. Bottom sheet on mobile with a **sticky Cancel/Save footer** (via OrderSheet `footer`) |
| ProductsPage | `app/dashboard/products/page.tsx` | Yes | Header/controls stack on mobile; table scrolls in `overflow-x-auto` |
| ProductFormSheet | `app/components/products/ProductFormSheet.tsx` | Yes | Grids collapse `sm:` → 1 col |
| FieldSetupPage | `app/dashboard/fields/page.tsx` | Partial | Entity tab bar may overflow on ~375px; table scrolls horizontally |
| FieldDefinitionFormSheet | `app/components/fields/FieldDefinitionFormSheet.tsx` | Yes | Grids collapse `sm:` → 1 col |
| ClientsPage | `app/dashboard/clients/page.tsx` | Yes | Controls stack on mobile; table scrolls in `overflow-x-auto` |
| ClientFormSheet | `app/components/clients/ClientFormSheet.tsx` | Yes | Single column; custom-field grid collapses `sm:` → 1 col |
| SignInPage (Clerk) | `app/auth/signin/[[...rest]]/page.tsx` | Yes | Clerk `<SignIn />` card is responsive by default; branding shell reuses signin.css |
| HomePage | `app/dashboard/home/page.tsx` | Yes | Mobile-first Home feed; centered `max-w-2xl` column, stacks naturally |
| HomeHero | `app/components/home/HomeHero.tsx` | Yes | Greeting hero + avatar + quick-add bar; greeting scales `text-3xl sm:text-4xl` |
| HomeQuickActions | `app/components/home/HomeQuickActions.tsx` | Yes | Horizontal-scroll quick-action chips (New client / New product → `?new=1` deep-links). Replaced HomeCategoryChips, which duplicated the tab bar |
| HomeSnapshot | `app/components/home/HomeSnapshot.tsx` | Yes | "Sales this month" momentum card (figure + month order count); single column |
| RecentOrdersList | `app/components/home/RecentOrdersList.tsx` | Yes | Card-first order list grouped by workflow state (in progress / awaiting payment / …) — the mobile default for order data |
