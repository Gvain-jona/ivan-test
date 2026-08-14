# UI Component Responsiveness Registry

An ongoing log, not a gate. Add one row whenever a new component is created (or an existing one is significantly restructured), with a plain `Yes` / `No` / `Partial` on whether it holds up across breakpoints (~375px phone through desktop). No write-up required, no enforcement implied — `No` is a perfectly valid entry. This exists only to keep visibility into how much of the app actually scales as it grows.

Seeded below from `MOBILE_AUDIT.md` (2026-06-25) to bootstrap the log — update a row's status in place once its underlying fix ships, rather than adding a duplicate row.

| Component | Path | Responsive | Notes |
|-----------|------|------------|-------|
| ExpensesTable | `app/dashboard/expenses/_components/table/ExpensesTable.tsx` | No | MOB-01 |
| MaterialPurchasesTable | `app/components/materials/MaterialPurchasesTable.tsx` | No | MOB-02 |
| NotificationsDrawer | `app/components/notifications/NotificationsDrawer.tsx` | No | MOB-03 |
| ~~OrdersTableNew~~ | ~~`app/components/orders/OrdersTableNew.tsx`~~ | — | **Deleted 2026-08-10** — superseded by B1 (`OrdersListScreen`), along with `OrderRow`, `OrderCard`, `OrdersFilterSheet`, `StatusDropdown`, `OrderActions`, `OrderDeleteConfirmation` and `CustomDropdown` |
| ~~OrderViewSheet (+ tabs)~~ | ~~`app/components/orders/order-view/`~~ | — | **Deleted 2026-08-10** — superseded by B4 (`OrderHubScreen`), which is one scrolling surface rather than five tabs |
| AccountsSettingsTab (edit dialogs) | `app/dashboard/settings/_components/AccountsSettingsTab.tsx` | Partial | MOB-05, MOB-06 |
| ProfitSettingsTab (edit dialogs) | `app/dashboard/settings/_components/ProfitSettingsTab.tsx` | Partial | MOB-05, MOB-06 |
| UserManagementTab | `app/dashboard/settings/_components/UserManagementTab.tsx` | Partial | MOB-06, MOB-12 |
| ~~OrderFormSheet~~ | ~~`app/components/orders/OrderFormSheet.tsx`~~ | — | **Deleted 2026-08-10** — superseded by B2 (`NewOrderScreen`) at the create-order cutover |
| MaterialPurchaseForm | `app/components/materials/MaterialPurchaseForm.tsx` | Partial | Field grids solid; sticky footer overlaps keyboard — MOB-07 |
| InvoiceSheet | `app/features/invoices/components/InvoiceSheet.tsx` | Partial | Tabs overflow — MOB-08 |
| MaterialsPanel (analytics) | `app/dashboard/analytics/_components/MaterialsPanel.tsx` | Partial | Stat grid hardcoded to 2 cols — MOB-09 |
| OrangeInvoiceTemplate | `app/features/invoices/components/templates/OrangeInvoiceTemplate.tsx` | Partial | Metadata grid doesn't collapse — MOB-10 |
| RolePermissionsSection | `app/dashboard/settings/_components/RolePermissionsSection.tsx` | Partial | Double-scroll inside dialog — MOB-12 |
| FooterNav / ExpandableTabs | `app/components/navigation/FooterNav.tsx` | Yes | Desktop-only now (`hidden lg:block`) — the floating pill with the full destination set; mobile renders MobileTabBar instead |
| MobileTabBar | `app/components/navigation/MobileTabBar.tsx` | Yes | Mobile-only (`lg:hidden`) — the canvas's floating pill (centered, detached, safe-area gap beneath): Home · Orders · Clients · Alerts · More. Alerts opens the notifications drawer; Documents moved to the More sheet. Restyled bar→pill + Alerts added 2026-08-14 |
| TopHeader | `app/components/navigation/TopHeader.tsx` | Yes | Entirely desktop-only now: branded bar + announcement banner (`hidden lg:block`) and the profile-error alert (`hidden lg:flex`) all render only at `lg+`. Mobile shows nothing from this header — each screen owns its own top (e.g. Home hero) |
| DashboardLayout | `app/components/layout/DashboardLayout.tsx` | Yes | |
| Home dashboard KPI grids | `app/dashboard/home/` | Yes | |
| MaterialPurchaseForm field grids | `app/components/materials/MaterialPurchaseForm.tsx` | Yes | Internal `grid-cols-1 md:grid-cols-2/3` layout specifically |
| Chart rendering (Recharts) | various `_components/` analytics charts | Yes | `ResponsiveContainer` used consistently |
| Date-range picker | shared date-range component | Yes | |
| SideNav | `app/components/navigation/SideNav.tsx` | N/A | Dead code, never rendered — see MOBILE_AUDIT.md architecture question |
| CustomFieldsForm | `app/components/fields/CustomFieldsForm.tsx` | Yes | Field grid collapses `sm:grid-cols-2` → 1 col; groups stack vertically |
| CustomFieldInput | `app/components/fields/CustomFieldInput.tsx` | Yes | Dimension inputs wrap via `flex-wrap`; selects/inputs full-width |
| OrderSheet (the one sheet primitive) | `app/components/ui/sheets/OrderSheet.tsx` | Yes | Built on **`vaul`**: real drag-to-dismiss, focus trap, slide animation, scroll-lock, keyboard-aware inputs. **Bottom drawer on mobile / right drawer on desktop** (`useMediaQuery`). Optional sticky **`footer` slot** (safe-area aware). Every form (order/client/product/field) **and** the tab-bar More sheet render through it — one sheet language |
| ProductsPage | `app/dashboard/products/page.tsx` | Yes | Header/controls stack on mobile; table scrolls in `overflow-x-auto` |
| ProductFormSheet | `app/components/products/ProductFormSheet.tsx` | Yes | Grids collapse `sm:` → 1 col |
| ~~FieldSetupPage~~ | ~~`app/dashboard/fields/page.tsx`~~ | — | **Removed 2026-07-25** — retired; field editing moved per-entity via `EntityFieldsManager` |
| StatusWorkflowEditor | `app/components/fields/StatusWorkflowEditor.tsx` | Partial | Drill-in workflow editor; stage rows pack colour + name + tag + controls on one line and get tight at 375px — check whether the semantic tag should wrap below the name |
| WorkflowStageRow | `app/components/fields/WorkflowStageRow.tsx` | Partial | One stage row; name input flexes, controls are fixed-width. Same 375px caveat as above |
| StatusWorkflowDrillIn | `app/components/onboarding/StatusWorkflowDrillIn.tsx` | Yes | Hosts the editor and owns save timing; no layout of its own |
| EntityFieldList | `app/components/onboarding/EntityFieldList.tsx` | Yes | Renders the row list; no layout of its own |
| FieldEditor | `app/components/fields/FieldEditor.tsx` | Yes | Inline field editor: stacked single-column groups (label / type / options / rules / archive), all full-width |
| FieldOptionsEditor | `app/components/fields/FieldOptionsEditor.tsx` | Yes | `flex-wrap` option chips + a full-width add row |
| EditableFieldRow | `app/components/fields/EditableFieldRow.tsx` | Yes | Composition of FieldRow + FieldEditor for a field that exists; no layout of its own |
| StarterFieldRow | `app/components/onboarding/StarterFieldRow.tsx` | Yes | Same composition for a starter that doesn't exist yet (edits staged until Continue); no layout of its own |
| FieldComposer | `app/components/fields/FieldComposer.tsx` | Partial | Single-row form (input + type select + Add) that stays horizontal at 375px; the input flexes but the row gets tight — check whether the type select should drop below on narrow screens |
| FieldRow | `app/components/fields/FieldRow.tsx` | Yes | One field in an entity's list: switch + tinted type tag + wrapping option chips. Meta line and chips both `flex-wrap`; switch stays pinned right. Shared by setup and (from phase 7) the field manager |
| EntityFieldsManager | `app/components/fields/EntityFieldsManager.tsx` | Yes | Inline per-entity field list behind a "Fields" toggle on Products/Clients/Orders. Rebuilt on the shared FieldRow / FieldEditor / FieldComposer; single-column, no dialog |
| ~~FieldDefinitionFormSheet~~ | ~~`app/components/fields/FieldDefinitionFormSheet.tsx`~~ | — | **Removed 2026-07-31** — create/edit moved inline (composer + in-row editor); the sheet also couldn't save object-shaped select options |
| ClientsPage | `app/dashboard/clients/page.tsx` | Yes | Controls stack on mobile; table scrolls in `overflow-x-auto` |
| ClientFormSheet | `app/components/clients/ClientFormSheet.tsx` | Yes | Single column; custom-field grid collapses `sm:` → 1 col |
| SignInPage (Clerk) | `app/auth/signin/[[...rest]]/page.tsx` | Yes | Clerk `<SignIn />` card is responsive by default; branding shell reuses signin.css |
| HomePage | `app/dashboard/home/page.tsx` | Yes | Mobile-first Home feed; centered `max-w-2xl` column, stacks naturally |
| MobileFeedHeader | `app/components/navigation/MobileFeedHeader.tsx` | Yes | Shared mobile top for the feed screens (H1/A2/B1/C1/D1): org logo + name + avatar, `lg:hidden` (desktop has TopHeader). New 2026-08-14 — the canvas draws this row on every feed screen; it lived only on Home before |
| HomeHero | `app/components/home/HomeHero.tsx` | Yes | H1 top: `MobileFeedHeader` over the greeting. Rebuilt 2026-08-14 — dropped the search-bar create action (chips carry it); org row extracted to the shared header |
| HomeQuickActions | `app/components/home/HomeQuickActions.tsx` | Yes | Horizontal-scroll quick-create chips: New order (primary) / New client / New quote, matching the H1 frame (2026-08-14). Open the create surfaces via the sheet host |
| HomeSnapshot | `app/components/home/HomeSnapshot.tsx` | Yes | H1 two-figure card: sales this month · still to collect, over two sub-stats (orders this month / in process). Figures split by a `w-px` divider; rebuilt 2026-08-14 |
| QuotationsSection | `app/components/home/QuotationsSection.tsx` | Yes | H1 active-quotations list (rounded card, divided rows); renders nothing when empty. New 2026-08-14 |
| ToDoSection | `app/components/home/ToDoSection.tsx` | Yes | H1 to-do section — scaffolded (no v2 task layer yet); shell + honest empty state, Add disabled. New 2026-08-14 |
| ContinueSetupBanner | `app/components/onboarding/ContinueSetupBanner.tsx` | Yes | Dismissible "Continue setup" badge in the dashboard chrome (owner-only, until `onboarding_completed_at` set). New 2026-08-14 |
| RecentOrdersList | `app/components/home/RecentOrdersList.tsx` | Yes | Card-first order list grouped by workflow state (in progress / awaiting payment / …) — the mobile default for order data |
| GettingStartedPage | `app/dashboard/getting-started/page.tsx` | Yes | First-run wizard host; renders without dashboard chrome (DashboardLayout suppresses it for this route), so the shell owns the viewport |
| GettingStartedWizard | `app/components/onboarding/GettingStartedWizard.tsx` | Yes | A1 only now (2026-08-14) — renders `BusinessDetailsStep` and, on save, seeds defaults + lands on Home. No steps, no shell. Visual QA pending (needs authed runtime) |
| ~~SetupShell~~ | ~~`app/components/onboarding/SetupShell.tsx`~~ | — | **Deleted 2026-08-14** — the multi-step rail went with the wizard collapse; `SectionLabel` now comes from `patterns/screen` |
| OrgLogo | `app/components/onboarding/OrgLogo.tsx` | Yes | Square org mark from Clerk `imageUrl`, initials only as a pre-load fallback; size-driven, no layout of its own |
| ~~StepTracker~~ | ~~`app/components/onboarding/StepTracker.tsx`~~ | — | **Deleted 2026-08-14** — no steps left to track after the A1-only collapse |
| ~~WelcomeStep~~ | ~~`app/components/onboarding/WelcomeStep.tsx`~~ | — | **Deleted 2026-08-10** — A1 is a form, not narration |
| ~~CurrencyStep~~ | ~~`app/components/onboarding/CurrencyStep.tsx`~~ | — | **Deleted 2026-08-10** — folded into A1; its picker survives as `CurrencyPicker` |
| currency-picker-parts | `app/components/onboarding/currency-picker-parts.tsx` | Yes | `CurrencyChip` + `CurrencyListRow`, the two radio presentations of the one currency choice; no layout of their own |
| ~~FirstRecordsStep~~ | ~~`app/components/onboarding/FirstRecordsStep.tsx`~~ | — | **Deleted 2026-08-14** — first records are added in-app now, not in a setup step |
| ~~EntityFieldSetupStep~~ | ~~`app/components/onboarding/EntityFieldSetupStep.tsx`~~ | — | **Deleted 2026-08-14** — fields are seeded, then edited in-app via the "Fields" chip (`EntityFieldsManager`), not configured in setup |
| ~~EntityFieldSection~~ | ~~`app/components/onboarding/EntityFieldSection.tsx`~~ | — | **Deleted 2026-08-14** — went with `EntityFieldSetupStep` |
| OnboardingGate | `app/components/onboarding/OnboardingGate.tsx` | Yes | Logic-only redirect wrapper (renders children unchanged); no layout of its own |
| OrganizationSettingsPage | `app/dashboard/organization/page.tsx` | Yes | Single `max-w-3xl` column, `px-4 sm:px-6`; sections stack. No table, no chrome of its own |
| BrandColorPicker | `app/components/organization/BrandColorPicker.tsx` | Yes | `flex-wrap` swatch chips reflow 4→3→2 per row at 375px; owner-only (staff renders the same chips disabled) |
| ThemePreference | `app/components/organization/ThemePreference.tsx` | Yes | Three `flex-wrap` chips (Light/Dark/System); fits one row at 375px |
| BrandStyle | `app/components/theme/BrandStyle.tsx` | Yes | Emits a `<style>` element only — no rendered layout |
| ThemedSignIn | `app/auth/signin/ThemedSignIn.tsx` | Yes | Clerk's `<SignIn />` with a theme-reactive appearance; Clerk owns the card's own responsiveness |
| ClientField | `app/components/orders/new-order/ClientField.tsx` | Yes | Client search in place (B2d state of B2) — field becomes a search box with results beneath, no stacked surface. Single column throughout |
| patterns/screen | `app/components/patterns/screen.tsx` | Yes | The redesign's **furniture**, for screens and sheets alike: sticky header, section (with optional action), hairline card, divider, sticky footer (figure+action or full-width). Built at 375px first |
| patterns/controls | `app/components/patterns/controls.tsx` | Yes | The redesign's **inputs**: 40px field box, choice chip, two-line list row. Split from `patterns/screen` by role, not forked from it. Chips scroll horizontally, both row lines truncate rather than wrap so money stays aligned. Together these absorbed `new-order/screen-parts.tsx` |
| patterns/settings-rows | `app/components/patterns/settings-rows.tsx` | Yes | Settings row vocabulary from F3: value row (tap to edit in place), edit row, link row (chevron = navigates), switch row, toggle chip. Labels truncate rather than wrap |
| InvoiceSettingsScreen | `app/components/settings/InvoiceSettingsScreen.tsx` | Yes | F3. Six sections of single-column cards, `flex-wrap` chips, sticky full-width Save. Longest scroll in settings at 375px. Visual QA pending |
| OrganizationDestinations | `app/components/organization/OrganizationDestinations.tsx` | Yes | The hub's link rows (E3 shape); summary text truncates |
| DocumentsPage | `app/dashboard/documents/page.tsx` | Yes | F1. Two-figure summary card, `flex-wrap` quick action, horizontally scrolling filter chips, single-column list. Visual QA pending |
| DocumentRow | `app/components/documents/DocumentRow.tsx` | Yes | Two-line row on the shared anatomy; number/client truncate, money and state stay pinned right |
| DocumentPaper | `app/components/documents/DocumentPaper.tsx` | Yes | B9. Fixed-light by design (paper is always white — the documented exception in CLAUDE.md); single column, wraps at 375px, prints without the app chrome |
| DocumentPage | `app/dashboard/documents/[id]/page.tsx` | Yes | Header/footer `print:hidden` so only the paper reaches the printer |
| patterns/summary | `app/components/patterns/summary.tsx` | Yes | The money summary block shared by B2/B4/C2/D2, plus the "too many to total" fallback |
| ClientDetailScreen | `app/components/clients/ClientDetailScreen.tsx` | Yes | C2. Contact card, order list, summary, sticky footer; single column throughout |
| ProductDetailScreen | `app/components/products/ProductDetailScreen.tsx` | Yes | D2. Price block, detail rows, `flex-wrap` alias chips, recent lines, summary |
| ScreenFields | `app/components/fields/ScreenFields.tsx` | Yes | The field registry in the redesign vocabulary (sibling to `CustomFieldsForm`, not a fork). Compact controls pair two-up and drop to one column of full-width rows for selects/dimensions; select chips `flex-wrap`, and past 8 options fall back to a native picker rather than a wall of chips |
| NewOrderScreen | `app/components/orders/new-order/NewOrderScreen.tsx` | Yes | B2. Single column at any width, `max-w-lg` centred on desktop; sticky header and footer, seven stacked sections. Renders chromeless (`DashboardLayout` suppresses the tab bar for this route) so the footer isn't covered |
| new-order/parts | `app/components/orders/new-order/parts.tsx` | Yes | Draft note card and empty lines; chips `flex-wrap`, note text wraps |
| AddItemSheet | `app/components/orders/sheets/AddItemSheet.tsx` | Yes | B2a/B2a2 through `OrderSheet` — bottom sheet on mobile, right panel on desktop. Quantity and unit price sit two-up at 375px |
| add-item-states | `app/components/orders/sheets/add-item-states.tsx` | Yes | The sheet's search and chosen views; result rows truncate on both lines so price stays pinned right |
| AddPaymentSheet | `app/components/orders/sheets/AddPaymentSheet.tsx` | Yes | B2b. Method chips `flex-wrap` (4 fit two rows at 375px); amount box carries the currency code inline |
| AddNoteSheet | `app/components/orders/sheets/AddNoteSheet.tsx` | Yes | B2c. Type chips come from the org's `note` fields and are absent when it has none; textarea fills the width |
| DiscountSheet | `app/components/orders/sheets/DiscountSheet.tsx` | Yes | B8. Amount/Percent chips, one value box with a trailing unit, live summary panel |
| OrderHubScreen | `app/components/orders/order-hub/OrderHubScreen.tsx` | Yes | B4. Single column, `max-w-lg` centred on desktop; six stacked sections replacing the old five tabs. Chromeless route so the sticky footer isn't covered by the tab bar |
| HubHeader | `app/components/orders/order-hub/HubHeader.tsx` | Yes | Order number, client and a context line built from the org's own fields; all three truncate rather than wrap |
| HubSheets | `app/components/orders/order-hub/HubSheets.tsx` | Yes | Mounts the hub's five sheets off one state value; no layout of its own |
| IssueDocumentSheet | `app/components/orders/sheets/IssueDocumentSheet.tsx` | Yes | B7. Type and terms chips `flex-wrap`; summary panel and a plain-language warning that issuing is final |
| OrdersListScreen | `app/components/orders/list/OrdersListScreen.tsx` | Yes | B1, with A2 as its empty state. Single `max-w-lg` column: two-figure summary card, `flex-wrap` quick actions, search, horizontally scrolling filter chips, hairline-divided list |
| OrderListRow | `app/components/orders/list/OrderListRow.tsx` | Yes | Two-line row; client name and meta truncate so money and stage chip stay pinned right |
| list-parts | `app/components/orders/list/list-parts.tsx` | Yes | B1's empty state; the figure/quick-action/filter chips now re-export from `patterns/list` (shared with C1) |
| patterns/list | `app/components/patterns/list.tsx` | Yes | Shared list vocabulary (summary figure, quick-action chip, filter chip) for B1 and C1; all wrap or truncate rather than overflow |
| ClientsListScreen | `app/components/clients/list/ClientsListScreen.tsx` | Yes | C1. Same `max-w-lg` single column as B1: two-figure summary card, quick actions, search, scrolling filter chips (type chips from the org's own field), hairline-divided list |
| ClientListRow | `app/components/clients/list/ClientListRow.tsx` | Yes | Name + `phone · type` truncate left; owes/order-count pinned right, shown only when the rollup is exact |
| ProductsListScreen | `app/components/products/list/ProductsListScreen.tsx` | Yes | D1. Same `max-w-lg` column as B1/C1, no summary card: quick actions, search, scrolling category chips (from the org's field), hairline-divided list of active + draft |
| ProductListRow | `app/components/products/list/ProductListRow.tsx` | Yes | Name + composed `category · size · material` subtitle truncate left; price (and Draft badge) pinned right |
| BusinessDetailsStep | `app/components/onboarding/BusinessDetailsStep.tsx` | Yes | A1. Single-column stack of full-width fields inside the setup panel; the currency row drills into the picker in place rather than opening a second surface |
| CurrencyPicker | `app/components/onboarding/CurrencyPicker.tsx` | Yes | Extracted from the retired CurrencyStep: `flex-wrap` shortlist chips + a scrolling searchable list capped at `max-h-64` |
| business-details-parts | `app/components/onboarding/business-details-parts.tsx` | Yes | A1's furniture: 20px-gutter screen, drill-in header, 44px field box, open-box, industry picker. Single column at any width, `max-w-md` centred above it |
